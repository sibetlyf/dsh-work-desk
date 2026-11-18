import test from 'node:test'
import assert from 'node:assert/strict'
import { GRAMMAR_BRIEF, auditView, typeScale } from '../client/fw/grammar.js'

const ok = { title: '今日概览', items: [{ type: 'stat', label: '会议', value: '4' }, { type: 'text', content: '还有两条待办' }] }

test('合格规格得分高且不阻塞', () => {
  const audit = auditView(ok, 'm')
  assert.equal(audit.blocked, false)
  assert.ok(audit.score >= 80)
})

test('两个主读数抢注意力时判 fail 并说明原因', () => {
  const audit = auditView({ title: '两个数字', items: [{ type: 'stat', label: 'A', value: '1' }, { type: 'stat', label: 'B', value: '2' }] }, 'm')
  assert.equal(audit.blocked, true)
  assert.ok(audit.issues.some(issue => /主读数不唯一/.test(issue)))
})

test('信息量按尺寸收敛：超过预算即 fail', () => {
  const items = ['stat', 'text', 'list', 'callout', 'badge'].map(type => ({ type }))
  assert.equal(auditView({ title: '满', items }, 's').blocked, true)
  assert.equal(auditView({ title: '满', items }, 'l').blocked, false)
})

test('小卡不放图表与步骤', () => {
  const chart = { title: '走势', items: [{ type: 'stat', label: '涨', value: '1' }, { type: 'chart', data: [] }] }
  assert.equal(auditView(chart, 's').blocked, true)
  assert.equal(auditView(chart, 'm').blocked, false)
  const steps = { title: '步骤', items: [{ type: 'stat', label: '进度', value: '1' }, { type: 'steps', steps: [] }] }
  assert.equal(auditView(steps, 's').blocked, true)
})

test('缺少主读数只是提醒，不阻塞', () => {
  const audit = auditView({ title: '清单', items: [{ type: 'list', items: ['a', 'b'] }] }, 'm')
  assert.equal(audit.blocked, false)
  assert.ok(audit.score < 100)
  assert.ok(audit.issues.some(issue => /主读数/.test(issue)))
})

test('字号随单元缩放，150 为基准', () => {
  assert.deepEqual(typeScale('m'), { title: 17, primary: 27, caption: 13 })
  const s = typeScale('s')
  const l = typeScale('l')
  assert.ok(s.primary < l.primary)
})

test('给模型的规则和评分用同一套说法', () => {
  assert.match(GRAMMAR_BRIEF, /主读数只能有一个/)
  assert.match(GRAMMAR_BRIEF, /小卡最多 2 块/)
})
