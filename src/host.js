// dsh-work-desk host 半片：/work-desk/* 接口、定时同步、模型调用。
import { assistantModelOverride, callModel, chatPrompts, defaultSelection, extractJson, modelInfo, modelStatus, setAssistantModel } from './ai.js'
import { buildIcs, parseIcs } from './calendar.js'
import { briefInput, generateBrief } from './brief.js'
import { localIntent } from './intents.js'
import { applyOps, newId } from './ops.js'
import { QuoteBoard, fetchMinute, normalizeCode } from './quotes.js'
import { mailConfigured, mailReady, Settings, publicSettings } from './settings.js'
import { Store } from './store.js'
import { createScheduler, evaluateAlerts } from './sync.js'
import { imapConfigOf, markMail, readMail, sendNow, syncInbox, testImap } from './mail/service.js'
import { draftVia, emailTool, foldersVia, listMail, markMailVia, probe, readMailVia } from './mail/dshmail.js'
import { snippetOf } from './mail/mime.js'

const MAX_JSON = 4_000_000

function json(res, status, body) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(body))
}

function text(res, status, body, type = 'text/plain; charset=utf-8') {
  res.statusCode = status
  res.setHeader('content-type', type)
  res.setHeader('cache-control', 'no-store')
  res.end(body)
}

async function readJson(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_JSON) throw Object.assign(new Error('内容太大'), { status: 413 })
    chunks.push(chunk)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    throw Object.assign(new Error('请求不是有效的 JSON'), { status: 400 })
  }
}

export function codesOf(state) {
  return [...new Set([...(state.watchlist ?? []).map(row => row.code), ...(state.positions ?? []).map(row => row.code)].filter(Boolean))]
}

/** 一次读齐界面要的东西：状态、行情、提醒、模型状态。 */
async function statePayload(ctx, desk) {
  const state = await desk.store.read()
  const codes = codesOf(state)
  let snap = desk.board.snapshot(codes)
  if (snap.missing.length) {
    try {
      snap = await desk.board.refresh(codes)
    } catch {
      snap = desk.board.snapshot(codes)
    }
  }
  const settings = await desk.settings.read()
  const plugin = Boolean(emailTool(ctx))
  return {
    state,
    quotes: snap.quotes,
    quoteError: snap.error,
    quotesAt: snap.fetchedAt,
    alerts: evaluateAlerts(state, snap.quotes),
    canUndo: desk.store.undo.length > 0,
    model: modelInfo(ctx)?.label ?? null,
    modelOk: modelStatus.ok,
    modelError: modelStatus.error,
    mail: {
      configured: mailConfigured(settings),
      ready: mailReady(settings, plugin),
      provider: settings.mail?.provider ?? 'demo',
      account: settings.mail?.account ?? '',
      address: settings.mail?.address ?? '',
      pluginAvailable: plugin,
      pluginDraft: plugin && Boolean(emailTool(ctx)?.names.email_draft),
      ...desk.scheduler.status(),
    },
    brief: state.brief ?? null,
  }
}

