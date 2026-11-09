// 本地规则：模型不可用时对话依然能完成最常见的那几件事，界面会标明「本地规则」。
import { fmtTime, fmtDate, dayKey } from './calendar.js'
import { displaySymbol } from './quotes.js'

const WEEK = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 0, 天: 0 }
const CN_NUM = { 一: 1, 两: 2, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 十一: 11, 十二: 12 }
const NUM = '(\\d{1,2}|十[一二]?|[一两二三四五六七八九])'

/**
 * 从一句话里认出日期时间。只处理办公场景最常见的说法：
 * 明天下午三点、周五 10 点、11 月 12 日 14:00、半小时后。
 * @param {string} text - 用户输入。
 * @param {Date} now - 现在。
 * @returns {{start: Date, minutes: number}|null} 开始时间与时长（分钟）。
 */
export function parseWhen(text, now = new Date()) {
  const date = new Date(now)
  let matched = false
  let m
  if (/(大后天)/.test(text)) { date.setDate(date.getDate() + 3); matched = true }
  else if (/后天/.test(text)) { date.setDate(date.getDate() + 2); matched = true }
  else if (/明天|明早|明晚/.test(text)) { date.setDate(date.getDate() + 1); matched = true }
  else if (/今天|今晚|今早|待会|一会儿/.test(text)) { matched = true }
  else if ((m = /(下)?(?:周|星期|礼拜)([一二三四五六日天])/.exec(text))) {
    const target = WEEK[m[2]]
    const current = date.getDay()
    let delta = (target - current + 7) % 7
    if (m[1]) delta = ((target + 6) % 7) + (7 - ((current + 6) % 7))
    else if (delta === 0) delta = 0
    date.setDate(date.getDate() + delta)
    matched = true
  } else if ((m = /(\d{1,2})\s*月\s*(\d{1,2})\s*[日号]?/.exec(text))) {
    date.setMonth(Number(m[1]) - 1, Number(m[2]))
    if (date < now) date.setFullYear(date.getFullYear() + 1)
    matched = true
  }

  let hour = null
  let minute = 0
  if ((m = /(\d{1,2})[:：](\d{2})/.exec(text))) {
    hour = Number(m[1])
    minute = Number(m[2])
  } else if ((m = new RegExp(`${NUM}\\s*点\\s*(半|一刻|\\d{1,2}\\s*分?)?`).exec(text))) {
    hour = /\d/.test(m[1]) ? Number(m[1]) : CN_NUM[m[1]]
    if (m[2] === '半') minute = 30
    else if (m[2] === '一刻') minute = 15
    else if (m[2]) minute = parseInt(m[2], 10)
  } else if (hour === null && /上午|早上|中午|下午|晚上|今晚/.test(text)) {
    // 只说「明天下午」时给一个合理的默认
    hour = /上午|早上/.test(text) ? 10 : /中午/.test(text) ? 12 : /下午/.test(text) ? 15 : 20
  }
  if (hour !== null) {
    const evening = /下午|晚上|今晚|傍晚/.test(text)
    if (evening && hour < 12) hour += 12
    matched = true
  } else if (matched) {
    hour = 10
  }
  if (!matched) return null

  // 时长：30 分钟 / 1 小时 / 一个半小时 / 半小时
  let minutes = 30
  if ((m = /(\d+(?:\.\d+)?)\s*个?\s*小时/.exec(text))) minutes = Math.round(Number(m[1]) * 60)
  else if ((m = /(半|一|两|二|三)\s*个?\s*小时/.exec(text))) minutes = (m[1] === '半' ? 0.5 : CN_NUM[m[1]] ?? 1) * 60
  else if ((m = /(\d{1,3})\s*分(?:钟)?/.exec(text))) minutes = Math.max(5, Number(m[1]))
  else if (/半小时/.test(text)) minutes = 30
  return { start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour ?? 10, minute, 0, 0), minutes }
}

