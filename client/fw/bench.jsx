// 工作台（原子桌面）：8 列网格，小 1×1 / 中 2×1 / 大 4×3。
// 内置原子 + FullWidget 全部原生组件 + 生成式卡片，共用同一套布局、主题与编辑操作。
// 布局暂存本机浏览器；写入 Host、Agent 编排是后续步骤，界面上如实标注。
import React from 'react'
import { dispatchOps, getRootCtx, openMail, setDesk, toast, useDesk } from '../desk.js'
import { renderAtom } from './atoms.jsx'
import { FwWidget, fwIconUrl, sizeOfWidget, useFwWidgets } from './fwwidgets.jsx'
import { GenuiAtom, pickSpec, sanitizeSpec, specUsable } from './genui.jsx'
import { auditView } from './grammar.js'
import { useSources } from './sources.js'
import { SessionRail } from './session-rail.jsx'
import { ATOMS, SIZES, SOURCE_NAMES, cellCount, columnsFor, defaultLayout, isKnownType, loadLayout, newId, planLayout, sanitize, saveLayout } from './layout.js'

const THEMES = [
  { id: 'instrument', label: '量被画出来' },
  { id: 'paper', label: '书桌上的纸' },
  { id: 'type', label: '玻璃上的字' },
]

const EXAMPLES = [
  '{"title":"本周概览","items":[{"type":"stat","label":"会议","value":"6"},{"type":"progress","label":"待办完成度","value":60},{"type":"chart","data":[{"label":"周一","value":2},{"label":"周二","value":1},{"label":"周三","value":3}]}]}',
  '{"title":"风险提示","items":[{"type":"callout","tone":"warning","title":"两封邮件待回复","content":"陈欣与周舟都在等确认。"},{"type":"steps","current":1,"steps":["确认会议时间","回复评审材料"]}]}',
  '{"title":"今日三件事","items":[{"type":"list","items":[{"title":"准备评审材料","desc":"14:00 前"},{"title":"回复会议确认","desc":"今天"},{"title":"整理项目进展","desc":"明天"}]}]}',
  '{"title":"三档规格","items":[],"views":{"s":{"title":"6 个会","items":[{"type":"stat","label":"今天","value":"6"}]},"m":{"title":"本周概览","items":[{"type":"progress","label":"待办完成","value":60},{"type":"list","items":["准备评审材料","回复会议确认"]}]},"l":{"title":"本周工作概览","items":[{"type":"chart","data":[{"label":"周一","value":2},{"label":"周二","value":1},{"label":"周三","value":3},{"label":"周四","value":2}]},{"type":"keyvalue","pairs":[{"key":"会议","value":"6 场"},{"key":"待办","value":"4 条"}]}]}}}',
  '{"title":"会议助手盯场","items":[{"type":"keyvalue","pairs":[{"key":"运行","value":"{{meeting.running}}"},{"key":"采集","value":"{{meeting.capturing}}"},{"key":"监听","value":"{{meeting.heard}}"}]},{"type":"callout","tone":"accent","title":"实时数据","content":"这行数字每 2 秒刷新一次，取不到会议助手时会显示原因。"}]}',
]

function widgetOf(widgets, type) {
  const id = type.startsWith('fw:') ? type.slice(3) : ''
  return widgets.find(row => row.id === id)
}

function localText(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value['zh-CN'] ?? value.zh ?? value.en ?? Object.values(value)[0])
    : value
}

