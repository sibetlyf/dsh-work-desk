// 首次打开时的示例数据：几个会、几封邮件、自选和持仓。
// 全部带 sample 标记，右上角「示例数据 · 清空」一键清掉，不会和真实数据混在一起。
import { addDays, startOfDay } from './calendar.js'

function at(base, offsetDays, time, minutes = 30) {
  const [h, m] = time.split(':').map(Number)
  const start = addDays(startOfDay(base), offsetDays)
  start.setHours(h, m, 0, 0)
  const end = new Date(start.getTime() + minutes * 60000)
  return { start: start.toISOString(), end: end.toISOString() }
}

function mail(base, hoursAgo, row) {
  const date = new Date(base.getTime() - hoursAgo * 3600000)
  return {
    id: `demo:INBOX:${row.uid}`,
    uid: row.uid,
    folder: 'INBOX',
    account: 'demo@company.com',
    from: { name: row.from, address: row.address },
    to: [{ name: '', address: 'demo@company.com' }],
    subject: row.subject,
    snippet: row.snippet,
    body: row.body ?? row.snippet,
    date: date.toISOString(),
    unread: Boolean(row.unread),
    starred: Boolean(row.starred),
    hasAttachments: Boolean(row.attachments),
    attachments: row.attachments ? [{ filename: row.attachments, contentType: 'application/pdf', size: 248_000 }] : [],
    messageId: `<demo-${row.uid}@company.com>`,
    inReplyTo: '',
    sample: true,
    fetchedAt: date.toISOString(),
  }
}

