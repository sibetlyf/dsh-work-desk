// 工作台（原子桌面）：8 列网格，小 1×1 / 中 2×1 / 大 4×3。
// 内置原子 + FullWidget 全部原生组件 + 生成式卡片，共用同一套布局、主题与编辑操作。
// 布局暂存本机浏览器；写入 Host、Agent 编排是后续步骤，界面上如实标注。
import React from 'react'
import { dispatchOps, openMail, setDesk, toast, useDesk } from '../desk.js'
import { renderAtom } from './atoms.jsx'
import { FwWidget, fwIconUrl, sizeOfWidget, useFwWidgets } from './fwwidgets.jsx'
import { GenuiAtom, sanitizeSpec } from './genui.jsx'
import { ATOMS, SIZES, cellCount, defaultLayout, isKnownType, loadLayout, newId, planLayout, sanitize, saveLayout } from './layout.js'

const THEMES = [
  { id: 'instrument', label: '量被画出来' },
  { id: 'paper', label: '书桌上的纸' },
  { id: 'type', label: '玻璃上的字' },
]

const EXAMPLES = [
  '{"title":"本周概览","items":[{"type":"stat","label":"会议","value":"6"},{"type":"progress","label":"待办完成度","value":60},{"type":"chart","data":[{"label":"周一","value":2},{"label":"周二","value":1},{"label":"周三","value":3}]}]}',
  '{"title":"风险提示","items":[{"type":"callout","tone":"warning","title":"两封邮件待回复","content":"陈欣与周舟都在等确认。"},{"type":"steps","current":1,"steps":["确认会议时间","回复评审材料"]}]}',
  '{"title":"今日三件事","items":[{"type":"list","items":[{"title":"准备评审材料","desc":"14:00 前"},{"title":"回复会议确认","desc":"今天"},{"title":"整理项目进展","desc":"明天"}]}]}',
]

function widgetOf(widgets, type) {
  const id = type.startsWith('fw:') ? type.slice(3) : ''
  return widgets.find(row => row.id === id)
}

function nameOf(widgets, atom) {
  if (ATOMS[atom.type]) return ATOMS[atom.type].label
  if (atom.type === 'genui') return atom.spec?.title || '生成式卡片'
  const widget = widgetOf(widgets, atom.type)
  if (!widget) return '组件未加载'
  const name = widget.name
  return typeof name === 'object' ? (name['zh-CN'] ?? name.zh ?? name.en ?? widget.id) : name
}

