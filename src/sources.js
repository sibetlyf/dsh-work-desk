// 数据源：组件不再把数据写死在规格里，而是声明「要哪几路数据」。
// Host 统一取数（工作台状态、行情、会议助手等别的 DSH 插件工具），客户端按需定时刷新。
// 取不到时返回 available:false 与原因，绝不假装有数据。
import { randomUUID } from 'node:crypto'

const meetingCache = { at: 0, value: null }
const MEETING_TTL = 2000

/** 通过公共工具接口调别的插件的工具；没装就返回 available:false，而不是抛错。 */
async function callTool(ctx, name, args = {}) {
  const tools = typeof ctx?.get === 'function' ? ctx.get('tools') : null
  if (typeof tools?.execute !== 'function' || typeof tools?.executable !== 'function') {
    return { available: false, reason: '当前宿主没有可调用的工具执行器' }
  }
  let definition = null
  try { definition = tools.executable(name) } catch { return { available: false, reason: '工具执行器当前不可用' } }
  if (!definition) return { available: false, reason: `没有找到 ${name}（对应插件未安装）` }
  const id = `work-desk:${randomUUID()}`
  const batch = await tools.execute({
    calls: [{ type: 'tool-call', id, name, arguments: JSON.stringify(args) }],
    signal: AbortSignal.timeout(20_000),
  })
  const result = batch.results?.find(entry => entry.callId === id)?.result
  if (result?.isError) return { available: false, reason: String(result.error?.message ?? '工具调用失败').slice(0, 200) }
  return { available: true, value: result?.value ?? {} }
}

/** 工作台自己的数据（不经过工具）：会议数、待办、未读、提醒、自选。 */
export function deskSource(state, { alerts = [] } = {}) {
  const now = new Date()
  const day = now.toDateString()
  const events = (state?.events ?? []).filter(event => event.status !== 'cancelled')
  const open = (state?.tasks ?? []).filter(task => !task.done)
  return {
    available: true,
    value: {
      todayEvents: events.filter(event => new Date(event.start).toDateString() === day).length,
      openTasks: open.length,
      unreadMail: (state?.mails ?? []).filter(mail => mail.unread).length,
      watchlist: (state?.watchlist ?? []).length,
      alerts: alerts.length,
      // 马上要开的会：从现在起、未取消，最多 5 场；秒级倒计时在前端算，这里给分钟数便于直接展示
      nextEvents: upcomingEvents(state, now, 5),
      // 待办与会议结合：未完成、按截止时间排序，最多 8 条
      dueTasks: open
        .slice()
        .sort((a, b) => (a.due ? new Date(a.due) : Infinity) - (b.due ? new Date(b.due) : Infinity))
        .slice(0, 8)
        .map(task => ({ id: task.id, title: task.title, due: task.due ?? null })),
      updatedAt: now.toISOString(),
    },
  }
}

/** 接下来的会议：只取未取消、还没结束的，按开始时间排序。 */
export function upcomingEvents(state, now = new Date(), limit = 5) {
  return (state?.events ?? [])
    .filter(event => event.status !== 'cancelled' && new Date(event.end ?? event.start) > now)
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, limit)
    .map(event => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end ?? null,
      location: event.location ?? null,
      minutesUntil: Math.round((new Date(event.start) - now) / 60000),
      running: new Date(event.start) <= now,
    }))
}

/** 行情：取缓存快照，不在这里发网络请求（刷新由行情页/定时任务负责）。 */
export function quotesSource(board, codes) {
  const snap = board?.snapshot?.(codes) ?? { quotes: {} }
  const rows = Object.values(snap.quotes ?? {}).map(quote => ({ code: quote.symbol, name: quote.name, price: quote.price, changePct: quote.changePct }))
  if (!rows.length) return { available: false, reason: '还没有行情快照' }
  return { available: true, value: { quotes: rows, updatedAt: snap.at ? new Date(snap.at).toISOString() : null } }
}

/** 会议助手：读另一个插件的状态工具，2 秒缓存，避免每个组件各打一次。 */
export async function meetingSource(ctx, { force = false } = {}) {
  const now = Date.now()
  if (!force && meetingCache.value && now - meetingCache.at < MEETING_TTL) return meetingCache.value
  let result
  try {
    const called = await callTool(ctx, 'meeting_agent_status')
    if (!called.available) result = { available: false, reason: called.reason }
    else {
      const raw = called.value ?? {}
      const text = String(raw.state ?? raw.status ?? raw.summary ?? '').trim()
      const counts = raw.counts ?? raw.stats ?? {}
      result = {
        available: true,
        value: {
          running: Boolean(raw.listening ?? raw.running ?? /运行[：:]\s*是/.test(text)),
          capturing: Boolean(raw.capturing ?? raw.recording),
          mode: raw.mode ?? raw.policy ?? null,
          model: raw.llm ?? raw.model ?? null,
          heard: Number(counts.heard ?? counts.listened ?? 0),
          triggered: Number(counts.triggered ?? counts.trigger ?? 0),
          spoken: Number(counts.spoken ?? counts.speak ?? 0),
          errors: Number(counts.errors ?? 0),
          lastJudgement: raw.lastJudgement ?? raw.last ?? null,
          raw: raw,
        },
      }
    }
  } catch (err) {
    result = { available: false, reason: String(err?.message ?? err).slice(0, 200) }
  }
  meetingCache.at = now
  meetingCache.value = result
  return result
}

/** 数据源目录：给组件面板和 Agent 用，说明每路数据能拿到什么。 */
export const SOURCES = {
  desk: { label: '工作台数据', description: '今天会议数、未完成待办、未读邮件、自选数、提醒数', refresh: '15 秒', fields: ['todayEvents', 'openTasks', 'unreadMail', 'watchlist', 'alerts'] },
  quotes: { label: '行情快照', description: '自选实时价与涨跌幅（取宿主缓存，不重复发请求）', refresh: '8 秒', fields: ['quotes'] },
  meeting: { label: '会议助手状态', description: '是否在听、是否采集、监听/触发/播报/错误计数（来自会议助手插件）', refresh: '2 秒', fields: ['running', 'capturing', 'heard', 'triggered', 'spoken', 'errors'] },
}

/** 一次解析多路数据源；任何一路失败只影响那一路。 */
export async function collectSources(ctx, desk, names = []) {
  const out = {}
  for (const name of names) {
    if (!SOURCES[name]) { out[name] = { available: false, reason: `未知数据源：${name}` }; continue }
    try {
      if (name === 'desk') {
        const state = await desk.store.read()
        out.desk = deskSource(state, desk.alertsOf?.() ?? {})
      } else if (name === 'quotes') {
        out.quotes = quotesSource(desk.board, desk.codesOf?.() ?? [])
      } else if (name === 'meeting') {
        out.meeting = await meetingSource(ctx)
      }
    } catch (err) {
      out[name] = { available: false, reason: String(err?.message ?? err).slice(0, 200) }
    }
  }
  return out
}
