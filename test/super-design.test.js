import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { WorkbenchStore } from '../src/workbench.js'
import { SuperDesignStore } from '../src/super-design.js'

test('super design keeps a separate draft, comments and publishes once', async t => {
  const root = await mkdtemp(join(tmpdir(), 'wd-super-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const workbench = new WorkbenchStore(root)
  const superDesign = new SuperDesignStore(root, workbench)
  const opened = await superDesign.open()
  assert.ok(opened.draft.atoms.length > 0)
  assert.equal(opened.stale, false)

  const changed = await superDesign.applyOps([
    { op: 'theme', theme: 'paper' },
    { op: 'resize', id: opened.draft.atoms[0].id, size: 's' },
  ])
  assert.equal(changed.draft.theme, 'paper')
  assert.equal(changed.draft.atoms[0].size, 's')

  const commented = await superDesign.comment({ action: 'add', atomId: opened.draft.atoms[0].id, text: '主读数只留一个' })
  assert.equal(commented.comments.length, 1)
  assert.equal(commented.comments[0].status, 'open')

  const published = await superDesign.publish({ baseRevision: opened.baseRevision })
  assert.equal(published.ok, true)
  assert.equal((await workbench.read()).theme, 'paper')
  assert.equal((await superDesign.state()).stale, false)
})

test('super design rejects publishing over a newer workbench revision', async t => {
  const root = await mkdtemp(join(tmpdir(), 'wd-super-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const workbench = new WorkbenchStore(root)
  const superDesign = new SuperDesignStore(root, workbench)
  const opened = await superDesign.open()
  const applied = await workbench.apply({ ops: [{ op: 'theme', theme: 'type' }], baseRevision: opened.baseRevision })
  assert.equal(applied.ok, true)
  const stale = await superDesign.state()
  assert.equal(stale.stale, true)
  const published = await superDesign.publish({ baseRevision: opened.baseRevision })
  assert.equal(published.ok, false)
  assert.equal(published.conflict, true)
})
test('画布确认后创建新工作台：原工作台保留，新工作台成为当前', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'wd-super-'))
  const workbench = new WorkbenchStore(dir)
  await workbench.read()
  const superStore = new SuperDesignStore(dir, workbench)
  const before = await workbench.read()
  const created = await superStore.publish({ mode: 'new', name: '复盘工作台' })
  assert.equal(created.ok, true)
  assert.equal(created.bench.name, '复盘工作台')
  assert.equal(created.revision, before.revision + 1)
  const after = await workbench.read()
  assert.equal(after.benches.length, 1)
  assert.equal(after.activeId, created.bench.id)
  assert.equal(after.atoms.length, before.atoms.length)
})

test('草稿布局不合法时不创建工作台', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'wd-super-'))
  const workbench = new WorkbenchStore(dir)
  await workbench.read()
  const result = await workbench.createBench({ name: '空的', layout: { theme: 'paper', atoms: [] } })
  assert.equal(result.ok, false)
  assert.equal((await workbench.read()).benches.length, 0)
})
