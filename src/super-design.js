// 超级创模式：一份可编辑草稿 + 批注 + 发布。草稿与正式工作台分离，
// 发布仍复用 WorkbenchStore.apply 的 revision / replace 校验。
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { applyWorkbenchOps, sanitizeWorkbench } from './workbench.js'

const MAX_COMMENTS = 100
const MAX_DRAFT_ATOMS = 24

function cleanText(value, max = 500) {
  return typeof value === 'string' ? value.slice(0, max) : ''
}

function cleanComments(rows) {
  return (Array.isArray(rows) ? rows : []).slice(-MAX_COMMENTS).map(row => ({
    id: typeof row?.id === 'string' ? row.id : randomUUID(),
    atomId: typeof row?.atomId === 'string' ? row.atomId : '',
    text: cleanText(row?.text, 500),
    status: row?.status === 'resolved' ? 'resolved' : 'open',
    createdAt: Number.isFinite(row?.createdAt) ? row.createdAt : Date.now(),
  })).filter(row => row.text)
}

export class SuperDesignStore {
  constructor(root, workbench) {
    this.root = root
    this.workbench = workbench
    this.path = join(root, 'super-design.json')
    this.data = null
    this.chain = Promise.resolve()
  }

  async load() {
    if (this.data) return this.data
    try {
      const raw = JSON.parse((await readFile(this.path, 'utf8')).replace(/^\uFEFF/, ''))
      const draft = sanitizeWorkbench(raw?.draft)
      if (draft) {
        this.data = {
          revision: Math.max(1, Number(raw.revision) || 1),
          baseRevision: Number(raw.baseRevision) || 0,
          draft,
          comments: cleanComments(raw.comments),
          selection: typeof raw.selection === 'string' ? raw.selection : '',
          updatedAt: Number(raw.updatedAt) || Date.now(),
        }
      }
    } catch { /* no draft yet */ }
    if (this.data) return this.data
    const layout = await this.workbench.read()
    this.data = {
      revision: 1,
      baseRevision: layout.revision,
      draft: { theme: layout.theme, atoms: layout.atoms.map(atom => ({ ...atom })) },
      comments: [],
      selection: layout.atoms[0]?.id ?? '',
      updatedAt: Date.now(),
    }
    await this.flush()
    return this.data
  }

  async open() {
    await this.load()
    return this.state()
  }

  async state() {
    const data = await this.load()
    const current = await this.workbench.read()
    return {
      revision: data.revision,
      baseRevision: data.baseRevision,
      workbenchRevision: current.revision,
      stale: current.revision !== data.baseRevision,
      draft: data.draft,
      comments: data.comments,
      selection: data.selection,
      updatedAt: data.updatedAt,
    }
  }

  async flush() {
    await mkdir(dirname(this.path), { recursive: true })
    const tmp = `${this.path}.${randomUUID()}.tmp`
    await writeFile(tmp, JSON.stringify(this.data, null, 2), 'utf8')
    await rename(tmp, this.path)
  }

  async reset() {
    const data = await this.load()
    const layout = await this.workbench.read()
    this.data = {
      revision: data.revision + 1,
      baseRevision: layout.revision,
      draft: { theme: layout.theme, atoms: layout.atoms.map(atom => ({ ...atom })) },
      comments: [],
      selection: layout.atoms[0]?.id ?? '',
      updatedAt: Date.now(),
    }
    await this.flush()
    return this.state()
  }

  async updateDraft(input = {}) {
    const data = await this.load()
    const draft = sanitizeWorkbench(input.draft ?? data.draft)
    if (!draft) throw Object.assign(new Error('草稿布局不合法'), { status: 400 })
    if (draft.atoms.length > MAX_DRAFT_ATOMS) throw Object.assign(new Error('草稿组件超过上限'), { status: 413 })
    data.draft = draft
    if (typeof input.selection === 'string') data.selection = input.selection
    data.revision += 1
    data.updatedAt = Date.now()
    await this.flush()
    return this.state()
  }

  async applyOps(ops) {
    const data = await this.load()
    const result = applyWorkbenchOps(data.draft, ops, { newId: () => `super-${randomUUID().slice(0, 8)}` })
    if (result.errors.length) throw Object.assign(new Error(result.errors[0]), { status: 400 })
    data.draft = result.layout
    data.revision += 1
    data.updatedAt = Date.now()
    await this.flush()
    return { ...(await this.state()), applied: result.applied }
  }

  async select(atomId) {
    const data = await this.load()
    if (data.draft.atoms.some(atom => atom.id === atomId)) data.selection = atomId
    await this.flush()
    return this.state()
  }

  async comment(input = {}) {
    const data = await this.load()
    const action = String(input.action ?? 'add')
    if (action === 'add') {
      const text = cleanText(input.text).trim()
      if (!text) throw Object.assign(new Error('批注不能为空'), { status: 400 })
      if (data.comments.length >= MAX_COMMENTS) data.comments.shift()
      data.comments.push({
        id: randomUUID(),
        atomId: cleanText(input.atomId, 80),
        text,
        status: 'open',
        createdAt: Date.now(),
      })
    } else if (action === 'resolve') {
      const row = data.comments.find(item => item.id === input.id)
      if (!row) throw Object.assign(new Error('批注不存在'), { status: 404 })
      row.status = 'resolved'
    } else if (action === 'remove') {
      data.comments = data.comments.filter(item => item.id !== input.id)
    } else throw Object.assign(new Error('未知批注操作'), { status: 400 })
    data.revision += 1
    data.updatedAt = Date.now()
    await this.flush()
    return this.state()
  }

  async publish(input = {}) {
    const data = await this.load()
    const baseRevision = Number.isInteger(input.baseRevision) ? input.baseRevision : data.baseRevision
    const result = await this.workbench.apply({
      ops: [{ op: 'replace', layout: data.draft }],
      baseRevision,
      source: 'super-design',
    })
    if (result.ok) {
      data.baseRevision = result.revision
      data.revision += 1
      data.updatedAt = Date.now()
      await this.flush()
      return { ...result, super: await this.state() }
    }
    return result
  }
}
