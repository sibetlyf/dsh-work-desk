import test from 'node:test'
import assert from 'node:assert/strict'
import { previewFromText } from '../client/fw/ui-preview.js'

test('live UI accepts complete declarative workbench fences', () => {
  const preview = previewFromText('```workbench-ui\n{"title":"你好","items":[{"type":"stat","value":"3","label":"会议"}]}\n```')
  assert.equal(preview.complete, true)
  assert.equal(preview.spec.title, '你好')
})
test('incomplete live UI only exposes fully parsed items and remains unsaveable', () => {
  const preview = previewFromText('```workbench-ui\n{"title":"进行中","items":[{"type":"text","content":"第一段"},{"type":"text","content":"未完成')
  assert.equal(preview.complete, false)
  assert.equal(preview.spec.items.length, 1)
  assert.equal(preview.spec.items[0].content, '第一段')
})
test('braces inside quoted strings do not terminate objects', () => {
  const preview = previewFromText('```json\n{"items":[{"type":"text","content":"花括号 } [ {"},')
  assert.equal(preview.spec.items[0].content, '花括号 } [ {')
})
test('HTML scripts and empty / unknown specs cannot become UI', () => {
  for (const text of ['<script>alert(1)</script>', '```json\n{"items":[]}\n```', '```dsh-ui\n{"items":[{"type":"script","content":"alert(1)"}]}\n```']) {
    assert.equal(previewFromText(text), null)
  }
})
test('latest supported fence wins and three size variants survive', () => {
  const spec = { views: { s: { items: [{ type: 'stat', value: '4' }] }, l: { items: [{ type: 'text', content: '完整信息' }] } } }
  const preview = previewFromText('```workbench-ui\n' + JSON.stringify(spec) + '\n```')
  assert.equal(preview.complete, true)
  assert.deepEqual(preview.spec, spec)
})
