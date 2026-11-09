// 把工作台接进 DSH 对话：注册成宿主工具，Agent 在主会话里就能直接读写日程、待办和行情。
// 写入仍然走 applyOps（同一套白名单和回执），所以工具调用和界面点按是等价的两条入口。
import { applyOps } from './ops.js'
import { addDays, eventsOnDay, fmtTime } from './calendar.js'
import { evaluateAlerts } from './sync.js'

function codesOf(state) {
  return [...new Set([...(state.watchlist ?? []).map(row => row.code), ...(state.positions ?? []).map(row => row.code)].filter(Boolean))]
}

const CALENDAR = {
  name: 'work_desk_calendar',
  description: [
    '读写「办公工作台」的日程。用户说「安排/约/加个会/改到几点/取消这个会/今天有什么会」时用它。',
    '时间一律用带时区的 ISO 8601（例如 2026-11-11T15:00:00+08:00）；只说「明天下午三点」时按对话里给出的当前时间推算。',
    '只改开始时间时 end 可以省略，会沿用原来的时长。',
  ].join(' '),
  parameters: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['add', 'update', 'delete', 'list'], description: '要做什么' },
      id: { type: 'string', description: 'update/delete 时的日程 id；list 不需要' },
      title: { type: 'string', description: '会议主题' },
      start: { type: 'string', description: '开始时间，ISO 8601 带时区' },
      end: { type: 'string', description: '结束时间，ISO 8601 带时区；省略时 add 默认 30 分钟' },
      minutes: { type: 'number', description: '只给开始时间时，用分钟数表达时长（例如 40）' },
      location: { type: 'string', description: '地点或线上链接' },
      notes: { type: 'string', description: '备注' },
      days: { type: 'number', description: 'list 时看未来几天，默认 7' },
    },
    required: ['action'],
  },
  output: {
    schema: { type: 'object', properties: { receipt: { type: 'string' }, events: { type: 'array', items: { type: 'object', additionalProperties: true } } }, additionalProperties: true },
    render: (_args, value) => [{ type: 'text', text: value?.receipt ?? '完成' }],
  },
  timeoutMs: 15_000,
}

const TASK = {
  name: 'work_desk_task',
  description: '读写「办公工作台」的待办。用户说「记一下/待办/提醒我/这件事做完了」时用它。due 用 ISO 8601；没有明确时间就省略。',
  parameters: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['add', 'toggle', 'update', 'delete', 'list'], description: '要做什么' },
      id: { type: 'string', description: 'toggle/update/delete 时的待办 id' },
      title: { type: 'string', description: '待办内容' },
      due: { type: 'string', description: '截止时间，ISO 8601' },
      priority: { type: 'number', description: '0 普通 / 1 重要 / 2 今天必须' },
      done: { type: 'boolean', description: 'toggle 时显式指定状态' },
    },
    required: ['action'],
  },
  output: {
    schema: { type: 'object', properties: { receipt: { type: 'string' }, tasks: { type: 'array', items: { type: 'object', additionalProperties: true } } }, additionalProperties: true },
    render: (_args, value) => [{ type: 'text', text: value?.receipt ?? '完成' }],
  },
  timeoutMs: 15_000,
}

const STATE = {
  name: 'work_desk_state',
  description: '读「办公工作台」当前的样子：今天的日程、未完成待办、未读邮件、自选行情和提醒。用户问「今天怎么样/我有什么安排/持仓多少/茅台现在多少」时用它，比你自己猜更准。',
  parameters: {
    type: 'object',
    properties: { code: { type: 'string', description: '只看某只股票（600519 / hk00700 / AAPL），可省略' } },
    additionalProperties: false,
  },
  output: {
    schema: {
      type: 'object',
      properties: {
        today: { type: 'string' },
        events: { type: 'array', items: { type: 'object', additionalProperties: true } },
        tasks: { type: 'array', items: { type: 'object', additionalProperties: true } },
        unread: { type: 'number' },
        quotes: { type: 'array', items: { type: 'object', additionalProperties: true } },
        alerts: { type: 'array', items: { type: 'object', additionalProperties: true } },
      },
      additionalProperties: true,
    },
    render: (_args, value) => [{ type: 'text', text: value?.today ?? '工作台是空的' }],
  },
  timeoutMs: 15_000,
}

function eventRow(event) {
  return { id: event.id, title: event.title, start: event.start, end: event.end, location: event.location ?? '', status: event.status }
}

function taskRow(task) {
  return { id: task.id, title: task.title, due: task.due ?? null, done: Boolean(task.done), priority: task.priority ?? 0 }
}

/**
 * 注册三张工具。返回 disposer，Host 卸载时自动摘掉。
 * @param {object} ctx - Cordis 上下文。
 * @param {{store: object, board: object}} desk - 工作台的存储与行情缓存。
 */
