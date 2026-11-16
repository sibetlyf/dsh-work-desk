// 工作台的布局模型：8 列，小 1×1 / 中 2×1 / 大 4×3（横向×纵向）。
// 这一版布局存在当前浏览器的 localStorage；换成 Host 权威存储是后续步骤，界面上已如实标注。

export const COLUMNS = 8

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
}

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
    if (atom.type === 'genui' && atom.spec && typeof atom.spec === 'object') entry.spec = atom.spec
    next.push(entry)
  }
  if (!next.length) return null
  return { theme, atoms: next }
}

/** 占用格数（用于“还剩多少格”一类提示）。 */
export function cellCount(atoms) {
  return atoms.reduce((sum, atom) => sum + SIZES[atom.size].w * SIZES[atom.size].h, 0)
}

/**
 * 确定性网格放置：按顺序找第一个能放下的空位，返回每个组件的行/列与总行数。
 * 不用 CSS 的 dense 回填，保证视觉顺序、键盘顺序一致，拖动时也能预演目标格子。
 */
export function planLayout(atoms) {
  const occupied = []
  const placed = []
  let rows = 0
  const free = (row, col, w, h) => {
    for (let r = row; r < row + h; r++) {
      for (let c = col; c < col + w; c++) {
        if (c >= COLUMNS) return false
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
    const { w, h } = SIZES[atom.size] ?? SIZES.m
    let row = 0
    let col = 0
    let found = false
    for (row = 0; !found; row++) {
      for (col = 0; col + w <= COLUMNS; col++) {
        if (free(row, col, w, h)) { found = true; break }
      }
    }
    row -= 1
    occupy(row, col, w, h)
    rows = Math.max(rows, row + h)
    placed.push({ id: atom.id, row, col, w, h })
  }
  return { placed, rows: Math.max(rows, 1) }
}

export { newId }
