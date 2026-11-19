// 工作台的布局模型：8 列，小 1×1 / 中 2×1 / 大 4×3（横向×纵向）。
// 布局由 Host 权威存储（src/workbench.js）；这里只负责模型、放置与校验，Host 不在线时才退回本机浏览器。

export const COLUMNS = 8

/** 响应式列数：容器 <880px 4 列，<560px 2 列（与 theme.css 的容器查询阈值一致）。 */
export function columnsFor(width) {
  const w = Number(width)
  if (!Number.isFinite(w) || w <= 0) return COLUMNS
  if (w <= 560) return 2
  if (w <= 880) return 4
  return 8
}

export const SIZES = {
  s: { w: 1, h: 1, label: '小' },
  m: { w: 2, h: 1, label: '中' },
  l: { w: 4, h: 3, label: '大' },
}

export const ATOMS = {
  calendar: { label: '日历', hint: '日期、下一场、当日议程' },
  next: { label: '下一件事', hint: '时间、标题、接下来的安排' },
  tasks: { label: '待办', hint: '计数、两条预览、完整清单' },
  mail: { label: '邮件', hint: '未查看数、最近两封、列表' },
  quotes: { label: '行情', hint: '单只、两只、自选表' },
  brief: { label: '今天先做什么', hint: '一句、摘要、全文' },
  clock: { label: '时钟', hint: '时间、日期、今天已过多少' },
  alerts: { label: '提醒', hint: '条数、前两条、全部' },
  quick: { label: '快捷入口', hint: '今日、日程、邮件、行情' },
  meeting: { label: '会议助手', hint: '是否在听、采集、触发与播报计数（来自会议助手插件）' },
  image: { label: '图片', hint: '缩略、缩略加说明、大图与来源' },
}

/** 组件可以声明订阅的数据源；Host 与客户端共用这份名字表。 */
export const SOURCE_NAMES = ['desk', 'quotes', 'meeting']

export const MAX_ATOMS = 24

const KEY = 'wd-fw-layout-v1'

