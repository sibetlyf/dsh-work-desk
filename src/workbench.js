// 工作台布局：Host 权威存储（$DSH_HOME/work-desk/workbench.json）。
// 界面与 Agent 都通过同一套操作修改它；revision 防覆盖，requestId 防重放。
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const COLUMNS = 8
export const SIZES = {
  s: { w: 1, h: 1, label: '小' },
  m: { w: 2, h: 1, label: '中' },
  l: { w: 4, h: 3, label: '大' },
}
export const THEMES = ['instrument', 'paper', 'type']
const MAX_ATOMS = 24
const FW_TYPE = /^fw:[a-z0-9-]{1,32}$/
const BUILTIN = new Set(['calendar', 'next', 'tasks', 'mail', 'quotes', 'brief', 'clock', 'alerts', 'quick'])
const MAX_SPEC_ITEMS = 40

export function isKnownType(type) {
  return typeof type === 'string' && (BUILTIN.has(type) || type === 'genui' || FW_TYPE.test(type))
}

/** 默认布局：三种尺寸都有，桌面一屏摆满。 */
export function defaultWorkbench() {
  return {
    theme: 'instrument',
    atoms: [
      { id: 'cal', type: 'calendar', size: 'l' },
      { id: 'next', type: 'next', size: 'm' },
      { id: 'tasks', type: 'tasks', size: 'm' },
      { id: 'mail', type: 'mail', size: 'm' },
      { id: 'quotes', type: 'quotes', size: 'm' },
      { id: 'brief', type: 'brief', size: 'm' },
      { id: 'clock', type: 'clock', size: 'm' },
      { id: 'alerts', type: 'alerts', size: 's' },
      { id: 'quick', type: 'quick', size: 's' },
    ],
  }
}

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)

function cleanSpec(spec) {
  if (!isObject(spec)) return undefined
  const items = Array.isArray(spec.items) ? spec.items.filter(item => isObject(item) && typeof item.type === 'string').slice(0, MAX_SPEC_ITEMS) : []
  const flat = { title: typeof spec.title === 'string' ? spec.title.slice(0, 200) : '', items }
  // 三档规格：views 里每个尺寸各一份；缺的档退回同一份扁平规格
  if (isObject(spec.views)) {
    const views = {}
    for (const size of ['s', 'm', 'l']) {
      const raw = spec.views[size]
      if (!isObject(raw)) continue
      const items = Array.isArray(raw.items) ? raw.items.filter(item => isObject(item) && typeof item.type === 'string').slice(0, MAX_SPEC_ITEMS) : []
      if (!items.length) continue
      views[size] = { title: typeof raw.title === 'string' ? raw.title.slice(0, 200) : '', items }
    }
    if (Object.keys(views).length) return { title: flat.title, items: flat.items, views }
  }
  if (!flat.items.length) return undefined
  return flat
}

export function specHasItems(spec) {
  if (!isObject(spec)) return false
  if (Array.isArray(spec.items) && spec.items.length) return true
  return isObject(spec.views) && Object.values(spec.views).some(view => isObject(view) && Array.isArray(view.items) && view.items.length)
}

/** 只保留合法字段，不信任外部输入。 */
export function sanitizeWorkbench(raw) {
  if (!isObject(raw)) return null
  const theme = THEMES.includes(raw.theme) ? raw.theme : 'instrument'
  const atoms = []
  const seen = new Set()
  for (const atom of (Array.isArray(raw.atoms) ? raw.atoms : []).slice(0, MAX_ATOMS)) {
    if (!isObject(atom)) continue
    if (typeof atom.id !== 'string' || seen.has(atom.id) || !/^[a-z0-9-]{1,40}$/i.test(atom.id)) continue
    if (!isKnownType(atom.type) || !SIZES[atom.size]) continue
    seen.add(atom.id)
    const entry = { id: atom.id, type: atom.type, size: atom.size }
    if (isObject(atom.config)) entry.config = atom.config
    if (atom.type === 'genui') {
      const spec = cleanSpec(atom.spec)
      if (spec) entry.spec = spec
    }
    atoms.push(entry)
  }
  if (!atoms.length) return null
  return { theme, atoms }
}