/** FullWidget 组件自带 settings 声明 → 自动生成配置表单。 */
function ComponentSettings({ widget, atom, onClose, onSave }) {
  const fields = widget?.settings ?? []
  const submit = event => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const config = {}
    for (const field of fields) {
      const key = field.key
      if (field.type === 'toggle') config[key] = data.get(key) === 'on'
      else if (field.type === 'number') config[key] = Number(data.get(key))
      else config[key] = String(data.get(key) ?? '')
    }
    onSave(config)
  }
  return (
    <div className="fw-modal" role="dialog" aria-modal="true" aria-label="组件设置" onClick={event => { if (event.target === event.currentTarget) onClose() }}>
      <form className="fw-modal-card" onSubmit={submit}>
        <header>
          <h3>{localText(widget?.name) || '组件设置'}</h3>
          <button type="button" onClick={onClose} aria-label="关闭">×</button>
        </header>
        {fields.length === 0 ? <p className="fw-hint">这个组件没有可配置项。</p> : fields.map(field => {
          const key = field.key
          const value = atom.config?.[key] ?? localText(field.default)
          const label = localText(field.label) || key
          if (field.type === 'toggle') {
            return (
              <label key={key} className="fw-field is-toggle">
                <span>{label}</span>
                <input type="checkbox" name={key} defaultChecked={Boolean(value)} />
              </label>
            )
          }
          if (field.type === 'select') {
            return (
              <label key={key} className="fw-field">
                <span>{label}</span>
                <select name={key} defaultValue={value ?? ''}>
                  {(field.options ?? []).map(option => (
                    <option key={option.value} value={option.value}>{localText(option.label) || option.value}</option>
                  ))}
                </select>
              </label>
            )
          }
          return (
            <label key={key} className="fw-field">
              <span>{label}</span>
              <input name={key} type={field.type === 'number' ? 'number' : 'text'} defaultValue={value ?? ''} />
            </label>
          )
        })}
        <footer>
          <button type="button" className="fw-btn" onClick={onClose}>取消</button>
          <button type="submit" className="fw-btn is-on">保存</button>
        </footer>
      </form>
    </div>
  )
}

function nameOf(widgets, atom) {
  if (ATOMS[atom.type]) return ATOMS[atom.type].label
  if (atom.type === 'genui') return atom.spec?.title || '生成式卡片'
  const widget = widgetOf(widgets, atom.type)
  if (!widget) return '组件未加载'
  const name = widget.name
  return typeof name === 'object' ? (name['zh-CN'] ?? name.zh ?? name.en ?? widget.id) : name
}