export function buildSeed(now = new Date()) {
  const events = [
    {
      id: 'e_demo_1', title: '产品周会', ...at(now, 0, '10:00', 60), location: '3 楼·大会议室',
      notes: '上周遗留：发布窗口、灰度名单。', attendees: ['李雷', '韩梅梅'], color: 'blue',
      source: 'manual', status: 'confirmed', sample: true, createdAt: now.toISOString(),
    },
    {
      id: 'e_demo_2', title: '和设计对一下改版稿', ...at(now, 0, '14:00', 45), location: '线上 · 腾讯会议',
      notes: '', attendees: ['周舟'], color: 'violet', source: 'manual', status: 'confirmed', sample: true,
      createdAt: now.toISOString(),
    },
    {
      id: 'e_demo_3', title: '季度复盘（先看数据）', ...at(now, 1, '09:30', 90), location: '2 楼·小会议室',
      notes: '带上前三个月的转化率。', attendees: ['王强', '李雷'], color: 'amber', source: 'manual',
      status: 'confirmed', sample: true, createdAt: now.toISOString(),
    },
    {
      id: 'e_demo_4', title: '一对一', ...at(now, 2, '16:00', 30), location: '', notes: '',
      attendees: ['韩梅梅'], color: 'green', source: 'manual', status: 'confirmed', sample: true,
      createdAt: now.toISOString(),
    },
  ]

  const events2 = [
    {
      id: 'e_demo_5', title: '客户demo 彩排', ...at(now, 3, '11:00', 60), location: '线上',
      notes: '周五正式演示，先走一遍流程。', attendees: ['王强'], color: 'rose', source: 'ical',
      status: 'tentative', sample: true, createdAt: now.toISOString(),
    },
  ]

  const tasks = [
    { id: 't_demo_1', title: '把周会纪要发到群里', due: at(now, 0, '18:00', 0).start, done: false, priority: 1, tags: ['会议'], sample: true, createdAt: now.toISOString() },
    { id: 't_demo_2', title: '确认灰度名单（50 人）', due: at(now, 1, '12:00', 0).start, done: false, priority: 2, tags: ['发布'], sample: true, createdAt: now.toISOString() },
    { id: 't_demo_3', title: '回周舟的改版意见', due: at(now, 0, '20:00', 0).start, done: false, priority: 0, tags: ['邮件'], sample: true, createdAt: now.toISOString() },
    { id: 't_demo_4', title: '整理 Q3 数据', due: at(now, -1, '18:00', 0).start, done: true, priority: 1, tags: ['复盘'], sample: true, createdAt: now.toISOString() },
  ]

  const mails = [
    mail(now, 1.5, {
      uid: 101, from: '王强', address: 'wangqiang@company.com', unread: true, starred: true,
      subject: 'Re: 发布窗口确认一下',
      snippet: '周三晚上可以，但灰度名单要在周二下班前给我，不然赶不上审核。另外这次要不要同步发公告？',
      body: '李雷，\n\n周三晚上可以，但灰度名单要在周二下班前给我，不然赶不上审核。\n\n另外这次要不要同步发公告？如果要，文案我来写，周四之前给你。\n\n王强',
      attachments: '灰度方案-v3.pdf',
    }),
    mail(now, 3, {
      uid: 102, from: '周舟', address: 'zhouzhou@company.com', unread: true,
      subject: '改版稿第三版，重点看首页',
      snippet: '首页我压掉了一屏，把入口收到右上角。你看看会不会太难找，尤其是新用户。',
      body: '李雷，\n\n首页我压掉了一屏，把入口收到右上角。你看看会不会太难找，尤其是新用户。\n\n另外列表的间距我从 12 调到 16，你觉得会不会太松。\n\n周舟',
    }),
    mail(now, 6, {
      uid: 103, from: '财务共享中心', address: 'noreply@finance.company.com', unread: false,
      subject: '10 月报销单已通过（流水号 A10293）',
      snippet: '你提交的 10 月差旅报销（¥2,480.00）已审批通过，预计 3 个工作日到账。',
      body: '你提交的 10 月差旅报销（¥2,480.00）已审批通过，预计 3 个工作日到账。\n\n本邮件由系统发出，请勿直接回复。',
    }),
    mail(now, 22, {
      uid: 104, from: '韩梅梅', address: 'hanmeimei@company.com', unread: false,
      subject: '下周的培训，你来讲一节？',
      snippet: '想请你讲一节「怎么把需求讲清楚」，40 分钟就行，周三下午。你方便吗？',
      body: '李雷，\n\n想请你讲一节「怎么把需求讲清楚」，40 分钟就行，周三下午。你方便吗？\n\n不用准备太多，讲你自己踩过的坑反而更好。\n\n韩梅梅',
    }),
    mail(now, 30, {
      uid: 105, from: '李雷', address: 'demo@company.com', unread: false,
      subject: 'Re: 季度目标对齐',
      snippet: '我把三个指标重新排了优先级，转化率放第一，具体数字明天会上说。',
      body: '我把三个指标重新排了优先级，转化率放第一，具体数字明天会上说。\n\n---\n原邮件：季度目标对齐',
      sent: true,
    }),
    mail(now, 48, {
      uid: 106, from: '行业日报', address: 'digest@newsletter.example', unread: false,
      subject: '今天你可能错过的 5 条行业消息',
      snippet: '1. 某厂商发布新一代边缘推理芯片；2. 开源社区合并了两个推理框架……',
      body: '1. 某厂商发布新一代边缘推理芯片\n2. 开源社区合并了两个推理框架\n3. 监管发布新规征求意见稿\n4. 两家公司宣布合并\n5. 一份关于远程办公的调查',
    }),
  ]

  return {
    version: 1,
    createdAt: now.toISOString(),
    events: [...events, ...events2],
    tasks,
    mails,
    drafts: [],
    watchlist: [
      { code: 'sh000001', name: '上证指数', sample: true },
      { code: 'sh600519', name: '贵州茅台', sample: true },
      { code: 'sz000001', name: '平安银行', sample: true },
      { code: 'hk00700', name: '腾讯控股', sample: true },
      { code: 'usAAPL', name: '苹果', sample: true },
    ],
    positions: [
      { id: 'p_demo_1', code: 'sh600519', name: '贵州茅台', shares: 100, cost: 1380, sample: true },
      { id: 'p_demo_2', code: 'sz000001', name: '平安银行', shares: 2000, cost: 11.2, sample: true },
    ],
    alerts: [],
    brief: null,
    briefs: [],
    chat: [],
    sampleCleared: false,
  }
}

/** 老版本状态补齐字段，避免读到半份数据就崩。 */
export function migrateState(state) {
  const next = { ...state }
  next.version = 1
  for (const key of ['events', 'tasks', 'mails', 'drafts', 'watchlist', 'positions', 'alerts', 'briefs', 'chat']) {
    if (!Array.isArray(next[key])) next[key] = []
  }
  if (!next.createdAt) next.createdAt = new Date().toISOString()
  return next
}

export function isSample(state) {
  return state.mails.some(row => row.sample) || state.events.some(row => row.sample) || state.watchlist.some(row => row.sample)
}