async function chatTurn(ctx, desk, body) {
  const message = String(body.message || '').trim()
  if (!message) throw Object.assign(new Error('消息为空'), { status: 400 })
  const focusId = typeof body.focusId === 'string' ? body.focusId : undefined
  const state = await desk.store.read()
  const quotes = desk.board.snapshot(codesOf(state)).quotes
  let plan
  let engine = 'local'
  let notice = null
  const wasDown = modelStatus.ok === false
  try {
    const history = (state.chat ?? []).filter(row => (row.itemId ?? null) === (focusId ?? null))
    const { system, user } = chatPrompts(state, message, { focusId, history, now: new Date() })
    const { text: raw, model } = await callModel(ctx, { system, user, maxTokens: 1600, signal: AbortSignal.timeout(90_000) })
    engine = model
    try {
      plan = extractJson(raw)
      if (typeof plan.reply !== 'string') plan.reply = '处理好了。'
    } catch {
      plan = { reply: raw.trim().slice(0, 600) || '我没听懂，可以换个说法吗？', ops: [] }
    }
  } catch {
    notice = wasDown ? null : '模型暂时用不了，先用本地规则处理'
    plan = localIntent(state, message, { focusId, quotes, now: new Date() })
  }
  const changed = await desk.store.mutate(`对话：${message.slice(0, 16)}`, draft => {
    const { receipts, errors } = applyOps(draft, plan.ops)
    return { receipts, errors }
  })
  // 邮件标记要同步到服务器：本地先改了，服务器失败不影响界面
  for (const op of Array.isArray(plan.ops) ? plan.ops : []) {
    if (op?.op === 'mark_mail' && op.id) markMail({ store: desk.store, settings: await desk.settings.read(), id: op.id, action: op.action }).catch(() => {})
  }
  const actions = (Array.isArray(plan.actions) ? plan.actions : [])
    .filter(action => action && ['open_mail', 'open_event', 'nav', 'sync_mail', 'refresh_quotes', 'brief'].includes(action.type))
  const result = await desk.store.mutate('对话记录', draft => {
    const at = new Date().toISOString()
    draft.chat.push({ id: newId('c'), at, role: 'user', text: message, itemId: focusId })
    const answer = {
      id: newId('c'), at, role: 'assistant', text: plan.reply,
      receipts: changed.receipts, errors: changed.errors, engine, notice,
      undoable: changed.receipts.length > 0, itemId: focusId,
    }
    draft.chat.push(answer)
    draft.chat = draft.chat.slice(-200)
    return { answer, state: draft }
  }, { undoable: false })
  return { state: result.state, answer: result.answer, actions, modelOk: modelStatus.ok, modelError: modelStatus.error }
}

/**
 * 邮件来源分发：dsh-email 走宿主工具，imap 走自建客户端。
 * 两条路都把结果写进同一份 state.mails，界面不用关心信是从哪来的。
 */
async function syncMailbox(ctx, store, settings) {
  const provider = settings.mail?.provider ?? 'demo'
  if (provider === 'dsh-email') {
    const { messages, account } = await listMail({ ctx, settings }, { limit: 40 })
    const result = await store.mutate('同步邮件', draft => {
      let added = 0
      for (const row of messages) {
        const at = draft.mails.findIndex(mail => mail.id === row.id)
        if (at >= 0) {
          const previous = draft.mails[at]
          // 已经读到过的正文和摘要保留，只更新服务器上的状态（已读、星标、附件）
          draft.mails[at] = { ...previous, ...row, snippet: previous.snippet || row.snippet, body: previous.body ?? row.body, to: previous.to?.length ? previous.to : row.to }
        } else {
          draft.mails.push(row)
          added += 1
        }
      }
      draft.mails.sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
      return { added, total: messages.length }
    }, { undoable: false })
    return { ...result, account, folder: 'INBOX', provider }
  }
  const result = await syncInbox({ store, settings })
  return { ...result, provider: 'imap' }
}

async function readMailbox(ctx, store, settings, id) {
  if ((settings.mail?.provider ?? 'demo') !== 'dsh-email') return readMail({ store, settings, id })
  const state = await store.read()
  const mail = state.mails.find(row => row.id === id)
  if (!mail) throw new Error('找不到这封邮件')
  if (mail.body) return { mail, cached: true }
  const body = await readMailVia(ctx, { uid: mail.uid, folder: mail.folder, account: mail.account })
  if (mail.unread) markMailVia(ctx, { uid: mail.uid, folder: mail.folder, account: mail.account, action: 'read' }).catch(() => {})
  const patch = {
    body: body.text,
    attachments: body.attachments,
    to: body.to.length ? body.to.map(row => ({ name: row.name ?? '', address: row.address ?? '' })) : mail.to,
    unread: false,
    snippet: mail.snippet || snippetOf(body.text, 140),
  }
  const next = await store.mutate('读取邮件', draft => {
    const row = draft.mails.find(item => item.id === id)
    if (row) Object.assign(row, patch)
    return draft
  }, { undoable: false })
  return { mail: next.mails.find(row => row.id === id), cached: false }
}

