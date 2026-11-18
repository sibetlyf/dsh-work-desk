// 生成式卡片的「空间语法」：参考 dsh-widgets 的六条原则做成可计算规则。
// 一个组件只回答一个问题；主读数唯一且最大；三层结构（标题 / 说明 / 内容）；信息量随尺寸收敛。
// 生成流程用它给规格打分，fail 的规格不允许加入工作台。

export const UNITS = { s: 120, m: 200, l: 360 } // 参考单元宽度，用于 scale = unit / 150
export const SCALE_BASE = 150

const BUDGET = { s: 2, m: 4, l: 7 }
const PRIMARY = new Set(['stat', 'progress'])
const LEAD_OK = new Set(['stat', 'progress', 'chart', 'badge'])
const CAPTIONS = new Set(['callout'])
const HEAVY = new Set(['chart', 'steps', 'list'])

/** 尺寸对应的字号档位：主读数 20 / 说明 10，按 unit/150 缩放。 */
export function typeScale(size) {
  const scale = (UNITS[size] ?? UNITS.m) / SCALE_BASE
  return {
    title: Math.round(13 * scale),
    primary: Math.round(20 * scale),
    caption: Math.round(10 * scale),
  }
}

const pass = (id, label) => ({ id, label, status: 'pass', weight: 1 })
const warn = (id, label, reason) => ({ id, label, status: 'warn', weight: 0.6, reason })
const fail = (id, label, reason) => ({ id, label, status: 'fail', weight: 0, reason })

/**
 * 对一份规格按空间语法打分。
 * @param {object} view - 已解析占位符、准备渲染的 {title, items}。
 * @param {'s'|'m'|'l'} size - 当前尺寸。
 * @returns {{score: number, results: object[], issues: string[], blocked: boolean}}
 */
export function auditView(view, size = 'm') {
  const items = Array.isArray(view?.items) ? view.items.filter(item => item && typeof item.type === 'string') : []
  const results = []

  // 01 一个组件只回答一个问题：主读数必须恰好一个
  const primaries = items.filter(item => PRIMARY.has(item.type))
  if (primaries.length === 1) results.push(pass('primary', '主读数唯一'))
  else if (primaries.length === 0) results.push(warn('primary', '缺少主读数', '至少给一个 stat 或 progress，读者才知道先看什么'))
  else results.push(fail('primary', '主读数不唯一', `有 ${primaries.length} 个主读数在抢注意力，只留最大的那一个`))

  // 02 领衔：第一块要能当主读数，而不是一上来堆清单
  const lead = items[0]
  if (!lead) results.push(fail('lead', '内容为空', '至少有一个内容块'))
  else if (LEAD_OK.has(lead.type)) results.push(pass('lead', '主读数领衔'))
  else results.push(warn('lead', '开场不是主读数', `第一块是 ${lead.type}，把它移到主读数之后`))

  // 03 信息预算：尺寸越小越收敛
  const budget = BUDGET[size] ?? BUDGET.m
  if (items.length <= budget) results.push(pass('density', `信息量在 ${size} 档预算内`))
  else results.push(fail('density', '信息量超预算', `${size} 档最多 ${budget} 块，现在 ${items.length} 块`))

  // 04 三层结构：说明行最多一条，且紧贴标题
  const captions = items.filter(item => CAPTIONS.has(item.type)).length
  if (captions <= 1) results.push(pass('caption', '说明行不超过一条'))
  else results.push(warn('caption', '说明行过多', 'callout 最多一条，其余说明并进正文'))

  // 05 小尺寸不做大图表：图要在中/大档
  if (size === 's' && items.some(item => HEAVY.has(item.type))) results.push(fail('weight', '小卡放了重内容', '小档只留一个判断，图表/长清单放到中或大'))
  else results.push(pass('weight', '内容重量与尺寸匹配'))

  // 06 动作不抢戏：小档不出现 steps 这类操作引导
  if (size === 's' && items.some(item => item.type === 'steps')) results.push(fail('action', '小卡出现操作引导', 'steps 只在中等以上尺寸出现'))
  else if (items.filter(item => item.type === 'steps').length > 1) results.push(warn('action', '操作引导重复', 'steps 最多一处'))
  else results.push(pass('action', '动作不抢戏'))

  // 07 标题可读：一眼能读完
  const title = typeof view?.title === 'string' ? view.title : ''
  if (title.length <= 18) results.push(pass('title', '标题一眼读完'))
  else results.push(warn('title', '标题过长', '压到 18 字以内，细节放正文'))

  const counted = results.filter(result => result.status !== 'n/a')
  const score = counted.length ? Math.round(100 * counted.reduce((sum, result) => sum + result.weight, 0) / counted.length) : 0
  const issues = counted.filter(result => result.status !== 'pass').map(result => `${result.label}：${result.reason ?? ''}`)
  return { score, results: counted, issues, blocked: counted.some(result => result.status === 'fail') }
}

/** 给模型看的同一套规则：生成时就按它写，而不是先生成再挑错。 */
export const GRAMMAR_BRIEF = [
  '一个卡片只回答一个问题；主读数只能有一个（stat 或 progress），其余都是映衬。',
  '三层结构：标题 → 可选一条说明 → 内容块；不要堆清单，明细退到说明字号。',
  '信息预算：小卡最多 2 块、中卡 4 块、大卡 7 块；小卡不放图表、清单、steps。',
  '标题压到 18 字以内；说明行（callout）最多一条。',
].join('\n')
