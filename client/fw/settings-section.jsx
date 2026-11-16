// DSH 设置页里的「工作台」一节：主题、整体重置、当前 revision 与组件数。
// 数据来自 Host 的 /work-desk/workbench，和界面上的工作台是同一份状态。
import React from 'react'

const BASE = 'work-desk/'
const THEMES = [
  { id: 'instrument', label: '量被画出来', hint: '烟熏石墨卡片，等宽数字' },
  { id: 'paper', label: '书桌上的纸', hint: '米白纸卡，衬线数字' },
  { id: 'type', label: '玻璃上的字', hint: '无卡片，大号细体数字' },
]

const card = {
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: 12,
  padding: '14px 16px',
  background: 'var(--dsw-alias-bg-layer-2)',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}
const muted = { color: 'var(--dsw-alias-label-secondary)', fontSize: 11.5, lineHeight: 1.6 }

export function WorkbenchSettings() {
  const [data, setData] = React.useState(null)
  const [busy, setBusy] = React.useState('')
  const [error, setError] = React.useState('')

  const load = React.useCallback(async () => {
    try {
      const res = await fetch(BASE + 'workbench')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
      setError('')
    } catch (err) {
      setError(`读不到工作台布局（${err.message}）。重启 Harness 后这里才有数据。`)
    }
  }, [])

  React.useEffect(() => { load() }, [load])

  const apply = async (ops, tag) => {
    if (!data) return
    setBusy(tag)
    try {
      const res = await fetch(BASE + 'workbench', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ baseRevision: data.revision, requestId: `settings-${tag}-${Date.now()}`, ops, source: 'settings' }),
      })
      const payload = await res.json()
      if (!payload.ok) throw new Error((payload.errors ?? [payload.error ?? '保存失败'])[0])
      setData({ revision: payload.revision, theme: payload.layout.theme, atoms: payload.layout.atoms })
      setError('')
    } catch (err) {
      setError(err.message)
      await load()
    } finally {
      setBusy('')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640 }}>
      <div style={card}>
        <strong style={{ fontSize: 13 }}>外观</strong>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {THEMES.map(theme => (
            <button
              key={theme.id}
              type="button"
              disabled={busy === theme.id || !data}
              aria-pressed={data?.theme === theme.id}
              onClick={() => apply([{ op: 'theme', theme: theme.id }], theme.id)}
              title={theme.hint}
              style={{
                cursor: 'pointer',
                border: '1px solid var(--dsw-alias-border-l2)',
                borderRadius: 9,
                padding: '7px 11px',
                fontSize: 12,
                background: data?.theme === theme.id ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-bg-layer-1)',
                color: data?.theme === theme.id ? 'var(--dsw-alias-label-primary-inverted)' : 'var(--dsw-alias-label-primary)',
              }}
            >
              {theme.label}
            </button>
          ))}
        </div>
        <span style={muted}>主题同时作用于内置原子与 FullWidget 原生组件。</span>
      </div>

      <div style={card}>
        <strong style={{ fontSize: 13 }}>布局</strong>
        <span style={muted}>
          {data ? `revision ${data.revision} · ${data.atoms.length} 个组件 · 8 列，小 1×1 / 中 2×1 / 大 4×3` : '正在读取…'}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            disabled={busy === 'reload' || !data}
            onClick={load}
            style={{ cursor: 'pointer', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 9, padding: '7px 11px', fontSize: 12, background: 'var(--dsw-alias-bg-layer-1)', color: 'var(--dsw-alias-label-primary)' }}
          >
            重新读取
          </button>
          <button
            type="button"
            disabled={busy === 'reset' || !data}
            onClick={() => apply([{ op: 'replace', layout: { theme: 'instrument', atoms: [
              { id: 'cal', type: 'calendar', size: 'l' },
              { id: 'next', type: 'next', size: 'm' },
              { id: 'tasks', type: 'tasks', size: 'm' },
              { id: 'mail', type: 'mail', size: 'm' },
              { id: 'quotes', type: 'quotes', size: 'm' },
              { id: 'brief', type: 'brief', size: 'm' },
              { id: 'clock', type: 'clock', size: 'm' },
              { id: 'alerts', type: 'alerts', size: 's' },
              { id: 'quick', type: 'quick', size: 's' },
            ] } }], 'reset')}
            style={{ cursor: 'pointer', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 9, padding: '7px 11px', fontSize: 12, background: 'var(--dsw-alias-bg-layer-1)', color: 'var(--dsw-alias-label-primary)' }}
          >
            恢复默认布局
          </button>
        </div>
        <span style={muted}>恢复默认只改布局，不动邮件、日程、待办等业务数据。</span>
      </div>

      <div style={card}>
        <strong style={{ fontSize: 13 }}>Agent</strong>
        <span style={muted}>
          对话里可以直接说「把待办改成大卡，加一张本周概览」。Agent 通过 workbench_inspect 读布局、workbench_apply 改布局，改动与本页这份布局是同一份数据。
        </span>
      </div>

      {error ? <p style={{ color: 'var(--dsw-alias-state-error-primary)', fontSize: 12 }}>{error}</p> : null}
    </div>
  )
}