/**
 * 在给定布局上应用一批操作。
 * @param {object} current - 当前布局（theme + atoms）。
 * @param {object[]} ops - add / remove / move / resize / update / theme / replace。
 * @returns {{ layout: object, applied: string[], errors: string[] }}
 */
export function applyWorkbenchOps(current, ops, { newId } = {}) {
  const base = sanitizeWorkbench(current) ?? defaultWorkbench()
  const layout = { theme: base.theme, atoms: base.atoms.map(atom => ({ ...atom })) }
  const applied = []
  const errors = []
  const list = Array.isArray(ops) ? ops.slice(0, 40) : []

  for (const op of list) {
    if (!isObject(op) || typeof op.op !== 'string') { errors.push('操作格式不对'); continue }
    const index = typeof op.id === 'string' ? layout.atoms.findIndex(atom => atom.id === op.id) : -1

    if (op.op === 'theme') {
      if (!THEMES.includes(op.theme)) { errors.push(`未知主题：${op.theme}`); continue }
      layout.theme = op.theme
      applied.push(`主题改为 ${op.theme}`)
      continue
    }
    if (op.op === 'replace') {
      const next = sanitizeWorkbench(op.layout)
      if (!next) { errors.push('替换布局不合法'); continue }
      layout.theme = next.theme
      layout.atoms = next.atoms
      applied.push(`整体替换为 ${next.atoms.length} 个组件`)
      continue
    }
    if (op.op === 'add') {
      if (layout.atoms.length >= MAX_ATOMS) { errors.push('组件位已达上限'); continue }
      if (!isKnownType(op.type) || !SIZES[op.size]) { errors.push(`组件不合法：${op.type}/${op.size}`); continue }
      const id = typeof op.id === 'string' && op.id ? op.id : (newId ? newId('atom') : `atom-${Math.random().toString(36).slice(2, 8)}`)
      if (layout.atoms.some(atom => atom.id === id)) { errors.push(`组件 id 已存在：${id}`); continue }
      const atom = { id, type: op.type, size: op.size }
      if (isObject(op.config)) atom.config = op.config
      if (op.type === 'genui') {
        const spec = cleanSpec(op.spec)
        if (!specHasItems(spec)) { errors.push('生成式卡片缺少合法规格'); continue }
        atom.spec = spec
      }
      layout.atoms.push(atom)
      applied.push(`添加 ${op.type}（${op.size}）`)
      continue
    }
    if (index < 0) { errors.push(`找不到组件：${op.id}`); continue }
    if (op.op === 'remove') {
      layout.atoms.splice(index, 1)
      applied.push(`移除 ${op.id}`)
      continue
    }
    if (op.op === 'resize') {
      if (!SIZES[op.size]) { errors.push(`未知尺寸：${op.size}`); continue }
      layout.atoms[index].size = op.size
      applied.push(`${op.id} 改为 ${op.size}`)
      continue
    }
    if (op.op === 'move') {
      if (!Number.isInteger(op.to) || op.to < 0 || op.to >= layout.atoms.length) { errors.push('目标位置越界'); continue }
      const [item] = layout.atoms.splice(index, 1)
      layout.atoms.splice(op.to, 0, item)
      applied.push(`${op.id} 移到 ${op.to}`)
      continue
    }
    if (op.op === 'update') {
      const atom = layout.atoms[index]
      if (isObject(op.config)) atom.config = op.config
      if (op.size) {
        if (!SIZES[op.size]) { errors.push(`未知尺寸：${op.size}`); continue }
        atom.size = op.size
      }
      if (op.type === 'genui' || op.spec) {
        const spec = cleanSpec(op.spec)
        if (!specHasItems(spec)) { errors.push('生成式卡片规格不合法'); continue }
        atom.spec = spec
      }
      applied.push(`${op.id} 已更新`)
      continue
    }
    errors.push(`未知操作：${op.op}`)
  }

  // 有任意一条错，整批回滚到提交前的布局（调用方据此拒绝写入）。
  if (errors.length) return { layout: base, applied, errors }
  const cleaned = sanitizeWorkbench(layout)
  return { layout: cleaned ?? base, applied, errors }
}

