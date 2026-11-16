// 工作台布局的 Host 权威存储：操作校验、revision 冲突、requestId 幂等、落盘。
import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { COLUMNS, SIZES, applyWorkbenchOps, defaultWorkbench, sanitizeWorkbench, WorkbenchStore } from '../src/workbench.js'

test('尺寸语义：8 列，小 1×1 / 中 2×1 / 大 4×3', () => {
  assert.equal(COLUMNS, 8)
  assert.deepEqual([SIZES.s.w, SIZES.s.h], [1, 1])
  assert.deepEqual([SIZES.m.w, SIZES.m.h], [2, 1])
  assert.deepEqual([SIZES.l.w, SIZES.l.h], [4, 3])
})

test('默认布局三种尺寸都有，且至少九个组件位', () => {
  const layout = defaultWorkbench()
  const sizes = new Set(layout.atoms.map(atom => atom.size))
  for (const size of ['s', 'm', 'l']) assert.equal(sizes.has(size), true)
  assert.equal(layout.atoms.length >= 9, true)
  assert.equal(sanitizeWorkbench(layout).atoms.length, layout.atoms.length)
})

test('sanitize 拒绝未知类型、未知尺寸、重复 id 与非法 id', () => {
  assert.equal(sanitizeWorkbench({ atoms: [] }), null)
  assert.equal(sanitizeWorkbench({ atoms: [{ id: 'a', type: 'nope', size: 'm' }] }), null)
  assert.equal(sanitizeWorkbench({ atoms: [{ id: 'a', type: 'tasks', size: 'xl' }] }), null)
  assert.equal(sanitizeWorkbench({ atoms: [{ id: 'a/b', type: 'tasks', size: 'm' }] }), null)
  const deduped = sanitizeWorkbench({ atoms: [{ id: 'a', type: 'tasks', size: 'm' }, { id: 'a', type: 'mail', size: 'l' }] })
  assert.deepEqual(deduped.atoms.map(atom => atom.id), ['a'])
})

test('一批操作里只要有一条不合法，整批不写入', () => {
  const base = defaultWorkbench()
  const result = applyWorkbenchOps(base, [
    { op: 'resize', id: base.atoms[0].id, size: 's' },
    { op: 'add', type: 'nope', size: 'm' },
  ])
  assert.equal(result.errors.length, 1)
  assert.deepEqual(result.layout.atoms.map(atom => atom.size), base.atoms.map(atom => atom.size))
})

test('添加 / 调整 / 移动 / 移除 / 主题', () => {
  const base = { theme: 'instrument', atoms: [{ id: 'a', type: 'tasks', size: 'm' }, { id: 'b', type: 'mail', size: 's' }] }
  const result = applyWorkbenchOps(base, [
    { op: 'add', id: 'c', type: 'clock', size: 's' },
    { op: 'resize', id: 'a', size: 'l' },
    { op: 'move', id: 'a', to: 2 },
    { op: 'theme', theme: 'paper' },
  ])
  assert.equal(result.errors.length, 0)
  assert.equal(result.layout.theme, 'paper')
  assert.deepEqual(result.layout.atoms.map(atom => atom.id), ['b', 'c', 'a'])
  assert.equal(result.layout.atoms[2].size, 'l')

  const removed = applyWorkbenchOps(result.layout, [{ op: 'remove', id: 'b' }])
  assert.deepEqual(removed.layout.atoms.map(atom => atom.id), ['c', 'a'])
})

test('生成式卡片必须有合法 spec 才能加入', () => {
  const base = { theme: 'instrument', atoms: [{ id: 'a', type: 'tasks', size: 's' }] }
  const bad = applyWorkbenchOps(base, [{ op: 'add', id: 'g1', type: 'genui', size: 'm', spec: { items: [] } }])
  assert.equal(bad.errors.length, 1)
  const good = applyWorkbenchOps(base, [{ op: 'add', id: 'g2', type: 'genui', size: 'm', spec: { title: '概览', items: [{ type: 'stat', label: '会议', value: '3' }] } }])
  assert.equal(good.errors.length, 0)
  assert.equal(good.layout.atoms.at(-1).spec.items.length, 1)
})

test('生成式卡片支持三档规格：views 里按尺寸取默认，缺档退回统一规格', () => {
  const base = { theme: 'instrument', atoms: [{ id: 'a', type: 'tasks', size: 's' }] }
  const spec = {
    title: '本周',
    views: {
      s: { title: '6 个会', items: [{ type: 'stat', label: '今天', value: '6' }] },
      l: { title: '本周工作概览', items: [{ type: 'chart', data: [{ label: '周一', value: 2 }] }] },
    },
  }
  const result = applyWorkbenchOps(base, [{ op: 'add', id: 'g', type: 'genui', size: 'm', spec }])
  assert.equal(result.errors.length, 0)
  const atom = result.layout.atoms.at(-1)
  assert.deepEqual(Object.keys(atom.spec.views).sort(), ['l', 's'])
  assert.equal(atom.spec.views.s.title, '6 个会')
})

test('生成式卡片只有空 views 时仍然拒绝', () => {
  const base = { theme: 'instrument', atoms: [{ id: 'a', type: 'tasks', size: 's' }] }
  const bad = applyWorkbenchOps(base, [{ op: 'add', id: 'g', type: 'genui', size: 'm', spec: { views: { s: { items: [] } } } }])
  assert.equal(bad.errors.length, 1)
})

test('FullWidget 类型可以进布局，未知 fw id 的格式错误会被拒', () => {
  const base = { atoms: [{ id: 'a', type: 'tasks', size: 's' }] }
  const ok = applyWorkbenchOps(base, [{ op: 'add', id: 'w1', type: 'fw:calendar', size: 'l' }])
  assert.equal(ok.errors.length, 0)
  const bad = applyWorkbenchOps(base, [{ op: 'add', id: 'w2', type: 'fw:../../etc', size: 'm' }])
  assert.equal(bad.errors.length, 1)
})

test('文件存储：落盘、revision 递增、旧 revision 被拒、requestId 幂等', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'wd-workbench-'))
  const store = new WorkbenchStore(dir)
  const first = await store.read()
  assert.equal(first.revision, 1)

  const add = await store.apply({ ops: [{ op: 'add', id: 'z', type: 'clock', size: 's' }], requestId: 'r1' })
  assert.equal(add.ok, true)
  assert.equal(add.revision, 2)

  const replay = await store.apply({ ops: [{ op: 'add', id: 'z2', type: 'clock', size: 's' }], requestId: 'r1' })
  assert.equal(replay.replayed, true)
  assert.equal(replay.revision, 2)

  const conflict = await store.apply({ ops: [{ op: 'remove', id: 'z' }], baseRevision: 1, requestId: 'r2' })
  assert.equal(conflict.conflict, true)

  const removed = await store.apply({ ops: [{ op: 'remove', id: 'z' }], baseRevision: 2, requestId: 'r3' })
  assert.equal(removed.ok, true)
  assert.equal(removed.revision, 3)

  const onDisk = JSON.parse(await readFile(join(dir, 'workbench.json'), 'utf8'))
  assert.equal(onDisk.revision, 3)
  assert.equal(onDisk.atoms.some(atom => atom.id === 'z'), false)
})
