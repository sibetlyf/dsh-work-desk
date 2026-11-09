// 邮箱编排：同步、读正文、改标记、发信。
// 连接一用一关：办公台每次操作都是孤立的，长连接反而要处理断线重连和 IDLE。
import { ImapClient, openImap } from './imap.js'
import { parseHeaders, parseMessage, snippetOf, decodeWords } from './mime.js'
import { sendMail } from './smtp.js'

const SYNC_LIMIT = 40

function addressesOf(value) {
  const text = decodeWords(String(value ?? ''))
  return text.split(/,(?![^<]*>)/).map(row => row.trim()).filter(Boolean).map(row => {
    const match = /^(.*?)<([^>]+)>/.exec(row)
    return match ? { name: match[1].trim().replace(/^"|"$/g, ''), address: match[2].trim() } : { name: '', address: row.replace(/^"|"$/g, '') }
  })
}

/** 只用头部和 2KB 预览拼出列表行，不下载完整正文。 */
export function mailRow({ uid, folder, account, flags, internalDate, headers, preview }) {
  const map = parseHeaders(String(headers ?? ''))
  const ctype = String(map['content-type'] ?? '')
  const from = addressesOf(map.from)[0] ?? { name: '', address: '' }
  const cte = String(map['content-transfer-encoding'] ?? '8bit')
  let snippet = ''
  if (preview) {
    try {
      // 用同一套解析器解 2KB：base64 截断也能尽量解出前半段
      const fake = `Content-Type: ${ctype || 'text/plain; charset=utf-8'}\r\nContent-Transfer-Encoding: ${cte}\r\n\r\n${preview}`
      snippet = snippetOf(parseMessage(fake).text, 140)
    } catch {
      snippet = ''
    }
  }
  const date = map.date ? new Date(map.date) : internalDate ? new Date(internalDate) : new Date()
  return {
    id: `${account}:${folder}:${uid}`,
    uid,
    folder,
    account,
    from,
    to: addressesOf(map.to),
    subject: decodeWords(map.subject ?? '(无主题)'),
    snippet,
    date: Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString(),
    unread: !/\\Seen/i.test(flags ?? ''),
    starred: /\\Flagged/i.test(flags ?? ''),
    hasAttachments: /multipart\/mixed/i.test(ctype) || Boolean(map['content-disposition']),
    messageId: map['message-id'] ?? '',
    inReplyTo: map['in-reply-to'] ?? '',
    fetchedAt: new Date().toISOString(),
  }
}

export function imapConfigOf(settings) {
  const mail = settings.mail ?? {}
  return {
    host: mail.imap?.host ?? '',
    port: Number(mail.imap?.port) || 993,
    secure: mail.imap?.secure !== false,
    user: mail.imap?.user || mail.address || '',
    pass: mail.imap?.pass ?? '',
    mailbox: mail.folder || 'INBOX',
  }
}

export function smtpConfigOf(settings) {
  const mail = settings.mail ?? {}
  return {
    host: mail.smtp?.host ?? '',
    port: Number(mail.smtp?.port) || 465,
    secure: mail.smtp?.secure !== false,
    user: mail.smtp?.user || mail.address || '',
    pass: mail.smtp?.pass ?? '',
    from: mail.address || mail.smtp?.user || '',
  }
}

export function mailReady(settings) {
  if ((settings.mail?.provider ?? 'demo') !== 'imap') return false
  const config = imapConfigOf(settings)
  return Boolean(config.host && config.user && config.pass)
}

/**
 * 同步收件箱。只拉最近 SYNC_LIMIT 封里还没见过的那些。
 * @param {{store: object, settings: object}} deps - 状态存储与设置。
 * @returns {Promise<{added: number, updated: number, total: number, account: string}>} 同步结果。
 */
export async function syncInbox({ store, settings }) {
  const config = imapConfigOf(settings)
  if (!config.host || !config.user || !config.pass) throw new Error('还没配置 IMAP 服务器')
  const account = settings.mail?.address || config.user
  const client = await ImapClient.connect(config)
  try {
    await client.start()
    await client.login(config.user, config.pass)
    await client.select(config.mailbox)
    const uids = await client.uidSearch('ALL')
    const recent = uids.slice(-SYNC_LIMIT)
    const state = await store.read()
    const known = new Set(state.mails.filter(mail => mail.account === account && mail.folder === config.mailbox).map(mail => mail.uid))
    const missing = recent.filter(uid => !known.has(uid))
    // 一次最多补 25 封，剩下的下次同步继续，避免首次同步卡太久
    const rows = missing.length ? (await client.fetchHeaders(missing.slice(0, 25))).map(row => mailRow({ ...row, folder: config.mailbox, account })) : []
    if (!rows.length) return { added: 0, updated: 0, total: 0, account }
    const result = await store.mutate('同步邮件', draft => {
      let added = 0
      for (const row of rows) {
        const at = draft.mails.findIndex(mail => mail.id === row.id)
        if (at >= 0) draft.mails[at] = { ...draft.mails[at], ...row }
        else { draft.mails.push(row); added += 1 }
      }
      draft.mails.sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
      return { added, total: rows.length }
    }, { undoable: false })
    return { ...result, account }
  } finally {
    await client.logout().catch(() => {})
  }
}

