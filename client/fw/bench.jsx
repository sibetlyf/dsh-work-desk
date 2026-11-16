// 工作台（原子桌面）：8 列网格，小 1×1 / 中 2×1 / 大 4×3。
// 外观走 FullWidget 的三套主题；布局暂存当前浏览器，界面上如实标注。
import React from 'react'
import { dispatchOps, openMail, setDesk, toast, useDesk } from '../desk.js'
import { renderAtom } from './atoms.jsx'
import { ATOMS, SIZES, defaultLayout, loadLayout, newId, saveLayout, sanitize, cellCount } from './layout.js'

const THEMES = [
  { id: 'instrument', label: '量被画出来' },
  { id: 'paper', label: '书桌上的纸' },
  { id: 'type', label: '玻璃上的字' },
]

export function WorkbenchView() {
  const state = useDesk(s => s.state)
  const quotes = useDesk(s => s.quotes)
  const alerts = useDesk(s => s.alerts)
  const mail = useDesk(s => s.mail)
  const [layout, setLayout] = React.useState(() => loadLayout())
  const [editing, setEditing] = React.useState(false)
  const [adding, setAdding] = React.useState(false)
  const dragFrom = React.useRef(null)
  const [dropAt, setDropAt] = React.useState(null)
  const [now, setNow] = React.useState(() => new Date())

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(timer)
  }, [])

  React.useEffect(() => { saveLayout(layout) }, [layout])

  const update = (mutate) => setLayout(prev => {
    const draft = { ...prev, atoms: prev.atoms.map(atom => ({ ...atom })) }
    mutate(draft)
    return draft
  })

  const ctx = {
    state: state ?? { events: [], tasks: [], mails: [], watchlist: [], brief: null },
    quotes,
    alerts,
    mail,
    now,
    openCalendar: () => setDesk({ view: 'calendar' }),
    openToday: () => setDesk({ view: 'today' }),
    openMarket: () => setDesk({ view: 'market' }),
    openMail: id => { if (id) openMail(id); else setDesk({ view: 'mail' }) },
    toggleTask: id => { dispatchOps([{ op: 'toggle_task', id }], { label: '完成待办' }) },
  }

  const move = (from, to) => {
    if (from == null || to == null || from === to) return
    update(draft => {
      const [item] = draft.atoms.splice(from, 1)
      draft.atoms.splice(to, 0, item)
    })
  }

  const add = type => {
    if (layout.atoms.length >= 24) { toast('最多 24 个组件位', { error: true }); return }
    update(draft => { draft.atoms.push({ id: newId(), type, size: 'm' }) })
    setAdding(false)
  }

  return (
    <div className="wd-page wd-bench-page">
    <div className="wd-fw" data-fw-theme={layout.theme}>
      <header className="fw-bar">
        <div>
          <h1>工作台</h1>
        </div>
        <span className="fw-sub">8 列 · 小 1×1 / 中 2×1 / 大 4×3 · {layout.atoms.length} 个组件</span>
        <span className="fw-grow" />
        <div className="fw-seg" role="group" aria-label="外观主题">
          {THEMES.map(theme => (
            <button
              key={theme.id}
              type="button"
              aria-pressed={layout.theme === theme.id}
              onClick={() => update(draft => { draft.theme = theme.id })}
            >
              {theme.label}
            </button>
          ))}
        </div>
        <button type="button" className="fw-btn" onClick={() => setAdding(value => !value)} aria-expanded={adding}>＋ 添加组件</button>
        <button type="button" className={`fw-btn ${editing ? 'is-on' : ''}`} onClick={() => setEditing(value => !value)}>
          {editing ? '✓ 完成编辑' : '编辑布局'}
        </button>
      </header>

      {adding ? (
        <div className="fw-seg" style={{ alignSelf: 'flex-start' }}>
          {Object.entries(ATOMS).map(([type, meta]) => (
            <button key={type} type="button" onClick={() => add(type)} title={meta.hint}>{meta.label}</button>
          ))}
        </div>
      ) : null}

      {editing ? (
        <p className="fw-hint">拖动卡片换位置；每张卡右上角可切 小／中／大 或移除。布局只存在这台机器的浏览器里。</p>
      ) : null}

      <div className="fw-grid" aria-label="工作台组件网格">
        {layout.atoms.map((atom, index) => (
          <div
            key={atom.id}
            className={[
              'fw-slot', `is-${atom.size}`,
              editing ? 'is-editing' : '',
              dropAt === index && dragFrom.current !== index ? 'is-drop' : '',
              dragFrom.current === index ? 'is-dragging' : '',
            ].filter(Boolean).join(' ')}
            draggable={editing}
            onDragStart={() => { dragFrom.current = index }}
            onDragOver={event => { if (!editing) return; event.preventDefault(); setDropAt(index) }}
            onDragLeave={() => setDropAt(value => (value === index ? null : value))}
            onDrop={event => {
              if (!editing) return
              event.preventDefault()
              move(dragFrom.current, index)
              dragFrom.current = null
              setDropAt(null)
            }}
            onDragEnd={() => { dragFrom.current = null; setDropAt(null) }}
          >
            <article className="fw-card">
              <header className="fw-head">
                <h2>{ATOMS[atom.type].label}</h2>
                <span className="fw-meta">{SIZES[atom.size].label}</span>
              </header>
              <div className="fw-body">{state ? renderAtom(atom, ctx) : <p className="fw-empty">正在读取工作台…</p>}</div>
            </article>
            {editing ? (
              <div className="fw-edit">
                <button type="button" className="fw-drag" aria-label="拖动排序" title="按住拖动">⠿</button>
                {Object.entries(SIZES).map(([size, meta]) => (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={atom.size === size}
                    onClick={() => update(draft => { draft.atoms[index].size = size })}
                  >
                    {meta.label}
                  </button>
                ))}
                <button type="button" aria-label="移除组件" onClick={() => update(draft => { draft.atoms.splice(index, 1) })}>×</button>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <p className="fw-hint">
        占用 {cellCount(layout.atoms)} 格 · 布局暂存本机浏览器（Host 权威存储与 Agent 编排在后续步骤接入）
      </p>
    </div>
    </div>
  )
}

/** 把外部导入的布局写回（供后续导入入口与测试使用）。 */
export function applyLayout(raw) {
  const next = sanitize(raw)
  if (!next) return false
  saveLayout(next)
  return true
}

export { loadLayout, defaultLayout }
