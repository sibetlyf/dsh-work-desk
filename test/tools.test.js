// 工具层测试：注册了哪几张工具、参数长什么样、execute 是不是真的写进了 store。
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { registerTools, TOOL_NAMES } from '../src/tools.js'
import { buildSeed, migrateState } from '../src/seed.js'

function harness() {
  const state = migrateState(buildSeed(new Date('2026-11-09T09:00:00+08:00')))
  const tools = new Map()
  const ctx = {
    get(name) {
      if (name !== 'tools') return undefined
      return {
        register(definition) {
          tools.set(definition.name, definition)
          return () => tools.delete(definition.name)
        },
      }
    },
    effect(fn) { return fn() },
  }
  const store = {
    read: async () => state,
    mutate: async (_label, fn) => fn(state),
  }
  const board = { snapshot: () => ({ quotes: { sh600519: { symbol: 'sh600519', name: '贵州茅台', price: 1444.21, changePct: -0.6 } } }) }
  const dispose = registerTools(ctx, { store, board })
  return { ctx, tools, state, store, board, dispose }
}

test('注册三张工具，名字都带 work_desk_ 前缀', () => {
  const { tools, dispose } = harness()
  assert.deepEqual([...tools.keys()].sort(), [...TOOL_NAMES].sort())
  for (const definition of tools.values()) {
    assert.equal(typeof definition.execute, 'function')
    assert.equal(definition.parameters.type, 'object')
    assert.ok(definition.description.length > 20)
    assert.equal(typeof definition.output.render, 'function')
  }
  dispose()
})

test('通过工具加日程：真的落进 state，回执和参数都对', async () => {
  const { tools, state } = harness()
  const result = await tools.get('work_desk_calendar').execute({
    action: 'add', title: '和法务对合同', start: '2026-11-11T10:00:00+08:00', minutes: 30, location: '3 楼',
  })
  assert.match(result.receipt, /和法务对合同/)
  assert.equal(result.events.length, 1)
  const event = state.events.find(row => row.id === result.events[0].id)
  assert.equal(event.location, '3 楼')
  assert.equal((new Date(event.end) - new Date(event.start)) / 60000, 30)
})

test('只改开始时间时沿用原时长', async () => {
  const { tools, state } = harness()
  const added = await tools.get('work_desk_calendar').execute({ action: 'add', title: '周会', start: '2026-11-10T09:00:00+08:00', end: '2026-11-10T10:30:00+08:00' })
  const id = added.events[0].id
  await tools.get('work_desk_calendar').execute({ action: 'update', id, start: '2026-11-11T15:00:00+08:00' })
  const event = state.events.find(row => row.id === id)
  assert.equal((new Date(event.end) - new Date(event.start)) / 60000, 90)
  assert.equal(new Date(event.start).getHours(), 15)
})

test('参数不合法时抛错，不会留下半条数据', async () => {
  const { tools, state } = harness()
  const before = state.events.length
  await assert.rejects(() => tools.get('work_desk_calendar').execute({ action: 'add', title: '倒序', start: '2026-11-11T10:00:00+08:00', end: '2026-11-11T09:00:00+08:00' }), /结束时间/)
  assert.equal(state.events.length, before)
})

test('列日程只给未来 N 天，且不含取消的', async () => {
  const { tools, state } = harness()
  state.events.push({ id: 'e_next', title: '下周的会', start: '2026-11-20T10:00:00+08:00', end: '2026-11-20T10:30:00+08:00', status: 'confirmed' })
  state.events.push({ id: 'e_cancel', title: '取消的会', start: '2026-11-11T10:00:00+08:00', end: '2026-11-11T10:30:00+08:00', status: 'cancelled' })
  const result = await tools.get('work_desk_calendar').execute({ action: 'list', days: 3 })
  assert.ok(result.events.every(event => event.status !== 'cancelled'))
  assert.ok(!result.events.some(event => event.title === '下周的会'))
})

test('待办：加一条、勾掉、列出来', async () => {
  const { tools, state } = harness()
  const added = await tools.get('work_desk_task').execute({ action: 'add', title: '回周舟的邮件', due: '2026-11-09T20:00:00+08:00' })
  const id = added.tasks[0].id
  const toggled = await tools.get('work_desk_task').execute({ action: 'toggle', id })
  assert.equal(toggled.tasks[0].done, true)
  const list = await tools.get('work_desk_task').execute({ action: 'list' })
  assert.ok(!list.tasks.some(task => task.id === id))
  assert.equal(state.tasks.find(task => task.id === id).done, true)
})

test('状态工具：今天的会 + 未读 + 行情一句话', async () => {
  const { tools } = harness()
  const result = await tools.get('work_desk_state').execute({})
  assert.match(result.today, /个会/)
  assert.match(result.today, /未读/)
  assert.equal(typeof result.unread, 'number')
  assert.ok(Array.isArray(result.events))
  assert.equal(result.quotes[0].name, '贵州茅台')
})

test('dispose 之后工具被摘掉', () => {
  const { tools, dispose } = harness()
  assert.equal(tools.size, 3)
  dispose()
  assert.equal(tools.size, 0)
})
