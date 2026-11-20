import test from 'node:test'
import assert from 'node:assert/strict'
import { DESIGN_PROMPT_SECTION } from '../src/design-prompt.js'

test('设计提示段关闭变量插值：文本里的 {{desk.openTasks}} 是给模型看的示例，不是提示变量', () => {
  assert.equal(DESIGN_PROMPT_SECTION.interpolate, false)
  assert.match(DESIGN_PROMPT_SECTION.text, /desk\.openTasks/)
})

test('提示段覆盖关键流程与工具名', () => {
  for (const keyword of ['workbench-ui', 'workbench-widget', 'workbench_create', 'workbench_apply', '空间语法']) {
    assert.ok(DESIGN_PROMPT_SECTION.text.includes(keyword), `提示段缺少 ${keyword}`)
  }
  assert.ok(DESIGN_PROMPT_SECTION.name && DESIGN_PROMPT_SECTION.order > 0)
})
