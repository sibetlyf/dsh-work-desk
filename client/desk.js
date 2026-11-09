// 浏览器侧状态：Host 状态的一份镜像，加上只属于界面的视图、选中和弹层。
// 所有写操作都走 dispatchOps → Host 的唯一写入口，返回整份新状态。
import React from 'react'

const BASE = 'work-desk/'

let snapshot = {
  ready: false, error: null,
  state: null, quotes: {}, quoteError: null, quotesAt: null, alerts: [], brief: null,
  canUndo: false, model: null, modelOk: null, modelError: null, mail: {},
  view: 'today', focusMailId: null, focusEventId: null,
  dockOpen: true, thinking: false, toast: null, dialog: null,
  settingsOpen: false, settings: null,
  mailFilter: 'all', mailQuery: '', composer: null, confirmSend: false, sending: false,
  selectedDay: null, monthCursor: null, calendarMode: 'week',
  minute: null, minuteCode: null, minuteError: null, tick: 0,
}

const listeners = new Set()

export function getDesk() {
  return snapshot
}

export function setDesk(patch) {
  snapshot = { ...snapshot, ...(typeof patch === 'function' ? patch(snapshot) : patch) }
  listeners.forEach(fn => fn())
}

function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useDesk(selector) {
  return React.useSyncExternalStore(subscribe, () => selector(snapshot))
}

async function request(path, body) {
  const res = await fetch(BASE + path, body === undefined ? { headers: { 'cache-control': 'no-cache' } } : {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `请求失败（${res.status}）`)
  return data
}

let toastTimer = null
export function toast(text, { undo = false, error = false } = {}) {
  clearTimeout(toastTimer)
  if (!text) return
  setDesk({ toast: { text, undo, error, key: Date.now() } })
  toastTimer = setTimeout(() => setDesk({ toast: null }), undo || String(text).length > 24 ? 6000 : 3200)
}

export function report(err) {
  toast(err?.message || String(err), { error: true })
}

export async function loadDesk() {
  try {
    const data = await request('state')
    setDesk({
      ready: true,
      error: null,
      state: data.state,
      quotes: data.quotes ?? {},
      quoteError: data.quoteError ?? null,
      quotesAt: data.quotesAt ?? null,
      alerts: data.alerts ?? [],
      brief: data.brief ?? null,
      canUndo: data.canUndo,
      model: data.model,
      modelOk: data.modelOk,
      modelError: data.modelError,
      mail: data.mail ?? {},
    })
    const settings = await request('settings').catch(() => null)
    if (settings) setDesk({ settings })
  } catch (err) {
    setDesk({ ready: false, error: err.message })
  }
}

export async function dispatchOps(ops, { label = '操作', undoable = true, silent = false } = {}) {
  try {
    const data = await request('ops', { ops, label, undoable })
    setDesk(s => ({ state: data.state, canUndo: undoable || s.canUndo, quotes: s.quotes }))
    if (data.errors?.length) toast(data.errors[0], { error: true })
    else if (!silent && data.receipts?.[0]) toast(data.receipts[0].text, { undo: undoable })
    return data
  } catch (err) {
    report(err)
    return null
  }
}

export async function undo() {
  try {
    const data = await request('undo', {})
    setDesk({ state: data.state, canUndo: data.canUndo, toast: null })
    if (data.label) toast(`已撤销：${data.label}`)
  } catch (err) {
    report(err)
  }
}

/** 后台每 30 秒重拉一次状态（提醒、日程都在变），界面上的「现在」每 30 秒走一次。 */
export function startTicker() {
  const timer = setInterval(() => {
    setDesk(s => ({ tick: s.tick + 1 }))
  }, 30_000)
  return () => clearInterval(timer)
}

/* ------------------------------- 行情 ------------------------------- */

export async function refreshQuotes(force = false) {
  try {
    const data = await request(`quotes?force=${force ? 1 : 0}`)
    setDesk({ quotes: data.quotes ?? {}, quoteError: data.error ?? null, quotesAt: data.fetchedAt ?? null })
    return data
  } catch (err) {
    setDesk({ quoteError: err.message })
    return null
  }
}

export async function loadMinute(code) {
  setDesk({ minuteCode: code, minuteError: null })
  try {
    const data = await request(`quote/minute?code=${encodeURIComponent(code)}`)
    setDesk({ minute: data })
    return data
  } catch (err) {
    setDesk({ minute: null, minuteError: err.message })
    return null
  }
}

/* ------------------------------- 邮件 ------------------------------- */

export async function syncMail() {
  try {
    const data = await request('mail/sync', {})
    if (data.error) {
      toast(data.error, { error: true })
      setDesk({ mail: { ...snapshot.mail, lastSyncError: data.error } })
      return null
    }
    setDesk({ state: data.state, mail: { ...snapshot.mail, lastSyncAt: new Date().toISOString(), lastSyncError: null } })
    toast(data.added ? `同步到 ${data.added} 封新邮件` : '没有新邮件')
    return data
  } catch (err) {
    report(err)
    return null
  }
}

export async function openMail(id) {
  setDesk({ view: 'mail', focusMailId: id, dockOpen: false })
  try {
    const data = await request('mail/read', { id })
    setDesk({ state: data.state, focusMailId: data.mail?.id ?? id })
    return data.mail
  } catch (err) {
    report(err)
    return null
  }
}

export async function markMail(id, action) {
  try {
    const data = await request('mail/mark', { id, action })
    setDesk({ state: data.state })
    if (data.warning) toast(data.warning, { error: true })
    return data
  } catch (err) {
    report(err)
    return null
  }
}

export function openComposer(draft) {
  setDesk({ composer: { to: '', cc: '', subject: '', text: '', ...draft }, confirmSend: false, sending: false })
}

export function closeComposer() {
  setDesk({ composer: null, confirmSend: false, sending: false })
}

export async function sendComposer() {
  const draft = snapshot.composer
  if (!draft) return false
  const plugin = (snapshot.settings?.mail?.provider ?? snapshot.mail?.provider) === 'dsh-email'
  setDesk({ sending: true })
  try {
    const data = await request(plugin ? 'mail/draft' : 'mail/send', draft)
    if (data.error) {
      toast(data.error, { error: true })
      setDesk({ sending: false })
      return false
    }
    setDesk({ composer: null, confirmSend: false, sending: false })
    if (plugin) toast('草稿已存到 DSH 邮件插件，到 设置 → 邮件 → 草稿 里确认发送')
    else toast('邮件发出去了')
    return true
  } catch (err) {
    report(err)
    setDesk({ sending: false })
    return false
  }
}

/* ------------------------------- 晨报 ------------------------------- */

export async function generateBrief() {
  try {
    const data = await request('brief/generate', {})
    setDesk({ brief: data.brief, state: data.state })
    toast('晨报写好了')
    return data.brief
  } catch (err) {
    report(err)
    return null
  }
}

/* ------------------------------- 日历 ------------------------------- */

export async function importIcs(text) {
  try {
    const data = await request('ics/import', { text })
    setDesk({ state: data.state })
    toast(`导入 ${data.added} 个日程${data.skipped ? `，跳过 ${data.skipped} 个重复规则` : ''}`)
    return data
  } catch (err) {
    report(err)
    return null
  }
}

export async function exportIcs() {
  try {
    const res = await fetch(`${BASE}ics?range=all`)
    if (!res.ok) throw new Error('导出失败')
    const text = await res.text()
    const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '办公工作台-日程.ics'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 3000)
    toast('已导出 .ics，可以导入到手机或企业日历')
  } catch (err) {
    report(err)
  }
}