async function markMailbox(ctx, store, settings, id, action) {
  if ((settings.mail?.provider ?? 'demo') !== 'dsh-email') return markMail({ store, settings, id, action })
  const state = await store.read()
  const mail = state.mails.find(row => row.id === id)
  if (!mail) throw new Error('找不到这封邮件')
  let warning = null
  try {
    await markMailVia(ctx, { uid: mail.uid, folder: mail.folder, account: mail.account, action })
  } catch (err) {
    warning = `邮件插件没同步到：${err.message}`
  }
  const patch = action === 'read' ? { unread: false }
    : action === 'unread' ? { unread: true }
      : action === 'star' ? { starred: true }
        : action === 'unstar' ? { starred: false }
          : null
  if (!patch) throw new Error(`不支持的操作：${action}`)
  const next = await store.mutate('标记邮件', draft => {
    const row = draft.mails.find(item => item.id === id)
    if (row) Object.assign(row, patch)
    return draft
  })
  return { state: next, warning }
}

async function route(ctx, desk, req, res) {
  const url = new URL(req.url || '/', 'http://local')
  const path = url.pathname.replace(/^\/work-desk\/?/, '')
  const method = req.method || 'GET'

  if (method === 'GET') {
    if (path === 'state') return json(res, 200, await statePayload(ctx, desk))
    if (path === 'quotes') {
      const codes = String(url.searchParams.get('codes') ?? '').split(',').filter(Boolean)
      const snap = await desk.board.refresh(codes, { force: url.searchParams.get('force') === '1' })
      return json(res, 200, snap)
    }
    if (path === 'quote/minute') {
      const code = normalizeCode(url.searchParams.get('code') ?? '')
      if (!code) return json(res, 400, { error: '代码无效' })
      return json(res, 200, await desk.board.minute(code, { force: url.searchParams.get('force') === '1' }))
    }
    if (path === 'brief') {
      const state = await desk.store.read()
      const snap = desk.board.snapshot(codesOf(state))
      return json(res, 200, { brief: state.brief ?? null, input: briefInput(state, snap.quotes) })
    }
    if (path === 'ics') {
      const state = await desk.store.read()
      const range = url.searchParams.get('range') ?? 'forward'
      const events = range === 'all' ? state.events : state.events.filter(event => new Date(event.end ?? event.start) >= new Date(Date.now() - 7 * 86400000))
      return text(res, 200, buildIcs(events), 'text/calendar; charset=utf-8')
    }
    if (path === 'mail/folders') {
      const settings = await desk.settings.read()
      if ((settings.mail?.provider ?? 'demo') !== 'dsh-email') return json(res, 200, { folders: [] })
      try {
        return json(res, 200, await foldersVia(ctx, { account: settings.mail?.account || '' }))
      } catch (err) {
        return json(res, 200, { folders: [], error: err.message })
      }
    }
    if (path === 'models') {
      const llm = ctx.get('llm')
      const providers = llm ? await llm.listProviders() : []
      const settled = await Promise.allSettled(providers.map(async p => ({
        provider: p.id,
        name: p.name,
        models: (await llm.listModels(p.id)).map(m => ({ id: m.id, name: m.name || m.id })),
      })))
      return json(res, 200, {
        providers: settled.filter(row => row.status === 'fulfilled').map(row => row.value).filter(p => p.models.length),
        default: defaultSelection(ctx),
        current: assistantModelOverride(),
      })
    }
    if (path === 'settings') {
      return json(res, 200, publicSettings(await desk.settings.read()))
    }
    return json(res, 404, { error: '接口不存在' })
  }
  if (method !== 'POST') return json(res, 405, { error: '不支持的方法' })

  // 所有写操作都拒绝跨站请求
  const site = req.headers['sec-fetch-site']
  if (site && site !== 'same-origin' && site !== 'none') return json(res, 403, { error: '拒绝跨站请求' })

  const body = await readJson(req)
  switch (path) {
    case 'ops': {
      const label = typeof body.label === 'string' ? body.label : '操作'
      const result = await desk.store.mutate(label, draft => {
        const applied = applyOps(draft, body.ops)
        return { ...applied, state: draft }
      }, { undoable: body.undoable !== false })
      return json(res, 200, result)
    }
    case 'undo': {
      const label = await desk.store.undoLast()
      return json(res, 200, { label, state: await desk.store.read(), canUndo: desk.store.undo.length > 0 })
    }
    case 'chat': return json(res, 200, await chatTurn(ctx, desk, body))
    case 'mail/sync': {
      const settings = await desk.settings.read()
      try {
        const result = await syncMailbox(ctx, desk.store, settings)
        return json(res, 200, { ...result, state: await desk.store.read() })
      } catch (err) {
        return json(res, 200, { error: err.message, state: await desk.store.read() })
      }
    }
    case 'mail/read': {
      const settings = await desk.settings.read()
      const { mail } = await readMailbox(ctx, desk.store, settings, String(body.id))
      return json(res, 200, { mail, state: await desk.store.read() })
    }
    case 'mail/mark': {
      const settings = await desk.settings.read()
      const result = await markMailbox(ctx, desk.store, settings, String(body.id), String(body.action))
      return json(res, 200, result)
    }
    case 'mail/draft': {
      // 只在 dsh-email 模式下用：写进它的草稿箱，发送由人在 DSH 里确认
      const settings = await desk.settings.read()
      if ((settings.mail?.provider ?? 'demo') !== 'dsh-email') return json(res, 400, { error: '当前不是 DSH 邮件插件模式' })
      const state = await desk.store.read()
      const parent = body.replyToId ? state.mails.find(row => row.id === body.replyToId) : null
      if (!String(body.to ?? '').trim() || !String(body.subject ?? '').trim()) return json(res, 400, { error: '收件人和主题都要填' })
      try {
        const draft = await draftVia(ctx, {
          to: String(body.to),
          cc: body.cc ? String(body.cc) : '',
          subject: String(body.subject),
          text: String(body.text ?? ''),
          account: settings.mail?.account || '',
          replyTo: parent?.uid !== undefined ? { uid: parent.uid, folder: parent.folder } : undefined,
        })
        return json(res, 200, { ok: true, ...draft })
      } catch (err) {
        return json(res, 200, { error: err.message })
      }
    }
    case 'mail/send': {
      const settings = await desk.settings.read()
      if ((settings.mail?.provider ?? 'demo') === 'dsh-email') {
        return json(res, 400, { error: '当前用 DSH 邮件插件收信：发送要在它的草稿里确认，工作台只写草稿' })
      }
      const draft = {
        id: body.draftId ?? newId('d'),
        to: String(body.to ?? ''),
        cc: String(body.cc ?? ''),
        subject: String(body.subject ?? ''),
        text: String(body.text ?? ''),
        replyToId: body.replyToId ?? null,
      }
      if (!draft.to || !draft.subject) return json(res, 400, { error: '收件人和主题都要填' })
      try {
        const result = await sendNow({ store: desk.store, settings, draft })
        return json(res, 200, { ok: true, messageId: result.messageId, state: result.state })
      } catch (err) {
        return json(res, 200, { error: err.message, state: await desk.store.read() })
      }
    }
    case 'brief/generate': {
      const state = await desk.store.read()
      const quotes = desk.board.snapshot(codesOf(state)).quotes
      const { brief, state: next } = await generateBrief({ ctx, store: desk.store, quotes })
      return json(res, 200, { brief, state: next })
    }
    case 'ics/import': {
      const { events, skipped } = parseIcs(String(body.text ?? ''))
      if (!events.length) return json(res, 400, { error: '没有解析到日程' })
      const state = await desk.store.mutate('导入日历', draft => {
        let added = 0
        for (const event of events) {
          if (event.icsUid && draft.events.some(row => row.icsUid === event.icsUid)) continue
          draft.events.push({ ...event, id: newId('e'), createdAt: new Date().toISOString(), sample: false })
          added += 1
        }
        draft.events.sort((a, b) => new Date(a.start) - new Date(b.start))
        return { added }
      })
      return json(res, 200, { added: state.added, skipped, total: events.length, state: await desk.store.read() })
    }
    case 'settings': {
      const before = modelInfo(ctx)
      const updated = await desk.settings.update(body)
      setAssistantModel(updated.assistant)
      const after = modelInfo(ctx)
      if (before?.provider !== after?.provider || before?.model !== after?.model) Object.assign(modelStatus, { ok: null, error: null })
      await desk.scheduler.start()
      return json(res, 200, { ...publicSettings(updated), assistantEffective: modelInfo(ctx)?.label ?? null })
    }
    case 'settings/test-mail': {
      if (body.provider === 'dsh-email') {
        try {
          return json(res, 200, await probe(ctx))
        } catch (err) {
          return json(res, 200, { ok: false, error: err.message })
        }
      }
      const current = await desk.settings.read()
      const candidate = {
        ...current,
        mail: {
          ...current.mail,
          provider: 'imap',
          address: body.address ?? current.mail.address,
          folder: body.folder ?? current.mail.folder,
          imap: {
            ...current.mail.imap,
            ...(body.imap ?? {}),
            // 表单里密码留空表示沿用已保存的那个
            pass: body.imap?.pass || current.mail.imap.pass,
            user: body.imap?.user || current.mail.imap.user || body.address || current.mail.address,
          },
        },
      }
      try {
        const result = await testImap(candidate)
        return json(res, 200, result)
      } catch (err) {
        return json(res, 200, { ok: false, error: err.message })
      }
    }
    default: return json(res, 404, { error: '接口不存在' })
  }
}

