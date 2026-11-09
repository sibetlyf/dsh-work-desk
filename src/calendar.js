// 时间工具：周视图排布、冲突检测、相对时间、ICS 解析与导出。
// 全部按本机时区计算；ICS 里带 Z 的时间转成本机时区，带 TZID 的按本地时间读（v0.1 的限制，文档里写明）。

export const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
export const HOURS = Array.from({ length: 24 }, (_, i) => i)

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

/** 周一为一周第一天。 */
export function startOfWeek(value) {
  const d = startOfDay(value)
  const shift = (d.getDay() + 6) % 7
  return addDays(d, -shift)
}

export function fmtTime(value) {
  const d = new Date(value)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fmtDate(value) {
  const d = new Date(value)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export function fmtRange(start, end) {
  if (!start) return ''
  if (!end) return fmtTime(start)
  return `${fmtTime(start)} – ${fmtTime(end)}`
}

export function durationMin(start, end) {
  if (!start || !end) return 0
  return Math.max(0, Math.round((new Date(end) - new Date(start)) / 60000))
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

/** 「3 小时 20 分后」「12 分钟后」这种，会议卡片上用。 */
export function timeUntil(value, now = new Date()) {
  const ms = new Date(value) - now
  const min = Math.round(ms / 60000)
  if (min <= 0) return '已开始'
  if (min < 60) return `${min} 分钟后`
  const h = Math.floor(min / 60)
  const rest = min % 60
  if (h < 24) return rest ? `${h} 小时 ${rest} 分后` : `${h} 小时后`
  return `${Math.round(h / 24)} 天后`
}

/** 两个时间区间是否重叠（半开区间，首尾相接不算冲突）。 */
export function overlaps(aStart, aEnd, bStart, bEnd) {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd)
}

/** 给一天里的会议找时间冲突，返回 Map<eventId, eventId[]>。 */
export function conflictsOf(events) {
  const timed = events.filter(e => e.start && e.end && !e.allDay && e.status !== 'cancelled')
  const map = new Map()
  for (let i = 0; i < timed.length; i += 1) {
    for (let j = i + 1; j < timed.length; j += 1) {
      if (!overlaps(timed[i].start, timed[i].end, timed[j].start, timed[j].end)) continue
      for (const [a, b] of [[timed[i].id, timed[j].id], [timed[j].id, timed[i].id]]) {
        if (!map.has(a)) map.set(a, [])
        map.get(a).push(b)
      }
    }
  }
  return map
}

/** 下一条还没结束的会。 */
export function nextEvent(events, now = new Date()) {
  return events
    .filter(e => e.status !== 'cancelled' && e.end && new Date(e.end) > now)
    .sort((a, b) => new Date(a.start) - new Date(b.start))[0] ?? null
}

export function eventsOnDay(events, day) {
  const key = dayKey(day)
  return events
    .filter(e => e.status !== 'cancelled' && (e.allDay ? dayKey(e.start) === key : overlaps(e.start, e.end, startOfDay(day), addDays(startOfDay(day), 1))))
    .sort((a, b) => (a.allDay === b.allDay ? new Date(a.start) - new Date(b.start) : a.allDay ? -1 : 1))
}

/** 一天里被会议占掉的分钟数。 */
export function busyMinutes(events, day) {
  const list = eventsOnDay(events, day).filter(e => !e.allDay)
  const merged = []
  for (const e of list.sort((a, b) => new Date(a.start) - new Date(b.start))) {
    const start = new Date(e.start)
    const end = new Date(e.end)
    const last = merged[merged.length - 1]
    if (last && start <= last.end) last.end = new Date(Math.max(last.end, end))
    else merged.push({ start, end })
  }
  return merged.reduce((sum, row) => sum + Math.round((row.end - row.start) / 60000), 0)
}

/* ------------------------------- ICS ------------------------------- */

function unfold(text) {
  return String(text).replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '')
}

function icsDate(value, params = '') {
  const raw = String(value).trim()
  if (!raw) return null
  if (/^\d{8}$/.test(raw)) {
    // 全天：20261109
    const d = new Date(Number(raw.slice(0, 4)), Number(raw.slice(4, 6)) - 1, Number(raw.slice(6, 8)))
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
  }
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/.exec(raw)
  if (!m) {
    const parsed = new Date(raw)
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
  }
  const [, y, mo, d, h, mi, s, z] = m
  if (z === 'Z') return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)).toISOString()
  // 带 TZID 的按本机时区读：v0.1 不做时区库，文档里写明这个取舍
  return new Date(+y, +mo - 1, +d, +h, +mi, +s).toISOString()
}

