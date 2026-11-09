// 工作台的唯一写入口：界面操作和对话都走这里，统一校验字段并产出回执。
// 模型输出也是不可信输入，所以这里只放行白名单字段。
import { fmtDate, fmtTime } from './calendar.js'
import { normalizeCode, displaySymbol } from './quotes.js'

export const EVENT_STATUS = ['confirmed', 'tentative', 'cancelled']
export const COLORS = ['blue', 'violet', 'amber', 'green', 'rose', 'slate']
export const ALERT_KINDS = ['price', 'task', 'event']

let counter = 0
export function newId(prefix = 'x') {
  counter += 1
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`
}

const EVENT_FIELDS = { title: 'text', start: 'date', end: 'date', allDay: 'bool', location: 'text', notes: 'text', attendees: 'list', color: 'color', status: 'eventStatus', source: 'text', mailId: 'id', calendar: 'text' }
const TASK_FIELDS = { title: 'text', due: 'date', done: 'bool', priority: 'num', tags: 'list', note: 'text', eventId: 'id', mailId: 'id' }
const WATCH_FIELDS = { code: 'symbol', name: 'text', note: 'text' }
const POSITION_FIELDS = { code: 'symbol', name: 'text', shares: 'num', cost: 'num' }
const DRAFT_FIELDS = { to: 'text', cc: 'text', subject: 'text', text: 'text', replyToId: 'id' }
const ALERT_FIELDS = { kind: 'alertKind', code: 'symbol', threshold: 'num', direction: 'direction', enabled: 'bool', label: 'text' }

function coerce(type, value) {
  switch (type) {
    case 'text': return typeof value === 'string' ? value.slice(0, 20000) : undefined
    case 'id': return value === null || typeof value === 'string' ? value : undefined
    case 'bool': return typeof value === 'boolean' ? value : undefined
    case 'num': return Number.isFinite(Number(value)) ? Number(value) : undefined
    case 'list': return Array.isArray(value) ? value.filter(v => typeof v === 'string').slice(0, 30) : undefined
    case 'date': {
      if (value === null) return null
      if (typeof value !== 'string') return undefined
      const parsed = new Date(value)
      return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString()
    }
    case 'color': return COLORS.includes(value) ? value : undefined
    case 'eventStatus': return EVENT_STATUS.includes(value) ? value : undefined
    case 'alertKind': return ALERT_KINDS.includes(value) ? value : undefined
    case 'direction': return ['up', 'down'].includes(value) ? value : undefined
    case 'symbol': {
      if (typeof value !== 'string') return undefined
      return normalizeCode(value) ?? undefined
    }
    default: return undefined
  }
}

function pick(fields, input) {
  const out = {}
  for (const [key, type] of Object.entries(fields)) {
    if (input?.[key] === undefined) continue
    const value = coerce(type, input[key])
    if (value !== undefined) out[key] = value
  }
  return out
}

function findById(list, id, label = '对象') {
  const entry = list.find(row => row.id === id)
  if (!entry) throw new Error(`找不到${label}：${id}`)
  return entry
}

function short(text, n = 18) {
  const s = String(text ?? '').trim()
  return s.length > n ? `${s.slice(0, n)}…` : s
}

export function fmtWhen(iso) {
  if (!iso) return '未排期'
  return `${fmtDate(iso)} ${fmtTime(iso)}`
}

const handlers = {
  /* ------------------------------ 日程 ------------------------------ */
  add_event(state, op, now) {
    const fields = pick(EVENT_FIELDS, op)
    if (!fields.title) throw new Error('会议要有标题')
    if (!fields.start) throw new Error('会议要有开始时间')
    const start = new Date(fields.start)
    const end = fields.end ? new Date(fields.end) : new Date(start.getTime() + 30 * 60000)
    if (end <= start) throw new Error('结束时间要晚于开始时间')
    const event = {
      id: newId('e'), allDay: false, location: '', notes: '', attendees: [], color: 'blue',
      status: 'confirmed', source: 'manual', createdAt: now,
      ...fields, start: start.toISOString(), end: end.toISOString(),
    }
    state.events.push(event)
    state.events.sort((a, b) => new Date(a.start) - new Date(b.start))
    return { text: `新增日程「${short(event.title)}」${fmtWhen(event.start)}`, target: event.id, kind: 'event' }
  },
  update_event(state, op, now) {
    const event = findById(state.events, op.id, '日程')
    const fields = pick(EVENT_FIELDS, op)
    if (fields.start && !fields.end) {
      // 只改开始时间时，保持原来的时长
      const span = new Date(event.end) - new Date(event.start)
      fields.end = new Date(new Date(fields.start).getTime() + Math.max(span, 60000)).toISOString()
    }
    Object.assign(event, fields, { updatedAt: now })
    state.events.sort((a, b) => new Date(a.start) - new Date(b.start))
    return { text: `改了「${short(event.title)}」${fields.start ? `的时间：${fmtWhen(event.start)}` : ''}`.trim(), target: event.id, kind: 'event' }
  },
  delete_event(state, op) {
    const event = findById(state.events, op.id, '日程')
    state.events = state.events.filter(row => row.id !== op.id)
    for (const task of state.tasks) if (task.eventId === op.id) delete task.eventId
    return { text: `删掉了日程「${short(event.title)}」`, target: null }
  },
  set_event_status(state, op) {
    const event = findById(state.events, op.id, '日程')
    const status = coerce('eventStatus', op.status)
    if (!status) throw new Error('状态无效')
    event.status = status
    return { text: `「${short(event.title)}」改成${status === 'confirmed' ? '已确认' : status === 'tentative' ? '待定' : '已取消'}`, target: event.id, kind: 'event' }
  },

  /* ------------------------------ 待办 ------------------------------ */
  add_task(state, op, now) {
    const fields = pick(TASK_FIELDS, op)
    if (!fields.title) throw new Error('待办要有内容')
    const task = { id: newId('t'), due: null, done: false, priority: 0, tags: [], note: '', createdAt: now, ...fields }
    state.tasks.unshift(task)
    return { text: `记下待办「${short(task.title)}」${task.due ? `，${fmtWhen(task.due)} 前` : ''}`, target: task.id, kind: 'task' }
  },
  update_task(state, op) {
    const task = findById(state.tasks, op.id, '待办')
    Object.assign(task, pick(TASK_FIELDS, op))
    return { text: `更新待办「${short(task.title)}」`, target: task.id, kind: 'task' }
  },
  toggle_task(state, op) {
    const task = findById(state.tasks, op.id, '待办')
    task.done = typeof op.done === 'boolean' ? op.done : !task.done
    task.doneAt = task.done ? new Date().toISOString() : null
    return { text: `「${short(task.title)}」${task.done ? '做完了' : '重新打开'}`, target: task.id, kind: 'task' }
  },
  delete_task(state, op) {
    const task = findById(state.tasks, op.id, '待办')
    state.tasks = state.tasks.filter(row => row.id !== op.id)
    return { text: `删掉待办「${short(task.title)}」`, target: null }
  },

  /* ------------------------------ 行情 ------------------------------ */
  add_watch(state, op) {
    const code = coerce('symbol', op.code)
    if (!code) throw new Error('股票代码无效')
    if (state.watchlist.some(row => row.code === code)) return { text: `${displaySymbol(code)} 已经在自选里了` }
    const name = coerce('text', op.name) || displaySymbol(code)
    const row = { code, name, note: coerce('text', op.note) || '' }
    state.watchlist.push(row)
    const label = name === displaySymbol(code) ? displaySymbol(code) : `${name}（${displaySymbol(code)}）`
    return { text: `把 ${label} 加进自选`, target: code, kind: 'watch' }
  },
  remove_watch(state, op) {
    const code = coerce('symbol', op.code)
    const row = state.watchlist.find(item => item.code === code)
    if (!row) throw new Error('自选里没有这只')
    state.watchlist = state.watchlist.filter(item => item.code !== code)
    return { text: `从自选里移除了 ${row.name}` }
  },
  add_position(state, op) {
    const code = coerce('symbol', op.code)
    if (!code) throw new Error('股票代码无效')
    const fields = pick(POSITION_FIELDS, op)
    if (!Number.isFinite(fields.shares) || fields.shares <= 0) throw new Error('股数要大于 0')
    if (!Number.isFinite(fields.cost) || fields.cost <= 0) throw new Error('成本价要大于 0')
    const row = { id: newId('p'), name: fields.name || displaySymbol(code), ...fields, code, createdAt: new Date().toISOString() }
    state.positions.push(row)
    if (!state.watchlist.some(item => item.code === code)) state.watchlist.push({ code, name: row.name })
    return { text: `记下持仓：${row.name} ${row.shares} 股，成本 ${row.cost}`, target: row.id, kind: 'position' }
  },
  update_position(state, op) {
    const row = findById(state.positions, op.id, '持仓')
    Object.assign(row, pick(POSITION_FIELDS, op))
    return { text: `更新持仓「${row.name}」`, target: row.id, kind: 'position' }
  },
  remove_position(state, op) {
    const row = findById(state.positions, op.id, '持仓')
    state.positions = state.positions.filter(item => item.id !== op.id)
    return { text: `清掉持仓「${row.name}」` }
  },
  add_alert(state, op, now) {
    const fields = pick(ALERT_FIELDS, op)
    if (!fields.kind) throw new Error('提醒类型无效')
    const alert = { id: newId('a'), enabled: true, createdAt: now, ...fields }
    state.alerts.push(alert)
    return { text: `加了一条${alert.kind === 'price' ? '股价' : alert.kind === 'task' ? '待办' : '日程'}提醒` }
  },
  remove_alert(state, op) {
    state.alerts = state.alerts.filter(row => row.id !== op.id)
    return { text: '删掉了一条提醒' }
  },

  /* ------------------------------ 邮件 ------------------------------ */
  mark_mail(state, op) {
    const mail = findById(state.mails, op.id, '邮件')
    if (op.action === 'read') mail.unread = false
    else if (op.action === 'unread') mail.unread = true
    else if (op.action === 'star') mail.starred = true
    else if (op.action === 'unstar') mail.starred = false
    else throw new Error('不支持的邮件操作')
    return { text: `${op.action === 'read' ? '标为已读' : op.action === 'unread' ? '标为未读' : op.action === 'star' ? '加了星标' : '取消星标'}：${short(mail.subject, 14)}`, target: mail.id, kind: 'mail' }
  },
  add_draft(state, op, now) {
    const fields = pick(DRAFT_FIELDS, op)
    if (!fields.to) throw new Error('草稿要有收件人')
    if (!fields.subject) throw new Error('草稿要有主题')
    const draft = { id: newId('d'), cc: '', text: '', createdAt: now, ...fields }
    state.drafts.unshift(draft)
    return { text: `写好了给 ${draft.to} 的草稿《${short(draft.subject, 14)}》`, target: draft.id, kind: 'draft' }
  },
  update_draft(state, op) {
    const draft = findById(state.drafts, op.id, '草稿')
    Object.assign(draft, pick(DRAFT_FIELDS, op))
    return { text: `更新了草稿《${short(draft.subject, 14)}》`, target: draft.id, kind: 'draft' }
  },
  delete_draft(state, op) {
    const draft = findById(state.drafts, op.id, '草稿')
    state.drafts = state.drafts.filter(row => row.id !== op.id)
    return { text: `丢弃了草稿《${short(draft.subject, 14)}》` }
  },

  /* ------------------------------ 维护 ------------------------------ */
  clear_samples(state) {
    const strip = key => { state[key] = state[key].filter(row => !row.sample) }
    for (const key of ['events', 'tasks', 'mails', 'watchlist', 'positions', 'alerts', 'drafts']) strip(key)
    state.brief = null
    state.briefs = []
    state.sampleCleared = true
    return { text: '已清空全部示例数据' }
  },
}

/**
 * 依次执行一批操作。任何一条失败都不影响已成功的操作，失败写进回执。
 * @param {object} state - 会被就地修改的状态。
 * @param {Array<object>} ops - 操作列表。
 * @returns {{receipts: Array<object>, errors: string[]}} 面向用户的回执。
 */
export function applyOps(state, ops) {
  const receipts = []
  const errors = []
  const now = new Date().toISOString()
  for (const op of Array.isArray(ops) ? ops : []) {
    const handler = Object.hasOwn(handlers, op?.op) ? handlers[op.op] : undefined
    if (!handler) {
      errors.push(`不支持的操作：${String(op?.op)}`)
      continue
    }
    try {
      const receipt = handler(state, op, now)
      if (receipt) receipts.push(receipt)
    } catch (err) {
      errors.push(err.message)
    }
  }
  return { receipts, errors }
}
