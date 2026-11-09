// 和宿主的 dsh-email 插件结合：通过公共工具执行接口调 email_list / email_read / email_mark /
// email_folders / email_draft，不读它的账号授权码，也不 import 它的内部模块。
// 边界很清楚：工作台负责「读、标、写草稿」，真正的发送留在 dsh-email 的草稿里由人确认。
import { randomUUID } from 'node:crypto'

const NEEDED = ['email_list', 'email_read', 'email_mark']
const OPTIONAL = ['email_folders', 'email_draft']
const DEFAULT_FOLDER = 'INBOX'

/**
 * 检测宿主的邮件工具是否可用。只看公共注册/执行接口，不发请求。
 * 和 media-desk 的做法一致：PTC 执行器只公布 run_code，会被判定为不可用。
 * @param {object} ctx - Cordis 上下文。
 * @returns {{tools: object, names: object}|null} 可用时返回执行器与工具定义。
 */
export function emailTool(ctx) {
  if (typeof ctx?.get !== 'function') return null
  const tools = ctx.get('tools')
  if (typeof tools?.execute !== 'function' || typeof tools?.executable !== 'function') return null
  try {
    const names = {}
    for (const name of [...NEEDED, ...OPTIONAL]) {
      const definition = tools.executable(name)
      if (definition) names[name] = definition
    }
    if (!NEEDED.every(name => names[name])) return null
    // 不再要求默认执行器在 describe() 里公布这些工具：PTC 执行器只公布 run_code，
    // 但 tools.execute 仍然按名字派发。真派发不了时会在 execute 阶段报出来。
    return { tools, names }
  } catch {
    // 执行器卸载/不可用时不影响 demo 和自建 IMAP
    return null
  }
}

async function call(ctx, name, args, { signal } = {}) {
  const selected = emailTool(ctx)
  if (!selected) throw new Error('没有找到 dsh-email 的邮件工具，或者当前执行器不支持直接调用')
  if (!selected.names[name]) throw new Error(`邮件插件没有提供 ${name}`)
  const id = `work-desk:${randomUUID()}`
  const timeout = AbortSignal.timeout(name === 'email_read' ? 60_000 : 30_000)
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout
  const batch = await selected.tools.execute({
    calls: [{ type: 'tool-call', id, name, arguments: JSON.stringify(args) }],
    signal: combined,
  })
  const result = batch.results?.find(entry => entry.callId === id)?.result
  if (result?.isError) {
    const message = String(result.error?.message ?? '邮件工具调用失败')
    // 把插件自己写的人话（比如「还没配置邮箱」「需要重新授权」）原样带出来
    throw new Error(message.slice(0, 400))
  }
  return result?.value ?? {}
}

function addressOf(value) {
  const first = Array.isArray(value) ? value[0] : value
  return { name: first?.name ?? '', address: first?.address ?? '' }
}

/** 把 dsh-email 的列表行映射成工作台自己的邮件行。 */
export function rowOf(message, { account = '', folder = DEFAULT_FOLDER } = {}) {
  const uid = message?.uid
  if (uid === undefined || uid === null) return null
  return {
    id: `${account || 'default'}:${folder}:${uid}`,
    uid,
    folder,
    account,
    from: addressOf(message.from),
    to: [],
    subject: message.subject || '(无主题)',
    snippet: '',
    date: message.date && !Number.isNaN(Date.parse(message.date)) ? new Date(message.date).toISOString() : new Date().toISOString(),
    unread: message.seen === false,
    starred: Boolean(message.flagged),
    hasAttachments: Boolean(message.hasAttachments),
    messageId: '',
    source: 'dsh-email',
    fetchedAt: new Date().toISOString(),
  }
}

/**
 * 同步收件箱。
 * @param {{ctx: object, settings: object}} deps - 上下文与设置。
 * @param {{limit?: number, folder?: string}} [options] - 同步参数。
 * @returns {Promise<{messages: object[], account: string, folder: string}>} 列表行。
 */
export async function listMail({ ctx, settings }, { limit = 40, folder = '', unreadOnly = false } = {}) {
  const account = settings.mail?.account || undefined
  const value = await call(ctx, 'email_list', {
    ...(account ? { account } : {}),
    ...(folder ? { folder } : {}),
    limit,
    unreadOnly,
  })
  const rows = (Array.isArray(value.messages) ? value.messages : [])
    .map(message => rowOf(message, { account: value.account ?? account ?? '', folder: value.folder ?? folder ?? DEFAULT_FOLDER }))
    .filter(Boolean)
  return { messages: rows, account: value.account ?? account ?? '', folder: value.folder ?? folder ?? DEFAULT_FOLDER }
}

/** 读一封的正文。 */
export async function readMailVia(ctx, { uid, folder = '', account = '' } = {}) {
  const value = await call(ctx, 'email_read', {
    uid,
    ...(folder ? { folder } : {}),
    ...(account ? { account } : {}),
  })
  return {
    subject: value.subject || '(无主题)',
    text: String(value.text ?? '').slice(0, 200_000),
    from: Array.isArray(value.from) ? value.from : [],
    to: Array.isArray(value.to) ? value.to : [],
    cc: Array.isArray(value.cc) ? value.cc : [],
    date: value.date ?? null,
    attachments: Array.isArray(value.attachments) ? value.attachments.map(file => ({ filename: file.filename ?? '附件', contentType: file.contentType ?? '', size: Number(file.size) || 0 })) : [],
    truncated: Boolean(value.truncated),
  }
}

/** 改标记：read / unread / star / unstar / move。 */
export async function markMailVia(ctx, { uid, folder = '', account = '', action }) {
  return call(ctx, 'email_mark', {
    uid,
    action,
    ...(folder ? { folder } : {}),
    ...(account ? { account } : {}),
  })
}

/** 列文件夹，顺带确认连接是否真的通。 */
export async function foldersVia(ctx, { account = '' } = {}) {
  const value = await call(ctx, 'email_folders', account ? { account } : {})
  return { account: value.account ?? account, folders: (Array.isArray(value.folders) ? value.folders : []).map(row => ({ name: row.name ?? row.path ?? '', path: row.path ?? row.name ?? '', specialUse: row.specialUse ?? '' })) }
}

/**
 * 写一封草稿。不投递 —— 发送由 dsh-email 的草稿箱确认，工作台不越过那道人工闸门。
 * @param {object} ctx - 上下文。
 * @param {{to: string, cc?: string, subject: string, text: string, replyTo?: {uid: any, folder?: string}}} draft - 草稿内容。
 */
export async function draftVia(ctx, draft) {
  const args = {
    to: draft.to,
    subject: draft.subject,
    text: draft.text,
    ...(draft.cc ? { cc: draft.cc } : {}),
    ...(draft.account ? { account: draft.account } : {}),
    ...(draft.replyTo ? { reply: { uid: draft.replyTo.uid, ...(draft.replyTo.folder ? { folder: draft.replyTo.folder } : {}), mode: 'reply' } } : {}),
  }
  const value = await call(ctx, 'email_draft', args)
  return { id: value.id, state: value.state, subject: value.subject }
}

/** 设置页的「测试连接」：只列文件夹，不发信。 */
export async function probe(ctx) {
  const value = await foldersVia(ctx, {})
  return { ok: true, account: value.account, folders: value.folders.map(row => row.path).slice(0, 40) }
}