export function WorkbenchView() {
  const state = useDesk(s => s.state)
  const quotes = useDesk(s => s.quotes)
  const alerts = useDesk(s => s.alerts)
  const mail = useDesk(s => s.mail)
  const fw = useFwWidgets()
  const [layout, setLayout] = React.useState(() => loadLayout())
  const [revision, setRevision] = React.useState(0)
  const [remote, setRemote] = React.useState(null) // null 未知 / true Host 权威 / false 本机兜底
  const [editing, setEditing] = React.useState(false)
  const [panel, setPanel] = React.useState(null)
  const [query, setQuery] = React.useState('')
  const [draft, setDraft] = React.useState(EXAMPLES[0])
  const dragFrom = React.useRef(null)
  const [dropAt, setDropAt] = React.useState(null)
  const [now, setNow] = React.useState(() => new Date())
  const saveTimer = React.useRef(null)
  const revisionRef = React.useRef(0)

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(timer)
  }, [])

  const adopt = data => {
    const next = sanitize({ theme: data.theme, atoms: data.atoms })
    if (!next) return
    setLayout(next)
    setRevision(data.revision)
    revisionRef.current = data.revision
    setRemote(true)
  }

  React.useEffect(() => {
    let live = true
    const load = async () => {
      try {
        const res = await fetch('work-desk/workbench')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (live) adopt(data)
      } catch {
        if (live) setRemote(false)
      }
    }
    load()
    const timer = setInterval(load, 15_000)
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => { live = false; clearInterval(timer); window.removeEventListener('focus', onFocus) }
  }, [])

  // 改动先即时生效，再整批写回 Host；Host 不在线时退回本机保存。
  React.useEffect(() => {
    if (remote === null) return
    if (remote === false) { saveLayout(layout); return }
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        const res = await fetch('work-desk/workbench', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            baseRevision: revisionRef.current,
            requestId: `ui-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
            ops: [{ op: 'replace', layout: { theme: layout.theme, atoms: layout.atoms } }],
            source: 'ui',
          }),
        })
        const data = await res.json()
        if (data.conflict) {
          toast('布局已被别处改过，已重新读取', { error: true })
          adopt(data.layout ? { ...data.layout, revision: data.revision } : data)
          return
        }
        if (!data.ok) { toast((data.errors ?? ['保存失败'])[0], { error: true }); return }
        setRevision(data.revision)
        revisionRef.current = data.revision
        saveLayout(layout)
      } catch {
        setRemote(false)
      }
    }, 350)
    return () => clearTimeout(saveTimer.current)
  }, [layout, remote])

  const update = mutate => setLayout(prev => {
    const draftLayout = { ...prev, atoms: prev.atoms.map(atom => ({ ...atom })) }
    mutate(draftLayout)
    return draftLayout
  })

  const plan = planLayout(layout.atoms)
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
    update(draftLayout => {
      const [item] = draftLayout.atoms.splice(from, 1)
      draftLayout.atoms.splice(to, 0, item)
    })
  }

  const add = atom => {
    if (layout.atoms.length >= 24) { toast('最多 24 个组件位', { error: true }); return }
    update(draftLayout => { draftLayout.atoms.push({ id: newId(), ...atom }) })
    setPanel(null)
  }

  const addWidget = widget => add({ type: `fw:${widget.id}`, size: sizeOfWidget(widget) })
  const addGenui = () => {
    let spec
    try { spec = JSON.parse(draft) } catch (err) { toast(`JSON 解析失败：${err.message}`, { error: true }); return }
    if (!sanitizeSpec(spec)) { toast('规格不合法：至少需要一个白名单组件', { error: true }); return }
    add({ type: 'genui', size: 'm', spec })
  }

   const filtered = fw.widgets.filter(widget => {
    if (!query.trim()) return true
    const name = typeof widget.name === 'object' ? JSON.stringify(widget.name) : String(widget.name)
    return `${widget.id} ${name} ${widget.category}`.toLowerCase().includes(query.trim().toLowerCase())
  })

  return (
    <div className="wd-page wd-bench-page">
      <div className={`wd-fw ${editing ? 'is-editing' : ''}`} data-fw-theme={layout.theme}>
        <header className="fw-bar">
          <div><h1>工作台</h1></div>
          <span className="fw-sub">8 列 · 1×1 / 2×1 / 4×3 · {layout.atoms.length} 个组件 · {fw.widgets.length ? `FullWidget ${fw.widgets.length} 个原生组件可用` : '正在读取 FullWidget 组件'}</span>
          <span className="fw-grow" />
          <div className="fw-seg" role="group" aria-label="外观主题">
            {THEMES.map(theme => (
              <button key={theme.id} type="button" aria-pressed={layout.theme === theme.id} onClick={() => update(draftLayout => { draftLayout.theme = theme.id })}>{theme.label}</button>
            ))}
          </div>
          <button type="button" className="fw-btn" onClick={() => setPanel(panel === 'add' ? null : 'add')} aria-expanded={panel === 'add'}>＋ 添加组件</button>
          <button type="button" className={`fw-btn ${editing ? 'is-on' : ''}`} onClick={() => setEditing(value => !value)}>{editing ? '✓ 完成编辑' : '编辑布局'}</button>
        </header>

        {fw.error ? <p className="fw-hint">FullWidget 组件没读到：{fw.error}</p> : null}

        {panel === 'add' ? (
          <div className="fw-panel">
            <div className="fw-panel-section">
              <h3>内置原子</h3>
              <div className="fw-chiprow">
                {Object.entries(ATOMS).map(([type, meta]) => (
                  <button key={type} type="button" className="fw-btn" title={meta.hint} onClick={() => add({ type, size: 'm' })}>{meta.label}</button>
                ))}
              </div>
            </div>
            <div className="fw-panel-section">
              <h3>FullWidget 原生组件 <span className="fw-label">{filtered.length}/{fw.widgets.length}</span></h3>
              <input className="fw-input" value={query} onChange={event => setQuery(event.target.value)} placeholder="按名字或分类筛选，例如 clock、weather、todo…" aria-label="筛选 FullWidget 组件" />
              <div className="fw-widgetgrid">
                {filtered.map(widget => (
                  <button key={widget.id} type="button" className="fw-widgetchip" onClick={() => addWidget(widget)} title={`${widget.id} · ${widget.category}`}>
                    <img src={fwIconUrl(widget.id)} alt="" width={18} height={18} loading="lazy" />
                    <span>{typeof widget.name === 'object' ? (widget.name['zh-CN'] ?? widget.id) : widget.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="fw-panel-section">
              <h3>生成式卡片</h3>
              <textarea className="fw-input" rows={5} value={draft} onChange={event => setDraft(event.target.value)} aria-label="生成式卡片 JSON" spellCheck={false} />
              <div className="fw-chiprow">
                <button type="button" className="fw-btn" onClick={addGenui}>加入工作台</button>
                <button type="button" className="fw-btn" onClick={() => setDraft(EXAMPLES[(EXAMPLES.indexOf(draft) + 1) % EXAMPLES.length] ?? EXAMPLES[0])}>换个示例</button>
                <span className="fw-label">白名单：text / stat / badge / progress / list / keyvalue / steps / callout / chart / divider</span>
              </div>
            </div>
          </div>
        ) : null}

        {editing ? <p className="fw-hint">拖动卡片换位置：虚线格子是可用位置；右上角切 小／中／大 或移除。</p> : null}

        <div className="fw-grid" aria-label="工作台组件网格">
          {editing ? (
            <div className="fw-cells" aria-hidden="true" style={{ gridRow: `1 / span ${plan.rows}` }}>
              {Array.from({ length: plan.rows * 8 }, (_, index) => <i key={index} />)}
            </div>
          ) : null}
          {layout.atoms.map((atom, index) => {
            const spot = plan.placed[index] ?? { row: 0, col: 0, w: 1, h: 1 }
            const widget = widgetOf(fw.widgets, atom.type)
            const genui = atom.type === 'genui'
            return (
              <div
                key={atom.id}
                className={[
                  'fw-slot', `is-${atom.size}`,
                  editing ? 'is-editing' : '',
                  dropAt === index && dragFrom.current !== index ? 'is-drop' : '',
                  dragFrom.current === index ? 'is-dragging' : '',
                ].filter(Boolean).join(' ')}
                style={{ gridColumn: `${spot.col + 1} / span ${spot.w}`, gridRow: `${spot.row + 1} / span ${spot.h}` }}
                draggable={editing}
                onDragStart={() => { dragFrom.current = index }}
                onDragOver={event => { if (!editing) return; event.preventDefault(); setDropAt(index) }}
                onDragLeave={() => setDropAt(value => (value === index ? null : value))}
                onDrop={event => { if (!editing) return; event.preventDefault(); move(dragFrom.current, index); dragFrom.current = null; setDropAt(null) }}
                onDragEnd={() => { dragFrom.current = null; setDropAt(null) }}
              >
                <article className={`fw-card ${widget ? 'is-widget' : ''} ${genui ? 'is-genui' : ''}`}>
                  <header className="fw-head">
                    {widget ? <img className="fw-icon" src={fwIconUrl(widget.id)} alt="" width={14} height={14} loading="lazy" /> : null}
                    <h2>{nameOf(fw.widgets, atom)}</h2>
                    <span className="fw-meta">{SIZES[atom.size].label}</span>
                  </header>
                  <div className="fw-body">
                    {widget ? (
                      <FwWidget widget={widget} instanceId={atom.id} theme={layout.theme} config={atom.config} />
                    ) : genui ? (
                      <GenuiAtom spec={atom.spec} />
                    ) : state ? (
                      renderAtom(atom, ctx)
                    ) : <p className="fw-empty">正在读取工作台…</p>}
                  </div>
                </article>
                {editing ? (
                  <div className="fw-edit">
                    <button type="button" className="fw-drag" aria-label="拖动排序" title="按住拖动">⠿</button>
                    {Object.entries(SIZES).map(([size, meta]) => (
                      <button key={size} type="button" aria-pressed={atom.size === size} onClick={() => update(draftLayout => { draftLayout.atoms[index].size = size })}>{meta.label}</button>
                    ))}
                    <button type="button" aria-label="移除组件" onClick={() => update(draftLayout => { draftLayout.atoms.splice(index, 1) })}>×</button>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        <p className="fw-hint">
          占用 {cellCount(layout.atoms)} 格 · {remote === true ? `Host 保存（revision ${revision}）· Agent 可通过 workbench_inspect / workbench_apply 修改` : remote === false ? 'Host 接口不可用，暂存本机浏览器（重启 Harness 后自动切换为 Host 保存）' : '正在读取 Host 布局…'}
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

export { defaultLayout, isKnownType, loadLayout }
