// 晨报：把今天的三块数据（会、待办、邮件）+ 行情合成一份能读完的东西。
// 有模型就写人话，没模型就按模板拼；两种都标明来源。
import { briefPrompts, fallbackBrief, callModel } from './ai.js'
import { dayKey, eventsOnDay } from './calendar.js'
import { newId } from './ops.js'
import { evaluateAlerts } from './sync.js'

/**
 * 组装晨报要用的数据。顺序就是阅读顺序：先会，再待办，再邮件，最后行情。
 * @param {object} state - 工作台状态。
 * @param {object} quotes - symbol → 行情。
 * @param {Date} now - 现在。
 */
export function briefInput(state, quotes, now = new Date()) {
  const events = eventsOnDay(state.events, now).filter(e => e.status !== 'cancelled')
  const tasks = state.tasks
    .filter(t => !t.done && (!t.due || dayKey(t.due) <= dayKey(now)))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || String(a.due ?? '').localeCompare(String(b.due ?? '')))
    .slice(0, 8)
  const mails = state.mails.filter(mail => mail.unread && !mail.sent).slice(0, 6)
  const quoteRows = state.watchlist.map(row => ({ ...row, ...(quotes[row.code] ?? {}) }))
  const positions = state.positions.map(row => ({ ...row, quote: quotes[row.code] ?? null }))
  const alerts = evaluateAlerts(state, quotes, now)
  return { events, tasks, mails, quotes: quoteRows, positions, alerts, now }
}

/**
 * 生成并保存一份晨报。
 * @param {{ctx: object, store: object, quotes: object}} deps - 依赖。
 * @returns {Promise<{brief: object, state: object}>} 晨报与更新后的状态。
 */
export async function generateBrief({ ctx, store, quotes, now = new Date() }) {
  const state = await store.read()
  const input = briefInput(state, quotes, now)
  let text = null
  let engine = 'local'
  try {
    const { system, user } = briefPrompts(input)
    const result = await callModel(ctx, { system, user, maxTokens: 1200, signal: AbortSignal.timeout(120_000) })
    text = result.text.trim()
    engine = result.model
  } catch {
    text = fallbackBrief(input)
  }
  const brief = {
    id: newId('b'),
    date: dayKey(now),
    text,
    engine,
    createdAt: now.toISOString(),
    counts: { events: input.events.length, tasks: input.tasks.length, mails: input.mails.length },
  }
  const next = await store.mutate('生成晨报', draft => {
    draft.brief = brief
    draft.briefs = [brief, ...(draft.briefs ?? []).filter(row => row.date !== brief.date)].slice(0, 10)
    return draft
  }, { undoable: false })
  return { brief, state: next }
}

/** 今天的晨报是不是已经生成过（避免刷新页面又调一次模型）。 */
export function briefIsFresh(state, now = new Date()) {
  return Boolean(state.brief && state.brief.date === dayKey(now))
}
