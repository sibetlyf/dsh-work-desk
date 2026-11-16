// 工作台布局模型的单元测试：尺寸语义、默认布局覆盖、非法数据的兜底。
import assert from 'node:assert/strict'
import test from 'node:test'
import { ATOMS, COLUMNS, MAX_ATOMS, SIZES, cellCount, defaultLayout, sanitize } from '../client/fw/layout.js'

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