/** 文件存储：串行写、revision 单调递增、requestId 幂等。 */
export class WorkbenchStore {
  constructor(home = join(homedir(), '.dsh', 'work-desk')) {
    this.dir = home
    this.file = join(home, 'workbench.json')
    this.queue = Promise.resolve()
    this.data = null
    this.mtimeMs = null
    this.seen = new Map()
  }

  async refresh() {
    await mkdir(this.dir, { recursive: true })
    let info = null
    try { info = await stat(this.file) } catch (err) { if (err.code !== 'ENOENT') throw err }
    if (!info) {
      this.data = { revision: 1, theme: defaultWorkbench().theme, atoms: defaultWorkbench().atoms, history: [] }
      await this.persist()
      return
    }
    if (this.data && info.mtimeMs === this.mtimeMs) return
    const raw = JSON.parse(await readFile(this.file, 'utf8').catch(() => '{}'))
    const layout = sanitizeWorkbench(raw) ?? defaultWorkbench()
    this.data = { revision: Number(raw.revision) || 1, theme: layout.theme, atoms: layout.atoms, history: Array.isArray(raw.history) ? raw.history.slice(-20) : [] }
    this.mtimeMs = info.mtimeMs
  }

  async persist() {
    const tmp = `${this.file}.${process.pid}.tmp`
    await writeFile(tmp, JSON.stringify(this.data))
    await rename(tmp, this.file)
    this.mtimeMs = (await stat(this.file)).mtimeMs
  }

  run(task) {
    const next = this.queue.then(task, task)
    this.queue = next.catch(() => {})
    return next
  }

  read() {
    return this.run(async () => {
      await this.refresh()
      return { revision: this.data.revision, theme: this.data.theme, atoms: this.data.atoms }
    })
  }

  /**
   * 提交一批操作。baseRevision 不匹配则拒绝（不静默覆盖）；
   * 同一个 requestId 重复提交返回上次结果。
   */
  apply(payload = {}) {
    return this.run(async () => {
      await this.refresh()
      const requestId = typeof payload.requestId === 'string' ? payload.requestId.slice(0, 64) : ''
      if (requestId && this.seen.has(requestId)) {
        return { ...this.seen.get(requestId), replayed: true }
      }
      if (payload.baseRevision !== undefined && Number(payload.baseRevision) !== this.data.revision) {
        return { ok: false, conflict: true, revision: this.data.revision, error: `布局已更新（当前 revision ${this.data.revision}），请重新读取后再提交` }
      }
      const result = applyWorkbenchOps({ theme: this.data.theme, atoms: this.data.atoms }, payload.ops, { newId })
      if (result.errors.length) {
        return { ok: false, errors: result.errors, applied: result.applied, revision: this.data.revision, layout: { theme: this.data.theme, atoms: this.data.atoms } }
      }
      this.data.theme = result.layout.theme
      this.data.atoms = result.layout.atoms
      this.data.revision += 1
      this.data.history = [...(this.data.history ?? []), { at: new Date().toISOString(), applied: result.applied, source: payload.source ?? 'ui' }].slice(-20)
      await this.persist()
      const answer = { ok: true, revision: this.data.revision, applied: result.applied, layout: { theme: this.data.theme, atoms: this.data.atoms } }
      if (requestId) this.seen.set(requestId, answer)
      return answer
    })
  }
}

function newId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}