function findQuote(state, text, quotes) {
  const code = /(?:^|[^\d])((?:sh|sz|hk|us)?\d{5,6}|[A-Z]{2,5})(?![\d])/i.exec(text)?.[1]
  if (code) {
    const symbol = /^(sh|sz|hk|us)/i.test(code) ? code.toLowerCase() : null
    if (symbol && quotes[symbol]) return { symbol, quote: quotes[symbol] }
    const hit = Object.values(quotes).find(q => q.code === code || q.symbol.endsWith(code))
    if (hit) return { symbol: hit.symbol, quote: hit }
  }
  // 名字匹配：用户说「茅台」，自选里叫「贵州茅台」，取名字里任意两个字去撞
  for (const row of [...state.watchlist, ...state.positions]) {
    if (!row.name || !quotes[row.code]) continue
    if (text.includes(row.name)) return { symbol: row.code, quote: quotes[row.code] }
    for (let i = 0; i + 2 <= row.name.length; i += 1) {
      if (text.includes(row.name.slice(i, i + 2))) return { symbol: row.code, quote: quotes[row.code] }
    }
  }
  return null
}

function quoteLine(quote) {
  const pct = quote.changePct === null || quote.changePct === undefined ? '—' : `${quote.changePct >= 0 ? '+' : ''}${quote.changePct.toFixed(2)}%`
  return `${quote.name} 现价 ${quote.price}，${pct}（昨收 ${quote.prevClose ?? '—'}）`
}

/** 从一句话里找一封邮件：优先书名号，其次未读里按主题前缀撞。 */
function findMail(state, text) {
  const quoted = /[《「“"]([^》」”"]+)[》」”"]/.exec(text)?.[1]?.trim()
  if (quoted) {
    const hit = state.mails.find(mail => mail.subject && (mail.subject.includes(quoted) || quoted.includes(mail.subject)))
    if (hit) return hit
  }
  return state.mails.find(mail => mail.unread && mail.subject && text.includes(mail.subject.slice(0, 6))) ?? null
}

/** 把日期、时间、时长、口头语从一句话里剥掉，剩下的当会议主题。 */
function eventTitle(text) {
  return text
    .replace(/^(帮我|麻烦|给我)?\s*(安排|约个?|加个?|新建)?\s*/g, '')
    .replace(/(大后天|明天|今天|后天)/g, '')
    .replace(/(下周|下星期|周|星期|礼拜)[一二三四五六日天]/g, '')
    .replace(/(上午|下午|晚上|中午|早上|傍晚)/g, '')
    .replace(/(\d{1,2}|十[一二]?|[一两二三四五六七八九])\s*点\s*(半|一刻|\d{1,2}\s*分?)?/g, '')
    .replace(/\d{1,2}[:：]\d{2}/g, '')
    .replace(/(\d+(?:\.\d+)?)\s*个?\s*小时/g, '')
    .replace(/(半|一|两|二|三)\s*个?\s*小时/g, '')
    .replace(/\d{1,3}\s*分(?:钟)?/g, '')
    .replace(/(开个会|开会|会议|安排|约|面谈|吧)/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[，,：:\s]+|[，,：:\s]+$/g, '')
    .trim()
}

/**
 * @param {object} state - 工作台状态。
 * @param {string} message - 用户输入。
 * @param {{focusId?: string, quotes?: object, now?: Date}} [options] - 上下文。
 * @returns {{reply: string, ops: Array<object>, actions?: Array<object>}} 回复与待执行操作。
 */
