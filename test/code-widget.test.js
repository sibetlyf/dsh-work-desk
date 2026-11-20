import test from 'node:test'
import assert from 'node:assert/strict'
import { frameDoc, parseCodeWidget } from '../client/fw/code-widget.js'

const fence = body => '```workbench-widget\n' + body + '\n```'
const okBody = JSON.stringify({
  manifest: { id: 'week-card', title: '本周概览', size: 'm', sources: ['desk'] },
  code: "(props) => '<b>' + props.data.desk.value.openTasks + '</b>'",
})

test('解析代码组件：manifest、代码与订阅数据源', () => {
  const parsed = parseCodeWidget(fence(okBody))
  assert.equal(parsed.manifest.id, 'week-card')
  assert.equal(parsed.manifest.size, 'm')
  assert.deepEqual(parsed.manifest.sources, ['desk'])
  assert.match(parsed.code, /openTasks/)
})

test('拒绝不合规的代码组件：越权 API、空代码、坏 id、非 JSON', () => {
  const bad = [
    JSON.stringify({ manifest: { id: 'x' }, code: 'fetch("/etc/passwd")' }),
    JSON.stringify({ manifest: { id: 'x' }, code: '' }),
    JSON.stringify({ manifest: { id: 'Bad Id' }, code: '() => "ok"' }),
    'not json',
  ]
  for (const body of bad) assert.equal(parseCodeWidget(fence(body)), null)
})

test('沙箱文档把数据传进去，且不暴露同源能力', () => {
  const doc = frameDoc('() => "<div>hi</div>"', { desk: { value: { openTasks: 3 } } })
  assert.match(doc, /openTasks/)
  assert.doesNotMatch(doc, /allow-same-origin/)
})
