// 图像资产：工作台自己存一份，卡片只引用 assetId，不把 base64 塞进布局。
// 只收位图（png/jpeg/webp/gif），不收 SVG（避免脚本与外部引用）。
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
}
const MAX_BYTES = 8 * 1024 * 1024

export class AssetStore {
  constructor(home) {
    this.dir = join(home, 'assets')
    this.index = join(home, 'assets.json')
    this.queue = Promise.resolve()
  }

  async meta() {
    try {
      return JSON.parse(await readFile(this.index, 'utf8'))
    } catch {
      return { assets: [] }
    }
  }

  async put({ data, mime, name }) {
    const ext = TYPES[mime]
    if (!ext) throw new Error(`不支持的图片类型：${mime || '未知'}（只收 PNG/JPEG/WebP/GIF）`)
    const buffer = Buffer.from(String(data ?? ''), 'base64')
    if (!buffer.length) throw new Error('图片内容为空')
    if (buffer.length > MAX_BYTES) throw new Error(`图片超过 ${Math.round(MAX_BYTES / 1048576)}MB`)
    await mkdir(this.dir, { recursive: true })
    const id = randomUUID()
    const file = join(this.dir, `${id}.${ext}`)
    const tmp = `${file}.tmp`
    await writeFile(tmp, buffer)
    await rename(tmp, file)
    this.queue = this.queue.then(async () => {
      const current = await this.meta()
      const record = { id, mime, name: typeof name === 'string' ? name.slice(0, 80) : '', bytes: buffer.length, at: new Date().toISOString() }
      const next = { assets: [record, ...(current.assets ?? [])].slice(0, 200) }
      await writeFile(this.index, JSON.stringify(next))
      try { await stat(file) } catch {}
      return record
    })
    return this.queue
  }

  async file(id) {
    if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) return null
    const current = await this.meta()
    const record = (current.assets ?? []).find(asset => asset.id === id)
    if (!record) return null
    const ext = TYPES[record.mime]
    if (!ext) return null
    try {
      const body = await readFile(join(this.dir, `${id}.${ext}`))
      return { body, mime: record.mime, record }
    } catch {
      return null
    }
  }

  async list() {
    return (await this.meta()).assets ?? []
  }
}