export function localIntent(state, message, { focusId, quotes = {}, now = new Date() } = {}) {
  const text = message.trim()

  if (/晨报|早报|今天.*总结|brief/i.test(text)) {
    return { reply: '好，我把今天的会、邮件和行情整理一下。', ops: [], actions: [{ type: 'brief' }] }
  }
  if (/同步|刷新.*邮件|收信/.test(text)) return { reply: '开始同步邮箱。', ops: [], actions: [{ type: 'sync_mail' }] }
  if (/刷新.*(行情|股价)|行情.*刷新/.test(text)) return { reply: '好，刷新一下行情。', ops: [], actions: [{ type: 'refresh_quotes' }] }

  if (/未读|新邮件|几封邮件|邮件.*几/.test(text)) {
    const unread = state.mails.filter(mail => mail.unread)
    return {
      reply: unread.length
        ? `有 ${unread.length} 封未读：\n${unread.slice(0, 5).map(mail => `· ${mail.from?.name || mail.from?.address}：${mail.subject}`).join('\n')}`
        : '收件箱没有未读。',
      ops: [],
      actions: unread.length ? [{ type: 'nav', view: 'mail' }] : [],
    }
  }
  if (/今天.*(几个会|有什么会|日程)|明天的?会/.test(text)) {
    const day = /明天/.test(text) ? new Date(now.getTime() + 86400000) : now
    const list = state.events.filter(e => e.status !== 'cancelled' && dayKey(e.start) === dayKey(day))
    return {
      reply: list.length
        ? `${dayKey(day) === dayKey(now) ? '今天' : '明天'} ${list.length} 个会：\n${list.map(e => `· ${fmtTime(e.start)} ${e.title}`).join('\n')}`
        : `${dayKey(day) === dayKey(now) ? '今天' : '明天'}没有会。`,
      ops: [],
    }
  }
  // 加自选：先认代码，再认名字（「加自选 茅台」）
  if (/(自选|关注)/.test(text) && /(加|添加|收)/.test(text)) {
    const code = /((?:sh|sz|hk|us)?\d{5,6}|[A-Z]{2,5})/i.exec(text)?.[1]
    if (code) return { reply: `把 ${displaySymbol(code)} 加进自选了。`, ops: [{ op: 'add_watch', code }] }
    const hit = findQuote(state, text, quotes)
    if (hit) return { reply: `把 ${hit.quote.name} 加进自选了。`, ops: [{ op: 'add_watch', code: hit.symbol, name: hit.quote.name }] }
  }
  if (/已读/.test(text)) {
    const hit = findMail(state, text)
    if (hit) return { reply: `已把「${hit.subject}」标为已读。`, ops: [{ op: 'mark_mail', id: hit.id, action: 'read' }] }
  }
  const quoteHit = findQuote(state, text, quotes)
  if (quoteHit && !/(加|添加|保存)/.test(text)) {
    return { reply: quoteLine(quoteHit.quote), ops: [], actions: [{ type: 'nav', view: 'market' }] }
  }

  const when = parseWhen(text, now)
  const eventish = /(会|开会|会议|约|安排|碰一下|对一下|面谈)/.test(text)
  if (when && eventish) {
    const title = eventTitle(text).slice(0, 30)
    return {
      reply: `排好了：${fmtDate(when.start)} ${fmtTime(when.start)}。`,
      ops: [{ op: 'add_event', title: title || '会议', start: when.start.toISOString(), end: new Date(when.start.getTime() + when.minutes * 60000).toISOString() }],
    }
  }

  const taskMatch = /^(?:帮我)?(?:记一下|记下|记个|记|待办|todo)[：:，,\s]*(.+)$/i.exec(text)
  if (taskMatch) {
    const body = taskMatch[1].trim()
    return { reply: '记到待办里了。', ops: [{ op: 'add_task', title: body.split(/[。！？\n]/)[0].slice(0, 60), due: when ? when.start.toISOString() : null }] }
  }

  const counts = { events: state.events.filter(e => e.status !== 'cancelled' && dayKey(e.start) === dayKey(now)).length, tasks: state.tasks.filter(t => !t.done).length, unread: state.mails.filter(mail => mail.unread).length }
  return {
    reply: `这句话我用本地规则没听懂。现在今天 ${counts.events} 个会、${counts.tasks} 条待办、${counts.unread} 封未读。可以试试「明天下午三点和设计对一下改版，40 分钟」「记一下：回周舟的邮件」「茅台现在多少」。`,
    ops: [],
  }
}