export function registerTools(ctx, desk) {
  if (typeof ctx.get('tools')?.register !== 'function') return () => {}

  const calendar = {
    ...CALENDAR,
    async execute(args) {
      const action = String(args?.action ?? '')
      if (action === 'list') {
        const state = await desk.store.read()
        const now = new Date()
        const days = Math.max(1, Math.min(60, Number(args?.days) || 7))
        const rows = state.events
          .filter(event => event.status !== 'cancelled' && new Date(event.end ?? event.start) >= now && new Date(event.start) <= addDays(now, days))
          .sort((a, b) => new Date(a.start) - new Date(b.start))
          .map(eventRow)
        return { receipt: rows.length ? `接下来 ${days} 天有 ${rows.length} 个日程` : `接下来 ${days} 天没有日程`, events: rows }
      }
      let op
      if (action === 'add') {
        const start = args?.start
        const span = Math.max(5, Math.min(600, Number(args?.minutes) || 30))
        const end = args?.end ?? (start ? new Date(new Date(start).getTime() + span * 60000).toISOString() : undefined)
        op = { op: 'add_event', title: args?.title, start, end, location: args?.location ?? '', notes: args?.notes ?? '' }
      } else if (action === 'update') {
        const start = args?.start
        const span = args?.minutes ? Math.max(5, Math.min(600, Number(args.minutes))) : null
        op = {
          op: 'update_event', id: args?.id, title: args?.title,
          ...(start ? { start } : {}),
          ...(start && span ? { end: new Date(new Date(start).getTime() + span * 60000).toISOString() } : args?.end ? { end: args.end } : {}),
          ...(args?.location !== undefined ? { location: args.location } : {}),
          ...(args?.notes !== undefined ? { notes: args.notes } : {}),
        }
      } else if (action === 'delete') {
        op = { op: 'delete_event', id: args?.id }
      } else {
        throw new Error(`不支持的 action：${action}`)
      }
      const result = await desk.store.mutate(`对话：${action === 'add' ? '加日程' : action === 'update' ? '改日程' : '删日程'}`, draft => {
        const applied = applyOps(draft, [op])
        return { ...applied, state: draft }
      })
      if (result.errors?.length) throw new Error(result.errors[0])
      const receipt = result.receipts[0]?.text ?? '完成'
      const target = result.receipts[0]?.target
      const event = target ? result.state.events.find(row => row.id === target) : null
      return { receipt, ...(event ? { events: [eventRow(event)] } : {}) }
    },
  }

  const task = {
    ...TASK,
    async execute(args) {
      const action = String(args?.action ?? '')
      if (action === 'list') {
        const state = await desk.store.read()
        const rows = state.tasks.filter(row => !row.done).map(taskRow)
        return { receipt: rows.length ? `还有 ${rows.length} 条待办` : '待办清空了', tasks: rows }
      }
      const op = action === 'add'
        ? { op: 'add_task', title: args?.title, due: args?.due ?? null, priority: Number(args?.priority) || 0 }
        : action === 'toggle'
          ? { op: 'toggle_task', id: args?.id, ...(args?.done !== undefined ? { done: Boolean(args.done) } : {}) }
          : action === 'update'
            ? { op: 'update_task', id: args?.id, ...(args?.title !== undefined ? { title: args.title } : {}), ...(args?.due !== undefined ? { due: args.due } : {}) }
            : action === 'delete'
              ? { op: 'delete_task', id: args?.id }
              : null
      if (!op) throw new Error(`不支持的 action：${action}`)
      const result = await desk.store.mutate('对话：更新待办', draft => {
        const applied = applyOps(draft, [op])
        return { ...applied, state: draft }
      })
      if (result.errors?.length) throw new Error(result.errors[0])
      const receipt = result.receipts[0]?.text ?? '完成'
      const target = result.receipts[0]?.target
      const row = target ? result.state.tasks.find(item => item.id === target) : null
      return { receipt, ...(row ? { tasks: [taskRow(row)] } : {}) }
    },
  }

  const stateTool = {
    ...STATE,
    async execute(args) {
      const state = await desk.store.read()
      const now = new Date()
      const events = eventsOnDay(state.events, now).filter(event => event.status !== 'cancelled').map(eventRow)
      const tasks = state.tasks.filter(row => !row.done).slice(0, 10).map(taskRow)
      const unread = state.mails.filter(mail => mail.unread).length
      let codes = codesOf(state)
      if (args?.code) codes = [String(args.code)]
      const quotes = desk.board.snapshot(codes).quotes
      const quoteRows = Object.values(quotes).map(quote => ({ code: quote.symbol, name: quote.name, price: quote.price, changePct: quote.changePct }))
      const alerts = evaluateAlerts(state, quotes, now)
      const head = [`今天 ${events.length} 个会`, `${tasks.length} 条未完成待办`, `${unread} 封未读`].join('，')
      const lines = [head]
      for (const event of events) lines.push(`· ${fmtTime(event.start)} ${event.title}`)
      if (quoteRows.length) lines.push(`行情：${quoteRows.map(row => `${row.name} ${row.price}（${row.changePct >= 0 ? '+' : ''}${Number(row.changePct).toFixed(2)}%）`).join('，')}`)
      if (alerts.length) lines.push(`提醒：${alerts.map(alert => alert.text).join('；')}`)
      return { today: lines.join('\n'), events, tasks, unread, quotes: quoteRows, alerts }
    },
  }

  const disposers = [calendar, task, stateTool].map(definition => ctx.get('tools').register(definition))
  return () => { for (const dispose of disposers) { try { dispose() } catch {} } }
}

export const TOOL_NAMES = ['work_desk_calendar', 'work_desk_task', 'work_desk_state']
