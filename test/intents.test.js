import { test } from 'node:test'
import assert from 'node:assert/strict'
import { localIntent, parseWhen } from '../src/intents.js'
import { buildSeed, migrateState } from '../src/seed.js'

const now = new Date('2026-11-09T09:00:00+08:00')
const state = () => migrateState(buildSeed(now))
const quotes = {
  sh600519: { symbol: 'sh600519', name: '贵州茅台', code: '600519', price: 1444.21, prevClose: 1453, changePct: -0.6, change: -8.79 },
  sz000001: { symbol: 'sz000001', name: '平安银行', code: '000001', price: 11.87, prevClose: 11.81, changePct: 0.51, change: 0.06 },
}

test('时间解析：明天下午三点、40 分钟', () => {
  const when = parseWhen('明天下午三点和设计对一下改版，40 分钟', now)
  assert.equal(when.start.getHours(), 15)
  assert.equal(when.start.getDate(), 10)
  assert.equal(when.minutes, 40)
})

test('时间解析：半小时、不带日期时说「下午」给默认钟点', () => {
  assert.equal(parseWhen('今天下午和客户碰一下，半小时', now).minutes, 30)
  assert.equal(parseWhen('今天下午和客户碰一下', now).start.getHours(), 15)
  assert.equal(parseWhen('随便聊聊', now), null)
})

test('会议标题会把时间、时长和口头语剥掉', () => {
  const { ops, reply } = localIntent(state(), '明天下午三点和设计对一下改版，40 分钟', { now })
  assert.match(reply, /11月10日 15:00/)
  assert.equal(ops.length, 1)
  assert.equal(ops[0].op, 'add_event')
  assert.equal(ops[0].title, '和设计对一下改版')
  assert.equal((new Date(ops[0].end) - new Date(ops[0].start)) / 60000, 40)
})

test('查行情：说明字名和说代码都能认', () => {
  const byName = localIntent(state(), '茅台现在多少？', { now, quotes })
  assert.match(byName.reply, /贵州茅台 现价 1444\.21/)
  const byCode = localIntent(state(), '000001 涨了多少', { now, quotes })
  assert.match(byCode.reply, /平安银行/)
})

test('标已读：书名号里带逗号的主题也能认', () => {
  const fixture = state()
  const target = fixture.mails.find(mail => mail.subject.includes('改版稿'))
  const { ops } = localIntent(fixture, `把《${target.subject}》标为已读`, { now })
  assert.deepEqual(ops, [{ op: 'mark_mail', id: target.id, action: 'read' }])
})

test('加自选：已经拿到行情时可以用名字', () => {
  const { ops } = localIntent(state(), '加自选 贵州茅台', { now, quotes })
  assert.equal(ops[0].op, 'add_watch')
  assert.equal(ops[0].code, 'sh600519')
})

test('记待办带上截止时间', () => {
  const { ops } = localIntent(state(), '记一下：回周舟的邮件，今晚八点前', { now })
  assert.equal(ops[0].op, 'add_task')
  assert.match(ops[0].title, /回周舟的邮件/)
  assert.ok(ops[0].due)
  assert.equal(new Date(ops[0].due).getHours(), 20)
})

test('查未读、查今天的会、刷新的动作', () => {
  const fixture = state()
  assert.match(localIntent(fixture, '有几封未读？', { now }).reply, /封未读/)
  assert.match(localIntent(fixture, '今天有几个会？', { now }).reply, /个会/)
  assert.equal(localIntent(fixture, '同步一下邮件', { now }).actions[0].type, 'sync_mail')
  assert.equal(localIntent(fixture, '生成晨报', { now }).actions[0].type, 'brief')
})

test('听不懂时给出现在有多少东西，而不是空回复', () => {
  const { reply, ops } = localIntent(state(), '帮我把这个项目往前推一推', { now })
  assert.equal(ops.length, 0)
  assert.match(reply, /个会/)
  assert.match(reply, /条待办/)
})
