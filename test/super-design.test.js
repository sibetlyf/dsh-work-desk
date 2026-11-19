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