function unescapeIcs(text) {
  return String(text).replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\')
}

/**
 * 解析 ICS，只取 VEVENT 的常用字段。重复事件（RRULE）不展开，只保留第一条。
 * @param {string} text - ICS 内容。
 * @returns {{events: object[], skipped: number}} 事件与跳过的重复规则数。
 */
export function parseIcs(text) {
  const lines = unfold(text).split('\n')
  const events = []
  let current = null
  let skipped = 0
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === 'BEGIN:VEVENT') { current = {}; continue }
    if (trimmed === 'END:VEVENT') {
      if (current && current.start) {
        events.push({
          uid: current.uid ?? null,
          title: current.title || '（无标题）',
          start: current.start,
          end: current.end ?? new Date(new Date(current.start).getTime() + 3600000).toISOString(),
          allDay: Boolean(current.allDay),
          location: current.location ?? '',
          notes: current.notes ?? '',
          source: 'ics',
          icsUid: current.uid ?? null,
        })
      }
      current = null
      continue
    }
    if (!current) continue
    const colon = trimmed.indexOf(':')
    if (colon < 0) continue
    const left = trimmed.slice(0, colon)
    const value = trimmed.slice(colon + 1)
    const [name, ...paramParts] = left.split(';')
    const params = paramParts.join(';')
    switch (name.toUpperCase()) {
      case 'SUMMARY': current.title = unescapeIcs(value); break
      case 'DTSTART':
        current.start = icsDate(value, params)
        current.allDay = /VALUE=DATE(?!-TIME)/.test(params) || /^\d{8}$/.test(value.trim())
        break
      case 'DTEND': current.end = icsDate(value, params); break
      case 'LOCATION': current.location = unescapeIcs(value); break
      case 'DESCRIPTION': current.notes = unescapeIcs(value).slice(0, 4000); break
      case 'UID': current.uid = value.trim(); break
      case 'RRULE': skipped += 1; break
      default: break
    }
  }
  return { events, skipped }
}

function icsStamp(iso) {
  const d = new Date(iso)
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
}

function icsEscape(text) {
  return String(text ?? '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

/** 导出成能被 Google / Outlook / 企业微信日历导入的 ICS。 */
export function buildIcs(events, { now = new Date() } = {}) {
  const out = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//dsh-work-desk//办公工作台//CN',
    'CALSCALE:GREGORIAN',
  ]
  for (const event of events) {
    if (!event.start || event.status === 'cancelled') continue
    out.push('BEGIN:VEVENT')
    out.push(`UID:${event.uid ?? event.id}@work-desk`)
    out.push(`DTSTAMP:${icsStamp(now.toISOString())}`)
    if (event.allDay) {
      out.push(`DTSTART;VALUE=DATE:${icsStamp(event.start).slice(0, 8)}`)
      if (event.end) out.push(`DTEND;VALUE=DATE:${icsStamp(event.end).slice(0, 8)}`)
    } else {
      out.push(`DTSTART:${icsStamp(event.start)}`)
      out.push(`DTEND:${icsStamp(event.end ?? new Date(new Date(event.start).getTime() + 3600000).toISOString())}`)
    }
    out.push(`SUMMARY:${icsEscape(event.title)}`)
    if (event.location) out.push(`LOCATION:${icsEscape(event.location)}`)
    if (event.notes) out.push(`DESCRIPTION:${icsEscape(event.notes)}`)
    out.push('END:VEVENT')
  }
  out.push('END:VCALENDAR')
  return `${out.join('\r\n')}\r\n`
}
