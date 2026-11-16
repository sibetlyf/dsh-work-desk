// 工作台布局模型的单元测试：尺寸语义、默认布局覆盖、非法数据的兜底。
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ATOMS, COLUMNS, GENUI_NODE_TYPES, MAX_ATOMS, SIZES, cellCount, columnsFor, defaultLayout,
  genuiSpecUsable, planLayout, sanitize, specDepthOk,
} from '../client/fw/layout.js'

test('网格常量：8 列，小 1×1 / 中 2×1 / 大 4×3', () => {
  assert.equal(COLUMNS, 8)
  assert.deepEqual({ w: SIZES.s.w, h: SIZES.s.h }, { w: 1, h: 1 })
  assert.deepEqual({ w: SIZES.m.w, h: SIZES.m.h }, { w: 2, h: 1 })
  assert.deepEqual({ w: SIZES.l.w, h: SIZES.l.h }, { w: 4, h: 3 })
})

test('默认布局：三种尺寸都有，一屏至少十个组件位，8 列不越界', () => {
  const layout = defaultLayout()
  assert.equal(layout.theme, 'instrument')
  const sizes = new Set(layout.atoms.map(atom => atom.size))
  for (const size of ['s', 'm', 'l']) assert.equal(sizes.has(size), true, `缺少 ${size} 档`)
  assert.equal(layout.atoms.length >= 9, true)

  // 每个大卡占 4 列，其余按 8 列贪心排布，必须能装进整行。
  let row = 0
  for (const atom of layout.atoms) {
    const { w, h } = SIZES[atom.size]
    if (row + w > COLUMNS) row = w
    else row += w
    assert.ok(w <= COLUMNS, `${atom.type} 宽度超出网格`)
    assert.ok(h >= 1)
  }
})

test('每个默认组件都在目录里，尺寸合法', () => {
  for (const atom of defaultLayout().atoms) {
    assert.ok(ATOMS[atom.type], `未知组件 ${atom.type}`)
    assert.ok(SIZES[atom.size], `未知尺寸 ${atom.size}`)
  }
})

test('占用格数按面积累计', () => {
  assert.equal(cellCount([{ size: 's' }, { size: 'm' }, { size: 'l' }]), 1 + 2 + 12)
})

test('sanitize：拒绝未知组件、非法尺寸、重复 id 与非对象数据', () => {
  assert.equal(sanitize(null), null)
  assert.equal(sanitize({ theme: 'instrument', atoms: [] }), null)
  assert.equal(sanitize({ theme: 'instrument', atoms: [{ id: 'a', type: 'unknown', size: 'm' }] }), null)
  assert.equal(sanitize({ theme: 'instrument', atoms: [{ id: 'a', type: 'tasks', size: 'xl' }] }), null)

  const deduped = sanitize({
    theme: 'paper',
    atoms: [
      { id: 'a', type: 'tasks', size: 'm' },
      { id: 'a', type: 'mail', size: 'l' },
      { id: 'b', type: 'mail', size: 's' },
    ],
  })
  assert.equal(deduped.theme, 'paper')
  assert.deepEqual(deduped.atoms.map(atom => atom.id), ['a', 'b'])
  assert.equal(deduped.atoms[0].type, 'tasks')
})

test('sanitize：未知主题退回 instrument，超出上限截断', () => {
  const many = Array.from({ length: MAX_ATOMS + 6 }, (_, index) => ({ id: `a${index}`, type: 'tasks', size: 's' }))
  const result = sanitize({ theme: 'neon', atoms: many })
  assert.equal(result.theme, 'instrument')
  assert.equal(result.atoms.length, MAX_ATOMS)
})

test('响应式列数：容器 ≤560 → 2，≤880 → 4，其余 8', () => {
  assert.equal(columnsFor(1500), 8)
  assert.equal(columnsFor(900), 8)
  assert.equal(columnsFor(880), 4)
  assert.equal(columnsFor(820), 4)
  assert.equal(columnsFor(561), 4)
  assert.equal(columnsFor(560), 2)
  assert.equal(columnsFor(390), 2)
  assert.equal(columnsFor(0), COLUMNS)
})

