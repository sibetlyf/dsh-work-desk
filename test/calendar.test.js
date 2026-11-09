import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildIcs, busyMinutes, conflictsOf, dayKey, eventsOnDay, nextEvent, parseIcs, startOfWeek, timeUntil } from '../src/calendar.js'

const now = new Date('2026-11-09T09:00:00+08:00')

test('ICS 解析：UTC 时间、全天、地点和备注', () => {
  const ics = [
    'BEGIN:VCALENDAR',
    'BEGIN:VEVENT',
    'UID:abc@x',
    'SUMMARY:产品周会',
    'DTSTART:20261109T020000Z',
    'DTEND:20261109T030000Z',
    'LOCATION:3 楼大会议室',
    'DESCRIPTION:第一行\\n第二行',
    'END:VEVENT',
    'BEGIN:VEVENT',
    'UID:def@x',
    'SUMMARY:团建',
    'DTSTART;VALUE=DATE:20261114',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const { events } = parseIcs(ics)
  assert.equal(events.length, 2)
  assert.equal(events[0].title, '产品周会')
  assert.equal(events[0].location, '3 楼大会议室')
  assert.equal(events[0].notes, '第一行\n第二行')
  assert.equal(new Date(events[0].start).toISOString(), '2026-11-09T02:00:00.000Z')
  assert.equal(events[1].allDay, true)
  assert.equal(dayKey(events[1].start), '2026-11-14')
})

test('ICS 里折行的长文本会拼回一行', () => {
  const ics = 'BEGIN:VEVENT\r\nSUMMARY:这是一个被折\r\n 行了的标题\r\nDTSTART:20261109T020000Z\r\nEND:VEVENT'
  const { events } = parseIcs(ics)
  assert.equal(events[0].title, '这是一个被折行了的标题')
})

test('重复规则不展开，计入 skipped', () => {
  const ics = 'BEGIN:VEVENT\r\nSUMMARY:每周站会\r\nDTSTART:20261109T020000Z\r\nRRULE:FREQ=WEEKLY\r\nEND:VEVENT'
  const { events, skipped } = parseIcs(ics)
  assert.equal(events.length, 1)
  assert.equal(skipped, 1)
})

test('导出的 ICS 能被自己解析回来', () => {
  const events = [{ id: 'e1', title: '评审；带,逗号', start: '2026-11-09T02:00:00.000Z', end: '2026-11-09T03:00:00.000Z', location: '线上', notes: 'a\nb' }]
  const ics = buildIcs(events, { now })
  assert.match(ics, /BEGIN:VCALENDAR/)
  assert.match(ics, /SUMMARY:评审；带\\,逗号/)
  const parsed = parseIcs(ics)
  assert.equal(parsed.events.length, 1)
  assert.equal(parsed.events[0].notes, 'a\nb')
  assert.equal(parsed.events[0].start, events[0].start)
})

test('冲突检测：首尾相接不算冲突，重叠互指', () => {
  const events = [
    { id: 'a', start: '2026-11-09T10:00:00+08:00', end: '2026-11-09T11:00:00+08:00', status: 'confirmed' },
    { id: 'b', start: '2026-11-09T11:00:00+08:00', end: '2026-11-09T12:00:00+08:00', status: 'confirmed' },
    { id: 'c', start: '2026-11-09T10:30:00+08:00', end: '2026-11-09T11:30:00+08:00', status: 'confirmed' },
  ]
  const map = conflictsOf(events)
  assert.equal(map.has('a'), true)
  assert.equal(map.get('a').includes('b'), false)
  assert.deepEqual(map.get('a'), ['c'])
  assert.deepEqual(map.get('c').sort(), ['a', 'b'])
})

test('一天的忙闲：重叠时间只算一次', () => {
  const events = [
    { id: 'a', start: '2026-11-09T10:00:00+08:00', end: '2026-11-09T11:00:00+08:00' },
    { id: 'b', start: '2026-11-09T10:30:00+08:00', end: '2026-11-09T11:30:00+08:00' },
  ]
  assert.equal(busyMinutes(events, now), 90)
})

test('下一条会议跳过已结束的和取消的', () => {
  const events = [
    { id: 'old', start: '2026-11-09T08:00:00+08:00', end: '2026-11-09T08:30:00+08:00', status: 'confirmed' },
    { id: 'now', start: '2026-11-09T09:00:00+08:00', end: '2026-11-09T10:00:00+08:00', status: 'confirmed' },
    { id: 'gone', start: '2026-11-09T09:30:00+08:00', end: '2026-11-09T10:30:00+08:00', status: 'cancelled' },
  ]
  assert.equal(nextEvent(events, new Date('2026-11-09T09:20:00+08:00')).id, 'now')
  assert.equal(nextEvent(events, new Date('2026-11-09T11:00:00+08:00')), null)
})

test('周从周一开始，跨天会议出现在两天里', () => {
  assert.equal(dayKey(startOfWeek(new Date('2026-11-09T10:00:00+08:00'))), '2026-11-09')
  const events = [{ id: 'x', start: '2026-11-09T23:00:00+08:00', end: '2026-11-10T01:00:00+08:00' }]
  assert.equal(eventsOnDay(events, new Date('2026-11-09T12:00:00+08:00')).length, 1)
  assert.equal(eventsOnDay(events, new Date('2026-11-10T12:00:00+08:00')).length, 1)
})

test('倒计时文案', () => {
  assert.equal(timeUntil('2026-11-09T09:30:00+08:00', now), '30 分钟后')
  assert.equal(timeUntil('2026-11-09T11:00:00+08:00', now), '2 小时后')
  assert.equal(timeUntil('2026-11-09T08:00:00+08:00', now), '已开始')
})
