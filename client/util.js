// 界面用的时间与数字格式。服务端也用同一套规则，这里只做展示。

export const WEEK_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
export const MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

const pad = n => String(n).padStart(2, '0')

export function dayKey(value) {
  const d = new Date(value)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function startOfDay(value) {
  const d = new Date(value)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(value, n) {
  const d = new Date(value)
  d.setDate(d.getDate() + n)
  return d
}

export function startOfWeek(value) {
  const d = startOfDay(value)
  return addDays(d, -((d.getDay() + 6) % 7))
}

export function isSameDay(a, b) {
  return dayKey(a) === dayKey(b)
}

export function fmtTime(value) {
  if (!value) return ''
  const d = new Date(value)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fmtDate(value) {
  const d = new Date(value)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export function fmtWeekday(value) {
  return WEEK_LABELS[(new Date(value).getDay() + 6) % 7]
}

export function fmtDateTime(value) {
  return `${fmtDate(value)} ${fmtTime(value)}`
}

export function fmtRange(start, end) {
  if (!start) return ''
  if (!end) return fmtTime(start)
  const a = new Date(start)
  const b = new Date(end)
  if (isSameDay(a, b)) return `${fmtTime(start)} – ${fmtTime(end)}`
  return `${fmtDateTime(start)} – ${fmtDateTime(end)}`
}

export function relativeDay(value, now = new Date()) {
  const diff = Math.round((startOfDay(value) - startOfDay(now)) / 86400000)
  if (diff === 0) return '今天'
  if (diff === 1) return '明天'
  if (diff === 2) return '后天'
  if (diff === -1) return '昨天'
  if (diff < 0 && diff > -8) return `${-diff} 天前`
  return fmtDate(value)
}

/** 邮件列表上的时间：今天给时分，今年给月日，更早给年月日。 */
export function mailTime(value, now = new Date()) {
  if (!value) return ''
  const d = new Date(value)
  if (isSameDay(d, now)) return fmtTime(d)
  if (d.getFullYear() === now.getFullYear()) return fmtDate(d)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

export function timeUntil(value, now = new Date()) {
  const diff = new Date(value) - now
  const min = Math.round(diff / 60000)
  if (min <= 0) return '已开始'
  if (min < 60) return `${min} 分钟后`
  const h = Math.floor(min / 60)
  const rest = min % 60
  if (h < 24) return rest ? `${h} 小时 ${rest} 分后` : `${h} 小时后`
  return `${Math.round(h / 24)} 天后`
}

export function minutesOfDay(value) {
  const d = new Date(value)
  return d.getHours() * 60 + d.getMinutes()
}

export function atMinutes(day, minutes) {
  const d = startOfDay(day)
  d.setMinutes(minutes)
  return d
}

export function snapMinutes(minutes, step = 15) {
  return Math.round(minutes / step) * step
}

/* ------------------------------- 数字 ------------------------------- */

export function fmtPct(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  const n = Number(value)
  return `${n >= 0 ? '+' : ''}${n.toFixed(digits)}%`
}

export function toneOf(value) {
  if (value === null || value === undefined) return ''
  const n = Number(value)
  if (!Number.isFinite(n) || n === 0) return ''
  return n > 0 ? 'is-up' : 'is-down'
}

export function fmtMoney(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return Number(value).toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export function compactNum(value) {
  if (value === null || value === undefined) return '—'
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  if (Math.abs(n) >= 1e8) return `${(n / 1e8).toFixed(2)} 亿`
  if (Math.abs(n) >= 1e4) return `${(n / 1e4).toFixed(1)} 万`
  return n.toLocaleString('zh-CN')
}

/* ------------------------------- 日历排布 ------------------------------- */

/**
 * 周视图里把同一天的会议排成不重叠的列：先按开始时间分组，冲突的平分成几条泳道。
 * @param {object[]} events - 当天的会议。
 * @returns {{event: object, lane: number, lanes: number}[]} 带泳道信息的列表。
 */
export function layoutDay(events) {
  const timed = events.filter(event => !event.allDay).sort((a, b) => new Date(a.start) - new Date(b.start))
  const out = []
  let cluster = []
  let clusterEnd = 0
  const flush = () => {
    if (!cluster.length) return
    const lanes = []
    for (const item of cluster) {
      let lane = lanes.findIndex(end => end <= new Date(item.start).getTime())
      if (lane < 0) { lane = lanes.length; lanes.push(0) }
      lanes[lane] = new Date(item.end).getTime()
      out.push({ event: item, lane, lanes: 0 })
    }
    for (const row of out) if (cluster.includes(row.event)) row.lanes = lanes.length
    cluster = []
    clusterEnd = 0
  }
  for (const event of timed) {
    const start = new Date(event.start).getTime()
    if (cluster.length && start >= clusterEnd) flush()
    cluster.push(event)
    clusterEnd = Math.max(clusterEnd, new Date(event.end).getTime())
  }
  flush()
  return out
}

export function briefToLines(text) {
  return String(text ?? '').split('\n').map(line => line.trim()).filter(Boolean)
}

/** ISO → <input type="datetime-local"> 的值。 */
export function toLocalInput(value) {
  if (!value) return ''
  const d = new Date(value)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