/** 打开一封：拉全文、缓存下来、顺手标成已读。 */
export async function readMail({ store, settings, id }) {
  const state = await store.read()
  const mail = state.mails.find(row => row.id === id)
  if (!mail) throw new Error('找不到这封邮件')
  if (mail.body) return { mail, cached: true }
  if (!mail.uid || (settings.mail?.provider ?? 'demo') !== 'imap') return { mail, cached: true }
  const config = imapConfigOf(settings)
  config.mailbox = mail.folder
  const client = await openImap(config)
  let raw = ''
  try {
    raw = await client.fetchRaw(mail.uid)
    if (mail.unread) await client.storeFlags(mail.uid, 'add', ['\\Seen']).catch(() => {})
  } finally {
    await client.logout().catch(() => {})
  }
  const parsed = parseMessage(raw)
  const patch = {
    body: parsed.text,
    attachments: parsed.attachments,
    to: parsed.to.length ? parsed.to : mail.to,
    unread: false,
    snippet: mail.snippet || snippetOf(parsed.text, 140),
  }
  const next = await store.mutate('读取邮件', draft => {
    const row = draft.mails.find(item => item.id === id)
    if (row) Object.assign(row, patch)
    return draft
  }, { undoable: false })
  return { mail: next.mails.find(row => row.id === id), cached: false }
}

/** 改标记：本地立即生效，服务器失败只记 warning。 */
export async function markMail({ store, settings, id, action }) {
  const state = await store.read()
  const mail = state.mails.find(row => row.id === id)
  if (!mail) throw new Error('找不到这封邮件')
  const patch = action === 'read' ? { unread: false }
    : action === 'unread' ? { unread: true }
      : action === 'star' ? { starred: true }
        : action === 'unstar' ? { starred: false }
          : null
  if (!patch) throw new Error(`不支持的操作：${action}`)
  let warning = null
  if (mail.uid && (settings.mail?.provider ?? 'demo') === 'imap' && ['read', 'unread', 'star', 'unstar'].includes(action)) {
    const config = imapConfigOf(settings)
    config.mailbox = mail.folder
    try {
      const client = await openImap(config)
      try {
        const flag = action === 'star' || action === 'unstar' ? '\\Flagged' : '\\Seen'
        await client.storeFlags(mail.uid, action === 'unread' || action === 'unstar' ? 'remove' : 'add', [flag])
      } finally {
        await client.logout().catch(() => {})
      }
    } catch (err) {
      warning = `服务器没同步到：${err.message}`
    }
  }
  const next = await store.mutate(action === 'star' ? '星标邮件' : action === 'unstar' ? '取消星标' : '标记邮件', draft => {
    const row = draft.mails.find(item => item.id === id)
    if (row) Object.assign(row, patch)
    return draft
  })
  return { state: next, warning }
}

export function composeMessage({ from, to, cc, subject, text, replyTo }) {
  const parent = replyTo ?? null
  const header = parent
    ? `\r\n\r\n------ 原邮件 ------\r\n发件人：${parent.from?.name || ''} <${parent.from?.address || ''}>\r\n时间：${new Date(parent.date).toLocaleString('zh-CN')}\r\n主题：${parent.subject}\r\n\r\n${parent.body || parent.snippet || ''}`
    : ''
  return {
    from,
    to,
    cc: cc ?? '',
    subject,
    text: `${text}${header}`,
    inReplyTo: parent?.messageId ?? '',
    references: parent ? `${parent.references ? `${parent.references} ` : ''}${parent.messageId}`.trim() : '',
  }
}

/** 真正发出去。只有用户在界面上确认后才会调到这里。 */
export async function sendNow({ store, settings, draft }) {
  const config = smtpConfigOf(settings)
  if (!config.host) throw new Error('还没配置 SMTP 服务器')
  const parent = draft.replyToId ? (await store.read()).mails.find(row => row.id === draft.replyToId) : null
  const message = composeMessage({ ...config, ...draft, replyTo: parent })
  // 连接参数在 config 上，正文在 message 上，发信函数要的是合在一起的一份
  const { messageId } = await sendMail({ ...config, ...message })
  const next = await store.mutate('发送邮件', state => {
    state.mails.unshift({
      id: `sent:${messageId}`,
      uid: null,
      folder: 'Sent',
      account: settings.mail?.address || config.user,
      from: { name: '', address: config.from },
      to: [{ name: '', address: draft.to }],
      subject: draft.subject,
      snippet: snippetOf(draft.text, 140),
      body: draft.text,
      date: new Date().toISOString(),
      unread: false,
      starred: false,
      sent: true,
      messageId,
    })
    state.drafts = (state.drafts ?? []).filter(row => row.id !== draft.id)
    return state
  }, { undoable: false })
  return { messageId, state: next }
}

/** 设置页的「测试连接」：只登录不发信。 */
export async function testImap(settings) {
  const config = imapConfigOf(settings)
  const client = await ImapClient.connect(config)
  try {
    await client.start()
    await client.login(config.user, config.pass)
    const info = await client.select(config.mailbox)
    const folders = await client.list()
    return { ok: true, exists: info.exists, folders: folders.map(row => row.name).slice(0, 30) }
  } finally {
    await client.logout().catch(() => {})
  }
}
