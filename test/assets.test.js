import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { AssetStore } from '../src/assets.js'

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

test('资产库：写入、读回、列出，且内容一致', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'wd-assets-'))
  const store = new AssetStore(dir)
  const record = await store.put({ data: PNG, mime: 'image/png', name: '像素.png' })
  assert.match(record.id, /^[0-9a-f-]{36}$/)
  assert.equal(record.mime, 'image/png')
  const found = await store.file(record.id)
  assert.ok(found)
  assert.equal(found.mime, 'image/png')
  assert.equal(found.body.length > 0, true)
  assert.deepEqual((await store.list()).map(asset => asset.id), [record.id])
})

test('资产库：拒绝 SVG、空内容与非法 id', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'wd-assets-'))
  const store = new AssetStore(dir)
  await assert.rejects(() => store.put({ data: 'PHN2Zz48L3N2Zz4=', mime: 'image/svg+xml' }), /不支持的图片类型/)
  await assert.rejects(() => store.put({ data: '', mime: 'image/png' }), /内容为空/)
  assert.equal(await store.file('../../etc/passwd'), null)
  assert.equal(await store.file('not-a-uuid'), null)
})