function newId(prefix = 'fw') {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${Date.now().toString(36)}-${rand}`
}

/** 默认布局：覆盖三种尺寸，并保证桌面一屏能摆下十个以上组件位。 */
export function defaultLayout() {
  return {
    theme: 'instrument',
    atoms: [
      { id: 'fw-cal', type: 'calendar', size: 'l' },
      { id: 'fw-next', type: 'next', size: 'm' },
      { id: 'fw-tasks', type: 'tasks', size: 'm' },
      { id: 'fw-mail', type: 'mail', size: 'm' },
      { id: 'fw-quotes', type: 'quotes', size: 'm' },
      { id: 'fw-brief', type: 'brief', size: 'm' },
      { id: 'fw-clock', type: 'clock', size: 'm' },
      { id: 'fw-alerts', type: 'alerts', size: 's' },
      { id: 'fw-quick', type: 'quick', size: 's' },
    ],
  }
}

const FW_TYPE = /^fw:[a-z0-9-]{1,32}$/
const BUILTIN = new Set(Object.keys(ATOMS))
const THEMES = ['instrument', 'paper', 'type']

/** 生成式卡片白名单节点；Host 与客户端共用同一份（见 src/workbench.js）。 */
export const GENUI_TYPES = ['text', 'stat', 'badge', 'progress', 'list', 'keyvalue', 'steps', 'callout', 'chart', 'divider']
export const GENUI_NODE_TYPES = new Set(GENUI_TYPES)
export const MAX_SPEC_DEPTH = 6
const MAX_SPEC_WALK = 4096

/** 规格结构深度与节点数上限：挡住深层嵌套数组和超大对象，避免渲染/存储被拖垮。 */
export function specDepthOk(value) {
  let budget = MAX_SPEC_WALK
  const walk = (node, depth) => {
    if (!node || typeof node !== 'object') return true
    if (depth > MAX_SPEC_DEPTH) return false
    if ((budget -= 1) < 0) return false
    if (Array.isArray(node)) return node.every(item => walk(item, depth + 1))
    return Object.values(node).every(item => walk(item, depth + 1))
  }
  return walk(value, 0)
}

function specHasNode(view) {
  return (Array.isArray(view?.items) ? view.items : []).some(node => node && typeof node === 'object' && typeof node.type === 'string' && GENUI_NODE_TYPES.has(node.type))
}

/** 能否渲染：至少一个白名单节点，结构不超深，节点数不超限。 */
export function genuiSpecUsable(spec) {
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) return false
  if (!specDepthOk(spec)) return false
  if (specHasNode(spec)) return true
  if (spec.views && typeof spec.views === 'object' && !Array.isArray(spec.views)) {
    return ['s', 'm', 'l'].some(size => specHasNode(spec.views[size]))
  }
  return false
}

/** 哪些类型算合法组件：内置九种、FullWidget 原生组件、生成式卡片。 */
export function isKnownType(type) {
  return typeof type === 'string' && (BUILTIN.has(type) || type === 'genui' || FW_TYPE.test(type))
}

/** 读回布局；任何不合法的字段都退回默认，不信任 localStorage 内容。 */
export function loadLayout() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null')
    return sanitize(raw) ?? defaultLayout()
  } catch {
    return defaultLayout()
  }
}

export function saveLayout(layout) {
  try {
    localStorage.setItem(KEY, JSON.stringify(layout))
    return true
  } catch {
    return false
  }
}

export function sanitize(raw) {
  if (!raw || typeof raw !== 'object') return null
  const theme = THEMES.includes(raw.theme) ? raw.theme : 'instrument'
  const atoms = Array.isArray(raw.atoms) ? raw.atoms : []
  const seen = new Set()
  const next = []
  for (const atom of atoms.slice(0, MAX_ATOMS)) {
    if (!atom || typeof atom !== 'object') continue
    if (typeof atom.id !== 'string' || seen.has(atom.id)) continue
    if (!isKnownType(atom.type)) continue
    if (!SIZES[atom.size]) continue
    seen.add(atom.id)
    const entry = { id: atom.id, type: atom.type, size: atom.size }
    if (atom.config && typeof atom.config === 'object' && !Array.isArray(atom.config)) entry.config = atom.config
    if (atom.type === 'genui' && atom.spec && typeof atom.spec === 'object' && genuiSpecUsable(atom.spec)) entry.spec = atom.spec
    // 组件声明的数据源：只保留已知名字，重复的去掉
    if (Array.isArray(atom.sources)) {
      const sources = [...new Set(atom.sources.filter(name => SOURCE_NAMES.includes(name)))].slice(0, 3)
      if (sources.length) entry.sources = sources
    }
    next.push(entry)
  }
  if (!next.length) return null
  return { theme, atoms: next }
}

/** 占用格数（用于“还剩多少格”一类提示）。 */
export function cellCount(atoms) {
  return atoms.reduce((sum, atom) => {
    const size = SIZES[atom.size] ?? SIZES.m
    return sum + size.w * size.h
  }, 0)
}

/**
 * 确定性网格放置：按顺序找第一个能放下的空位，返回每个组件的行/列与总行数。
 * 不用 CSS 的 dense 回填，保证视觉顺序、键盘顺序一致，拖动时也能预演目标格子。
 * columns 是当前容器实际的列数：小屏 4/2 列时按列数截断宽度，避免生成隐式列。
 */
export function planLayout(atoms, columns = COLUMNS) {
  const cols = Math.max(1, Math.min(COLUMNS, Number(columns) || COLUMNS))
  const occupied = []
  const placed = []
  let rows = 0
  const free = (row, col, w, h) => {
    for (let r = row; r < row + h; r++) {
      for (let c = col; c < col + w; c++) {
        if (c >= cols) return false
        if (occupied[r]?.[c]) return false
      }
    }
    return true
  }
  const occupy = (row, col, w, h) => {
    for (let r = row; r < row + h; r++) {
      const line = (occupied[r] ??= [])
      for (let c = col; c < col + w; c++) line[c] = true
    }
  }
  for (const atom of atoms) {
    const size = SIZES[atom.size] ?? SIZES.m
    const w = Math.min(size.w, cols)
    const h = size.h
    let row = 0
    let col = 0
    let found = false
    for (row = 0; !found; row++) {
      for (col = 0; col + w <= cols; col++) {
        if (free(row, col, w, h)) { found = true; break }
      }
    }
    row -= 1
    occupy(row, col, w, h)
    rows = Math.max(rows, row + h)
    placed.push({ id: atom.id, row, col, w, h })
  }
  return { placed, rows: Math.max(rows, 1), columns: cols }
}

export { newId }
