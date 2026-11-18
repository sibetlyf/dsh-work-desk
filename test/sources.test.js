import test from 'node:test'
import assert from 'node:assert/strict'
import { describe } from 'node:test'
import { SOURCES, collectSources, deskSource, meetingSource, quotesSource, upcomingEvents } from '../src/sources.js'
import { interpolate } from '../client/fw/interp.js'

describe('数据源：工作台自身', () => {
  test('deskSource 只数今天的会与未完成项', () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10).toISOString()
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9).toISOString()
    const state = {
      events: [
        { id: 'a', start: today, status: 'confirmed' },
        { id: 'b', start: tomorrow, status: 'confirmed' },
        { id: 'c', start: today, status: 'cancelled' },
      ],
      tasks: [{ id: 't1', done: false }, { id: 't2', done: true }, { id: 't3', done: false }],
      mails: [{ unread: true }, { unread: false }, { unread: true }],
      watchlist: [{ code: 'sh600519' }],
    }
    const result = deskSource(state, { alerts: [{}, {}] })
    assert.equal(result.available, true)
    assert.equal(result.value.todayEvents, 1)
    assert.equal(result.value.openTasks, 2)
    assert.equal(result.value.unreadMail, 2)
    assert.equal(result.value.watchlist, 1)
    assert.equal(result.value.alerts, 2)
  })

  test('quotesSource 没有快照时明确不可用', () => {
    assert.equal(quotesSource({ snapshot: () => ({ quotes: {} }) }, []).available, false)
    const snap = quotesSource({ snapshot: () => ({ quotes: { sh600519: { symbol: 'sh600519', name: '贵州茅台', price: 1444, changePct: -0.6 } }, at: Date.now() }) }, [])
    assert.equal(snap.available, true)
    assert.equal(snap.value.quotes[0].name, '贵州茅台')
  })
})

describe('数据源：别的插件的工具', () => {
  const ctxWith = (value, name = 'meeting_agent_status') => ({
    get: service => (service === 'tools' ? {
      executable: toolName => (toolName === name ? { name } : null),
      execute: async ({ calls }) => ({ results: [{ callId: calls[0].id, result: { value } }] }),
    } : undefined),
  })

  test('meetingSource 读出运行状态与计数', async () => {
    const ctx = ctxWith({ running: true, capturing: true, counts: { heard: 12, triggered: 3, spoken: 2, errors: 0 }, mode: 'auto' })
    const row = await meetingSource(ctx, { force: true })
    assert.equal(row.available, true)
    assert.equal(row.value.running, true)
    assert.equal(row.value.heard, 12)
    assert.equal(row.value.mode, 'auto')
  })

  test('没装会议助手时返回原因，不抛错也不假装可用', async () => {
    const row = await meetingSource({ get: () => ({ executable: () => null, execute: async () => ({ results: [] }) }) }, { force: true })
    assert.equal(row.available, false)
    assert.match(row.reason, /meeting_agent_status/)
  })

  test('工具报错时转成不可用原因', async () => {
    const ctx = {
      get: () => ({
        executable: () => ({ name: 'meeting_agent_status' }),
        execute: async ({ calls }) => ({ results: [{ callId: calls[0].id, result: { isError: true, error: { message: '录音设备占用中' } } }] }),
      }),
    }
    const row = await meetingSource(ctx, { force: true })
    assert.equal(row.available, false)
    assert.match(row.reason, /录音设备占用中/)
  })

  test('collectSources 单路失败不影响其它路', async () => {
    const desk = {
      store: { read: async () => ({ events: [], tasks: [{ done: false }], mails: [], watchlist: [] }) },
      board: { snapshot: () => ({ quotes: {} }) },
      codesOf: () => [],
      alertsOf: () => ({ alerts: [] }),
    }
    const out = await collectSources({}, desk, ['desk', 'meeting', 'nope'])
    assert.equal(out.desk.available, true)
    assert.equal(out.desk.value.openTasks, 1)
    assert.equal(out.meeting.available, false)
    assert.equal(out.nope.available, false)
    assert.match(out.nope.reason, /未知数据源/)
  })

  test('数据源目录用一句话说明能拿到什么', () => {
    for (const name of ['desk', 'quotes', 'meeting']) {
      assert.ok(SOURCES[name].description.length > 8)
      assert.ok(SOURCES[name].refresh)
    }
  })
})

describe('占位符：渲染时才解析', () => {
  test('已知路径替换成实时值，未知路径原样保留', () => {
    const data = { meeting: { available: true, value: { running: true, heard: 7 } } }
    assert.equal(interpolate('{{meeting.heard}}', data), '7')
    assert.equal(interpolate('{{meeting.running}}', data), 'true')
    assert.equal(interpolate('{{meeting.nope}}', data), '{{meeting.nope}}')
    assert.equal(interpolate('{{quotes.price}}', data), '{{quotes.price}}')
  })

  test('对象和数组递归替换，不影响原有结构', () => {
    const data = { meeting: { available: true, value: { heard: 7 } } }
    const spec = { title: '盯场 {{meeting.heard}}', items: [{ type: 'list', items: ['{{meeting.heard}} 条'] }] }
    assert.deepEqual(interpolate(spec, data), { title: '盯场 7', items: [{ type: 'list', items: ['7 条'] }] })
  })
})

describe('会议与待办结合', () => {
  test('upcomingEvents 只留未结束的、按开始时间排序并带分钟数', () => {
    const now = new Date('2026-11-17T09:00:00+08:00')
    const state = {
      events: [
        { id: 'late', title: '改版评审', start: '2026-11-17T14:00:00+08:00', end: '2026-11-17T15:00:00+08:00', status: 'confirmed' },
        { id: 'soon', title: '产品周会', start: '2026-11-17T09:30:00+08:00', end: '2026-11-17T10:00:00+08:00', status: 'confirmed', location: '3 楼' },
        { id: 'gone', title: '已结束', start: '2026-11-17T08:00:00+08:00', end: '2026-11-17T08:30:00+08:00', status: 'confirmed' },
        { id: 'cancel', title: '取消的会', start: '2026-11-17T09:10:00+08:00', status: 'cancelled' },
      ],
    }
    const rows = upcomingEvents(state, now, 5)
    assert.deepEqual(rows.map(row => row.id), ['soon', 'late'])
    assert.equal(rows[0].minutesUntil, 30)
    assert.equal(rows[0].location, '3 楼')
    assert.equal(rows[1].minutesUntil, 300)
    assert.equal(upcomingEvents(state, now, 1).length, 1, 'limit 生效')
  })

  test('deskSource 同时给出接下来会议与会前待办', () => {
    const now = new Date()
    const soon = new Date(now.getTime() + 20 * 60000).toISOString()
    const later = new Date(now.getTime() + 5 * 60000).toISOString()
    const state = {
      events: [{ id: 'e1', title: '马上开', start: soon, end: new Date(now.getTime() + 60 * 60000).toISOString(), status: 'confirmed' }],
      tasks: [{ id: 't1', title: '准备材料', due: later, done: false }, { id: 't2', title: '已完成', done: true }],
  }
    const value = deskSource(state).value
    assert.equal(value.nextEvents.length, 1)
    assert.equal(value.nextEvents[0].title, '马上开')
    assert.deepEqual(value.dueTasks.map(task => task.id), ['t1'])
    assert.equal(value.openTasks, 1)
  })
})