/* ------------------------------- 对话 ------------------------------- */

function runActions(actions) {
  for (const action of actions ?? []) {
    if (action.type === 'nav' && action.view) setDesk({ view: action.view })
    if (action.type === 'open_mail' && action.id) openMail(action.id)
    if (action.type === 'open_event' && action.id) setDesk({ view: 'calendar', focusEventId: action.id })
    if (action.type === 'sync_mail') syncMail()
    if (action.type === 'refresh_quotes') refreshQuotes(true)
    if (action.type === 'brief') generateBrief()
  }
}

export async function sendChat(text) {
  const message = String(text ?? '').trim()
  if (!message || snapshot.thinking) return
  setDesk(s => ({
    thinking: true,
    state: { ...s.state, chat: [...s.state.chat, { id: `tmp_${Date.now()}`, role: 'user', text: message }] },
  }))
  try {
    const data = await request('chat', { message, focusId: snapshot.focusMailId ?? undefined })
    setDesk({ state: data.state, canUndo: true, modelOk: data.modelOk, modelError: data.modelError })
    runActions(data.actions)
  } catch (err) {
    report(err)
    await loadDesk()
  } finally {
    setDesk({ thinking: false })
  }
}

/* ------------------------------- 设置 ------------------------------- */

export async function saveSettings(patch) {
  try {
    const data = await request('settings', patch)
    setDesk({ settings: data })
    // 换了邮件来源要立刻把 /state 里的 mail 状态（provider、ready、账户）也刷新过来
    await loadDesk()
    toast('设置已保存')
    return true
  } catch (err) {
    report(err)
    return false
  }
}

export async function testMail(payload) {
  try {
    return await request('settings/test-mail', payload)
  } catch (err) {
    return { ok: false, error: err.message }
  }
}
