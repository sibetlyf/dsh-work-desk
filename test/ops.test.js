import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyOps } from '../src/ops.js'
import { buildSeed, migrateState } from '../src/seed.js'

const now = new Date('2026-11-09T10:00:00+08:00')

function fresh() {
  return migrateState(buildSeed(now))
}

test('新建日程：默认 30 分钟，回执带时间', () => {
  const state = fresh()
  const before = state.events.length
  const { receipts, errors } = applyOps(state, [{ op: 'add_event', title: '和设计对稿', start: '2026-11-10T14:00:00+08:00' }])
  assert.equal(errors.length, 0)
  assert.equal(state.events.length, before + 1)
  const event = state.events.find(row => row.title === '和设计对稿')
  assert.equal((new Date(event.end) - new Date(event.start)) / 60000, 30)
  assert.match(receipts[0].text, /和设计对稿/)
})

test('只改开始时间时保持原有时长', () => {
  const state = fresh()
  const { errors } = applyOps(state, [{ op: 'add_event', title: '周会', start: '2026-11-10T09:00:00+08:00', end: '2026-11-10T10:30:00+08:00' }])
  assert.equal(errors.length, 0)
  const event = state.events.find(row => row.title === '周会')
  const { errors: next } = applyOps(state, [{ op: 'update_event', id: event.id, start: '2026-11-11T15:00:00+08:00' }])
  assert.equal(next.length, 0)
  assert.equal((new Date(event.end) - new Date(event.start)) / 60000, 90)
})

test('结束早于开始会被拒绝，且不影响其它操作', () => {
  const state = fresh()
  const { receipts, errors } = applyOps(state, [
    { op: 'add_event', title: '倒着开会', start: '2026-11-10T10:00:00+08:00', end: '2026-11-10T09:00:00+08:00' },
    { op: 'add_task', title: '补上会议纪要' },
  ])
  assert.equal(receipts.length, 1)
  assert.match(errors[0], /结束时间/)
  assert.ok(state.tasks.some(task => task.title === '补上会议纪要'))
})

test('自选去重、代码规整成带市场前缀', () => {
  const state = fresh()
  applyOps(state, [{ op: 'add_watch', code: '600036' }])
  applyOps(state, [{ op: 'add_watch', code: 'sh600036' }])
  const rows = state.watchlist.filter(row => row.code === 'sh600036')
  assert.equal(rows.length, 1)
})

test('持仓写入时自动进自选，股数非法会报错', () => {
  const state = fresh()
  const { errors } = applyOps(state, [{ op: 'add_position', code: '000858', shares: 100, cost: 130 }])
  assert.equal(errors.length, 0)
  assert.ok(state.watchlist.some(row => row.code === 'sz000858'))
  const bad = applyOps(state, [{ op: 'add_position', code: '000858', shares: 0, cost: 130 }])
  assert.match(bad.errors[0], /股数/)
})

test('邮件标记只认四种动作', () => {
  const state = fresh()
  const mail = state.mails[0]
  applyOps(state, [{ op: 'mark_mail', id: mail.id, action: 'star' }])
  assert.equal(mail.starred, true)
  const { errors } = applyOps(state, [{ op: 'mark_mail', id: mail.id, action: 'archive' }])
  assert.match(errors[0], /不支持/)
})

test('清空示例不会碰用户自己的数据', () => {
  const state = fresh()
  applyOps(state, [{ op: 'add_event', title: '我自己的会', start: '2026-11-12T10:00:00+08:00' }])
  applyOps(state, [{ op: 'clear_samples' }])
  assert.ok(state.events.every(event => !event.sample))
  assert.ok(state.events.some(event => event.title === '我自己的会'))
  assert.equal(state.watchlist.length, 0)
  assert.equal(state.sampleCleared, true)
})

test('未知 op 只报错，不抛异常', () => {
  const state = fresh()
  const { receipts, errors } = applyOps(state, [{ op: 'drop_database' }])
  assert.equal(receipts.length, 0)
  assert.match(errors[0], /不支持的操作/)
})