async function readRemoteLayout() {
  const res = await fetch('work-desk/workbench')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
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
  const [configFor, setConfigFor] = React.useState(null)
  const [railOpen, setRailOpen] = React.useState(true)
  const [preview, setPreview] = React.useState(null)
  const [previewSize, setPreviewSize] = React.useState('m')
  const [addedPreview, setAddedPreview] = React.useState('')
  const activityRef = React.useRef({ running: false })
  const onActivity = React.useCallback(activity => { activityRef.current = activity }, [])
  const onPreview = React.useCallback(candidate => setPreview(prev => JSON.stringify(prev) === JSON.stringify(candidate) ? prev : candidate), [])
  const [columns, setColumns] = React.useState(8)
  const saveTimer = React.useRef(null)
  const revisionRef = React.useRef(0)
  // 已同步到 Host 的布局签名与「本地有未保存改动」标记：读回/轮询不能覆盖用户改动，也不能凭空写 Host
  const syncedRef = React.useRef('')
  const dirtyRef = React.useRef(false)
  const hostRef = React.useRef(null)

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(timer)
  }, [])

  // 容器宽度决定列数（与 theme.css 的容器查询同一阈值）：卡片必须按实际列数放置
  const railTouched = React.useRef(false)
  React.useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined
    const apply = width => setColumns(columnsFor(width))
    apply(host.getBoundingClientRect().width)
    const observer = new ResizeObserver(entries => {
      const entry = entries[entries.length - 1]
      if (entry) apply(entry.contentRect.width)
    })
    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  // 会话栏按窗口宽度决定（不能按格子宽度：栏一开一关会让宽度来回震荡）
  React.useEffect(() => {
    const sync = () => {
      if (!railTouched.current) setRailOpen(window.innerWidth >= 900)
    }
    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [])

  const adopt = data => {
    const next = sanitize({ theme: data?.theme, atoms: data?.atoms })
    if (!next) return false
    setLayout(next)
    setRevision(data.revision)
    revisionRef.current = data.revision
    syncedRef.current = JSON.stringify(next)
    dirtyRef.current = false
    setRemote(true)
    return true
  }

  const resync = async () => {
    try {
      const data = await readRemoteLayout()
      adopt(data)
    } catch {
      setRemote(false)
    }
  }

  React.useEffect(() => {
    let live = true
    const load = async () => {
      if (!live || dirtyRef.current) return // 本地有未保存改动时，轮询不覆盖
      try {
        const data = await readRemoteLayout()
        adopt(data)
      } catch {
        if (live) setRemote(false)
      }
    }
    load()
    // 活跃会话里的工具改动要即时反映到工作台；只读同步，不产生额外 revision。
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible' && activityRef.current.running) load()
    }, 1000)
    const idleTimer = setInterval(load, 15_000)
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => { live = false; clearInterval(timer); clearInterval(idleTimer); window.removeEventListener('focus', onFocus) }
  }, [])

  // 只有用户改动过（dirty）才写回；读回同一份布局不产生写入。
  React.useEffect(() => {
    if (remote === null) return undefined
    const sig = JSON.stringify(layout)
    if (remote === false) {
      if (sig !== syncedRef.current) {
        saveLayout(layout)
        syncedRef.current = sig
        dirtyRef.current = false
      }
      return undefined
    }
    if (!dirtyRef.current || sig === syncedRef.current) return undefined
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
        const data = await res.json().catch(() => ({}))
        if (data.conflict) {
          // 布局在别处被改过：用新的 revision 把本地这份改动重提一次，
          // 而不是直接丢掉用户刚才的移动/换档。
          try {
            const fresh = await (await fetch('work-desk/workbench')).json()
            revisionRef.current = fresh.revision
            setRevision(fresh.revision)
            // 合并而不是覆盖：本地这份布局为准，同时把别处新加、我们不认识的组件接在后面
            const merged = {
              theme: layout.theme,
              atoms: [...layout.atoms, ...(fresh.atoms ?? []).filter(atom => !layout.atoms.some(local => local.id === atom.id))],
            }
            const retry = await fetch('work-desk/workbench', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                baseRevision: fresh.revision,
                requestId: `ui-rebase-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
                ops: [{ op: 'replace', layout: merged }],
                source: 'ui',
              }),
            })
            const again = await retry.json().catch(() => ({}))
            if (again.ok) {
              syncedRef.current = JSON.stringify(merged)
              dirtyRef.current = false
              saveLayout(merged)
              adopt({ theme: merged.theme, atoms: merged.atoms, revision: again.revision })
              toast('布局已被别处改过，已按你的这次改动合并保存', {})
              return
            }
          } catch { /* 重提失败就走下面的回读 */ }
          toast('布局已被别处改过，已重新读取', { error: true })
          await resync()
          return
        }
        if (!data.ok) {
          toast((data.errors ?? [data.error ?? '保存失败'])[0], { error: true })
          await resync()
          return
        }
        syncedRef.current = sig
        dirtyRef.current = false
        setRevision(data.revision)
        revisionRef.current = data.revision
        saveLayout(layout)
      } catch {
        setRemote(false)
      }
    }, 350)
    return () => clearTimeout(saveTimer.current)
  }, [layout, remote])

  const update = mutate => {
    dirtyRef.current = true
    setLayout(prev => {
      const draftLayout = { ...prev, atoms: prev.atoms.map(atom => ({ ...atom })) }
      mutate(draftLayout)
      return draftLayout
    })
  }

  const plan = planLayout(layout.atoms, columns)
  // 只有声明了数据源的组件才拉数据；没有订阅时一次请求都不发。
  const needed = React.useMemo(() => {
    const names = layout.atoms.flatMap(atom => atom.sources ?? (atom.type === 'meeting' ? ['meeting', 'desk'] : []))
    return [...new Set(names)]
  }, [layout.atoms])
  const live = useSources(needed)
  const ctx = {
    state: state ?? { events: [], tasks: [], mails: [], watchlist: [], brief: null },
    quotes,
    alerts,
    mail,
    now,
    sources: live.data,
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

  const moveBy = (index, delta) => {
    const to = index + delta
    if (to < 0 || to >= layout.atoms.length) return
    update(draftLayout => {
      const [item] = draftLayout.atoms.splice(index, 1)
      draftLayout.atoms.splice(to, 0, item)
    })
  }

  const add = atom => {
    if (layout.atoms.length >= 24) { toast('最多 24 个组件位', { error: true }); return }
    // 会议助手组件自带数据源声明；其它组件不订阅就不拉数据。
    const sources = atom.sources ?? (atom.type === 'meeting' ? ['meeting', 'desk'] : undefined)
    update(draftLayout => { draftLayout.atoms.push({ id: newId(), ...atom, ...(sources ? { sources } : {}) }) })
    setPanel(null)
  }

  const addWidget = widget => add({ type: `fw:${widget.id}`, size: sizeOfWidget(widget) })
  const addGenui = () => {
    let spec
    try { spec = JSON.parse(draft) } catch (err) { toast(`JSON 解析失败：${err.message}`, { error: true }); return }
    if (!specUsable(spec)) { toast('规格不合法：至少需要一个白名单组件', { error: true }); return }
    // 规格里写了 {{meeting.xxx}} 就自动订阅对应数据源，不用再单独勾选
    const names = [...new Set([...JSON.stringify(spec).matchAll(/\{\{\s*([a-z]+)\./g)].map(match => match[1]))]
    const sources = names.filter(name => SOURCE_NAMES.includes(name))
    add({ type: 'genui', size: 'm', spec, ...(sources.length ? { sources } : {}) })
  }

   const filtered = fw.widgets.filter(widget => {
    if (!query.trim()) return true
    const name = typeof widget.name === 'object' ? JSON.stringify(widget.name) : String(widget.name)
    return `${widget.id} ${name} ${widget.category}`.toLowerCase().includes(query.trim().toLowerCase())
  })

  return (
    <div className="wd-page wd-bench-page">
      <div className={`fw-shell ${railOpen ? 'has-rail' : ''}`}>
      <div className={`wd-fw ${editing ? 'is-editing' : ''}`} data-fw-theme={layout.theme} ref={hostRef}>
        <header className="fw-bar">
          <div><h1>工作台</h1></div>
          <span className="fw-sub">8 列 · 1×1 / 2×1 / 4×3 · {layout.atoms.length} 个组件 · {fw.widgets.length ? `FullWidget ${fw.widgets.length} 个原生组件可用` : '正在读取 FullWidget 组件'}</span>
          <span className="fw-grow" />
          <div className="fw-seg" role="group" aria-label="外观主题">
            {THEMES.map(theme => (
              <button key={theme.id} type="button" aria-pressed={layout.theme === theme.id} onClick={() => update(draftLayout => { draftLayout.theme = theme.id })}>{theme.label}</button>
            ))}
          </div>
          <button type="button" className="fw-btn" aria-pressed={railOpen} onClick={() => { railTouched.current = true; setRailOpen(value => !value) }} aria-label={railOpen ? '收起会话栏' : '展开会话栏'}>会话</button>
          <button type="button" className="fw-btn" onClick={() => setPanel(panel === 'add' ? null : 'add')} aria-expanded={panel === 'add'}>＋ 添加组件</button>
          <button type="button" className="fw-btn" onClick={() => getRootCtx()?.layout?.selectPanel('super-design')}>超级创</button>
          <button
            type="button"
            className={`fw-btn ${editing ? 'is-on' : ''}`}
            aria-label={editing ? '完成编辑' : '编辑布局'}
            aria-pressed={editing}
            onClick={() => setEditing(value => !value)}
          >
            {editing ? '✓ 完成编辑' : '编辑布局'}
          </button>
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

        {preview ? (() => {
          const audit = auditView(pickSpec(preview.spec, previewSize), previewSize)
          const busy = !preview.complete || audit.blocked || addedPreview === JSON.stringify(preview.spec)
          return (
            <section className={`fw-live-preview is-${previewSize}`} aria-label="生成 UI 实时预览">
              <header>
                <strong>{preview.complete ? '生成 UI 预览' : '生成中 · 实时预览'}</strong>
                <span className={`fw-score is-${audit.blocked ? 'fail' : audit.score >= 80 ? 'pass' : 'warn'}`} title="按 dsh-widgets 空间语法打分">语法 {audit.score}</span>
                <div className="fw-seg" aria-label="预览尺寸">
                  {Object.entries(SIZES).map(([size, meta]) => <button type="button" key={size} aria-pressed={previewSize === size} onClick={() => setPreviewSize(size)}>{meta.label}</button>)}
                </div>
                <button type="button" className="fw-btn" disabled={busy} onClick={() => {
                  if (layout.atoms.length >= 24) { toast('最多 24 个组件位', { error: true }); return }
                  if (audit.blocked) { toast(audit.issues[0] ?? '规格不符合空间语法', { error: true }); return }
                  add({ type: 'genui', size: previewSize, spec: preview.spec })
                  setAddedPreview(JSON.stringify(preview.spec))
                }}>{addedPreview === JSON.stringify(preview.spec) ? '已加入组件' : '＋ 加入组件'}</button>
              </header>
              <div className={`fw-preview-body is-${previewSize}`}><GenuiAtom spec={preview.spec} size={previewSize} /></div>
              {audit.issues.length ? (
                <ul className="fw-issues" aria-label="语法提示">
                  {audit.issues.slice(0, 3).map(issue => <li key={issue}>{issue}</li>)}
                </ul>
              ) : null}
              {!preview.complete ? <small>已解析的内容会逐步出现；规格完整后才能加入。</small> : null}
            </section>
          )
        })() : null}
        <div className="fw-grid" aria-label="工作台组件网格" style={{ '--fw-cols': columns }}>
          {editing ? (
            <div className="fw-cells" aria-hidden="true" style={{ gridRow: `1 / span ${plan.rows}` }}>
              {Array.from({ length: plan.rows * columns }, (_, index) => <i key={index} />)}
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
                tabIndex={editing ? 0 : undefined}
                aria-label={editing ? `${nameOf(fw.widgets, atom)}（${SIZES[atom.size].label}），方向键 ←/→ 移动` : undefined}
                onKeyDown={event => {
                  if (!editing) return
                  if (event.key === 'ArrowLeft') { event.preventDefault(); moveBy(index, -1) }
                  else if (event.key === 'ArrowRight') { event.preventDefault(); moveBy(index, 1) }
                }}
                onDragStart={event => {
                  dragFrom.current = index
                  try {
                    event.dataTransfer?.setData('text/plain', String(index))
                    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
                  } catch { /* 某些浏览器禁止在 dragstart 里写自定义数据 */ }
                }}
                onDragOver={event => {
                  if (!editing) return
                  event.preventDefault()
                  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
                  setDropAt(index)
                }}
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
                      <GenuiAtom spec={atom.spec} size={atom.size} data={live.data} />
                    ) : state ? (
                      renderAtom(atom, ctx)
                    ) : <p className="fw-empty">正在读取工作台…</p>}
                  </div>
                </article>
                {editing ? (
                  <div className="fw-edit">
                    <button type="button" className="fw-drag" aria-label="拖动排序" title="按住拖动">⠿</button>
                    {atom.size === 's' ? null : (
                      <>
                        <button type="button" aria-label="前移" title="前移" onClick={() => update(draftLayout => { if (index > 0) { const [item] = draftLayout.atoms.splice(index, 1); draftLayout.atoms.splice(index - 1, 0, item) } })}>←</button>
                        <button type="button" aria-label="后移" title="后移" onClick={() => update(draftLayout => { if (index < draftLayout.atoms.length - 1) { const [item] = draftLayout.atoms.splice(index, 1); draftLayout.atoms.splice(index + 1, 0, item) } })}>→</button>
                      </>
                    )}
                    <button
                      type="button"
                      className="fw-size"
                      aria-label={`尺寸：${SIZES[atom.size].label}，点击切换下一档`}
                      title={`当前 ${SIZES[atom.size].label}，点一下换下一档`}
                      onClick={() => update(draftLayout => {
                        const order = ['s', 'm', 'l']
                        const next = order[(order.indexOf(atom.size) + 1) % order.length]
                        draftLayout.atoms[index].size = next
                      })}
                    >
                      {SIZES[atom.size].label}
                    </button>
                    {widget && (widget.settings ?? []).length ? <button type="button" onClick={() => setConfigFor(index)} aria-label="组件设置">⚙</button> : null}
                    <button type="button" aria-label="移除组件" onClick={() => update(draftLayout => { draftLayout.atoms.splice(index, 1) })}>×</button>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        <p className="fw-hint">
          占用 {cellCount(layout.atoms)} 格 · {remote === true ? `Host 保存（revision ${revision}）· Agent 可通过 workbench_inspect / workbench_apply 修改` : remote === false ? 'Host 接口不可用，暂存本机浏览器（重启 Harness 后自动切换为 Host 保存）' : '正在读取 Host 布局…'}
          {needed.length ? ` · 数据源 ${needed.join(' / ')}${live.at ? `（最近 ${new Date(live.at).toLocaleTimeString('zh-CN', { hour12: false })}）` : '（读取中）'}${live.error ? ` · ${live.error}` : ''}` : ' · 没有组件订阅数据源'}
        </p>

        {configFor != null && layout.atoms[configFor] ? (
          <ComponentSettings
            widget={widgetOf(fw.widgets, layout.atoms[configFor].type)}
            atom={layout.atoms[configFor]}
            onClose={() => setConfigFor(null)}
            onSave={config => {
              const index = configFor
              update(draftLayout => { draftLayout.atoms[index].config = config })
              setConfigFor(null)
            }}
          />
        ) : null}
      </div>
        {railOpen ? <SessionRail onClose={() => { railTouched.current = true; setRailOpen(false) }} onPreview={onPreview} onActivity={onActivity} /> : null}
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