/**
 * Web 服务不会替插件路由鉴权，所以每个请求都要自己走一遍 Host/Origin 和登录凭证检查。
 * 拿不到鉴权服务时一律拒绝。
 */
export function requestRejection(ctx, req) {
  const connection = ctx.get('connection')
  if (typeof connection?.requestRejection !== 'function') return 403
  return connection.requestRejection({ headers: req.headers })
}

export const name = 'dsh-work-desk'

export default {
  inject: ['webServer', 'connection'],
  apply(ctx) {
    const store = new Store()
    const settings = new Settings(store.root)
    const board = new QuoteBoard()
    const desk = {
      store,
      settings,
      board,
    }
    desk.scheduler = createScheduler({
      store,
      settings,
      board,
      syncMail: async () => {
        const current = await settings.read()
        if ((current.mail.provider ?? 'demo') === 'demo') return { skipped: true }
        return syncMailbox(ctx, store, current)
      },
      onError: err => { desk.lastError = err.message },
    })
    settings.read().then(saved => setAssistantModel(saved.assistant)).catch(() => {})
    ctx.effect(() => {
      desk.scheduler.start().catch(() => {})
      return () => desk.scheduler.stop()
    }, 'dsh-work-desk: timers')
    ctx.effect(() => ctx.webServer.register({
      kind: 'prefix',
      path: '/work-desk',
      handler: async (req, res) => {
        try {
          const rejection = requestRejection(ctx, req)
          if (rejection) {
            json(res, rejection, { error: '未授权' })
            return
          }
          await route(ctx, desk, req, res)
        } catch (err) {
          if (res.headersSent) {
            res.end()
            return
          }
          json(res, err.status || 500, { error: err.message })
        }
      },
    }), 'dsh-work-desk: /work-desk routes')
  },
}
