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

const THEMES = ['instrument', 'paper', 'type']

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
    if (!ATOMS[atom.type]) continue
    if (!SIZES[atom.size]) continue
    seen.add(atom.id)
    next.push({ id: atom.id, type: atom.type, size: atom.size })
  }
  if (!next.length) return null
  return { theme, atoms: next }
}

/** 占用的格数（用于“还剩多少格”一类提示）。 */
export function cellCount(atoms) {
  return atoms.reduce((sum, atom) => sum + SIZES[atom.size].w * SIZES[atom.size].h, 0)
}

export { newId }
