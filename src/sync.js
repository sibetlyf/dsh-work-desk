// 后台节奏：行情按设置轮询，邮件按设置同步。都只在配置齐了才启动。
// 所有写操作仍然经过 store.mutate，不在这里直接改内存状态。

/** 报价对象里我们要看的字段，统一成一个结构给告警用。 */
export function quoteRows(state, quotes) {
  return state.watchlist.map(row => ({ ...row, quote: quotes[row.code] ?? null }))
}

/**
 * 计算提醒：股价阈值、今天到期的待办、两小时内开始的会。
 * 纯函数，不写状态 —— 每次 /state 现算，所以读一次就消失的提醒不会留在数据库里。
 * @param {object} state - 工作台状态。
 * @param {object} quotes - symbol → 行情。
 * @param {Date} now - 现在。
 * @returns {{kind: string, level: string, text: string, target: string}[]} 提醒列表。
 */
export function evaluateAlerts(state, quotes, now = new Date()) {
  const out = []
  for (const alert of state.alerts ?? []) {
    if (alert.enabled === false) continue
    if (alert.kind === 'price' && alert.code) {
      const quote = quotes[alert.code]
      if (!quote || quote.changePct === null) continue
      const threshold = Number(alert.threshold) || 3
      const hit = alert.direction === 'down' ? quote.changePct <= -threshold : quote.changePct >= threshold
      if (hit) {
        out.push({
          kind: 'price',
          level: alert.direction === 'down' ? 'down' : 'up',
          text: `${quote.name} ${quote.changePct >= 0 ? '+' : ''}${quote.changePct.toFixed(2)}%，超过 ${threshold}% 阈值`,
          target: alert.code,
        })
      }
    }
  }
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const endOfToday = new Date(startOfToday.getTime() + 86400000)
  for (const task of state.tasks ?? []) {
    if (task.done || !task.due) continue
    const due = new Date(task.due)
    if (due < startOfToday || due >= endOfToday) continue
    out.push({ kind: 'task', level: due < now ? 'overdue' : 'due', text: `今天要交：${task.title}`, target: task.id })
  }
  for (const event of state.events ?? []) {
    if (event.status === 'cancelled') continue
    const start = new Date(event.start)
    const diff = start - now
    if (diff > 0 && diff <= 2 * 3600000) out.push({ kind: 'event', level: 'soon', text: `${Math.round(diff / 60000)} 分钟后：${event.title}`, target: event.id })
  }
  return out.slice(0, 12)
}

/**
 * 起两个定时器。返回 stop()，Host 卸载时调用。
 * @param {{store: object, settings: object, board: object, syncMail: Function, onError?: Function}} deps - 依赖。
 */
export function createScheduler({ store, settings, board, syncMail, onError = () => {} }) {
  let quoteTimer = null
  let mailTimer = null
  let stopped = false
  let syncing = false
  let lastSyncAt = null
  let lastSyncError = null

  const codes = async () => {
    const state = await store.read()
    return [...new Set([...(state.watchlist ?? []).map(row => row.code), ...(state.positions ?? []).map(row => row.code)].filter(Boolean))]
  }

  const tickQuotes = async () => {
    if (stopped) return
    const current = await settings.read()
    if (!current.quotes.enabled) return
    const list = await codes()
    if (!list.length) return
    await board.refresh(list)
  }

  const tickMail = async () => {
    if (stopped || syncing) return
    const current = await settings.read()
    if (current.mail.provider !== 'imap' || !current.mail.imap.host) return
    syncing = true
    try {
      const result = await syncMail()
      lastSyncAt = new Date().toISOString()
      lastSyncError = result?.error ?? null
    } catch (err) {
      lastSyncError = err.message
      onError(err)
    } finally {
      syncing = false
    }
  }

  const start = async () => {
    const current = await settings.read()
    stop()
    stopped = false
    quoteTimer = setInterval(() => { tickQuotes().catch(onError) }, Math.max(3, current.quotes?.intervalSec ?? 8) * 1000)
    mailTimer = setInterval(() => { tickMail().catch(onError) }, Math.max(30, current.mail?.syncSec ?? 180) * 1000)
    quoteTimer.unref?.()
    mailTimer.unref?.()
    tickQuotes().catch(onError)
    return status()
  }

  const stop = () => {
    stopped = true
    if (quoteTimer) clearInterval(quoteTimer)
    if (mailTimer) clearInterval(mailTimer)
    quoteTimer = null
    mailTimer = null
  }

  const status = () => ({ running: Boolean(quoteTimer), lastSyncAt, lastSyncError, syncing })

  return { start, stop, status, tickQuotes, tickMail }
}