test('planLayout：默认 8 列，第一张大卡占 4×3，所有卡片不越界', () => {
  const layout = defaultLayout()
  const plan = planLayout(layout.atoms)
  assert.equal(plan.columns, 8)
  assert.deepEqual(plan.placed[0], { id: layout.atoms[0].id, row: 0, col: 0, w: 4, h: 3 })
  for (const spot of plan.placed) {
    assert.ok(spot.col >= 0)
    assert.ok(spot.col + spot.w <= 8, `${spot.id} 越界：${spot.col}+${spot.w}`)
  }
  assert.equal(plan.rows, 4)
})

test('planLayout：4 列/2 列容器按实际列数截断宽度，不产生隐式列', () => {
  const layout = defaultLayout()
  const four = planLayout(layout.atoms, 4)
  assert.equal(four.columns, 4)
  for (const spot of four.placed) assert.ok(spot.col + spot.w <= 4, `${spot.id} 越界：${spot.col}+${spot.w}`)
  const two = planLayout(layout.atoms, 2)
  assert.equal(two.columns, 2)
  assert.equal(two.placed[0].w, 2, '2 列时大卡应满宽')
  for (const spot of two.placed) assert.ok(spot.col + spot.w <= 2, `${spot.id} 越界：${spot.col}+${spot.w}`)
})

test('cellCount：未知尺寸退回中卡，不抛异常', () => {
  assert.equal(cellCount([{ size: 's' }, { size: 'm' }, { size: 'l' }]), 1 + 2 + 12)
  assert.equal(cellCount([{ size: 'xl' }]), 2)
})

test('生成式规格：空 items / 超深数组 / 未知 type 都不可用，合法规格可用', () => {
  assert.equal(genuiSpecUsable(null), false)
  assert.equal(genuiSpecUsable({}), false)
  assert.equal(genuiSpecUsable({ items: [] }), false)
  assert.equal(genuiSpecUsable({ items: [{ type: 'script', content: 'alert(1)' }] }), false)
  assert.equal(genuiSpecUsable({ items: [{ type: 'list', items: [[[[[[{ title: 'x' }]]]]]] }] }), false)
  assert.equal(genuiSpecUsable({ title: '概览', items: [{ type: 'stat', label: '会议', value: '3' }] }), true)
  assert.equal(genuiSpecUsable({ views: { s: { items: [{ type: 'badge', label: 'x' }] } } }), true)
  assert.equal(GENUI_NODE_TYPES.has('script'), false)
})

test('specDepthOk：正常规格通过，深层嵌套数组被拒', () => {
  const deep = { items: [{ type: 'list', items: [[[[[[[[[{ title: 'x' }]]]]]]]]] }] }
  assert.equal(specDepthOk(deep), false)
  assert.equal(specDepthOk({ title: 'x', items: [{ type: 'progress', label: 'p', value: 40 }] }), true)
})

test('sanitize：丢掉不合法的生成式规格（空 items / 超深 / 未知 type），合法规格保留', () => {
  const bad = [
    { id: 'g1', type: 'genui', size: 'm', spec: { items: [] } },
    { id: 'g2', type: 'genui', size: 'm', spec: { items: [{ type: 'list', items: [[[[[[{ title: 'x' }]]]]]] }] } },
    { id: 'g3', type: 'genui', size: 'm', spec: { items: [{ type: 'script' }] } },
  ]
  const good = { id: 'g4', type: 'genui', size: 'm', spec: { title: '概览', items: [{ type: 'stat', label: '会议', value: '3' }] } }
  const result = sanitize({ theme: 'paper', atoms: [...bad, good] })
  for (const atom of result.atoms.filter(row => row.id !== 'g4')) assert.equal('spec' in atom, false)
  assert.equal(result.atoms.find(atom => atom.id === 'g4').spec.items.length, 1)
})
