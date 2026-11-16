// 工作台右侧会话栏：最近会话 + 新建会话。
// 会话由 DSH 的 sessions/uiWorkspace 服务负责，这里不发消息、不碰会话内容。
import React from 'react'
import { getRootCtx } from '../desk.js'

const EMPTY = { ids: [], byId: {}, archivedSessionIds: [] }

function useSnapshot(service, key) {
  const store = React.useMemo(() => service?.get?.(key) ?? null, [service, key])
  return React.useSyncExternalStore(
    React.useCallback(callback => (store ? store.subscribe(callback) : () => {}), [store]),
    React.useCallback(() => (store ? store.getSnapshot() : EMPTY), [store]),
  )
}

function titleOf(row) {
  const title = row?.title || row?.durableTitle
  if (title) return String(title)
  return row?.blank ? '新会话' : '未命名会话'
}

function ago(ms) {
  if (!ms) return ''
  const diff = Date.now() - ms
  const min = Math.round(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const hour = Math.round(min / 60)
  if (hour < 24) return `${hour} 小时前`
  return `${Math.round(hour / 24)} 天前`
}

export function SessionRail() {
  const ctx = React.useMemo(() => getRootCtx(), [])
  const sessions = React.useMemo(() => ctx?.get?.('sessions') ?? null, [ctx])
  const uiWorkspace = React.useMemo(() => ctx?.get?.('uiWorkspace') ?? null, [ctx])
  const list = useSnapshot(sessions, 'list')
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState('')

  const rows = React.useMemo(() => {
    const archived = new Set(list?.archivedSessionIds ?? [])
    return (list?.ids ?? [])
      .map(id => ({ id, ...(list.byId?.[id] ?? {}) }))
      .filter(row => !archived.has(row.id))
      .sort((a, b) => Number(a.blank ?? false) - Number(b.blank ?? false) || (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      .slice(0, 8)
  }, [list])

  const create = () => {
    if (!uiWorkspace?.startSession) {
      setError('这个环境没有会话服务（重启 Harness 后再试）')
      return
    }
    setBusy(true)
    setError('')
    try {
      uiWorkspace.startSession()
    } catch (err) {
      setError(err?.message ?? '新建会话失败')
    } finally {
      setBusy(false)
    }
  }

  const open = id => {
    if (!uiWorkspace?.openSession) {
      setError('这个环境没有会话服务')
      return
    }
    try {
      uiWorkspace.openSession(id)
    } catch (err) {
      setError(err?.message ?? '打开会话失败')
    }
  }

  return (
    <aside className="fw-rail" aria-label="DSH 会话">
      <header className="fw-rail-head">
        <span>会话</span>
        <button type="button" className="fw-btn" onClick={create} disabled={busy} aria-label="新建会话">＋ 新建</button>
      </header>
      {error ? <p className="fw-rail-error">{error}</p> : null}
      {rows.length === 0 ? (
        <p className="fw-rail-empty">还没有会话。点「＋ 新建」开一个，工作台不会替你发消息。</p>
      ) : (
        <ul className="fw-rail-list">
          {rows.map(row => (
            <li key={row.id}>
              <button type="button" onClick={() => open(row.id)} title={`${titleOf(row)} · ${row.id}`}>
                <b>{titleOf(row)}</b>
                <small>{row.running ? '进行中 · ' : ''}{ago(row.updatedAt)}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="fw-rail-foot">会话在 DSH 中打开；工作台只做入口与布局。</p>
    </aside>
  )
}
