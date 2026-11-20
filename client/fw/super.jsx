// 超级创模式：独立 DSH 面板。草稿与正式工作台分离，选中组件批注，
// 右侧原生会话负责设计对话，生成式卡片先落到草稿，确认后发布。
import React from 'react'
import { getRootCtx, toast } from '../desk.js'
import { GenuiAtom } from './genui.jsx'
import { ATOMS, SIZES, planLayout } from './layout.js'
import { UI_CREATION_HINT } from './ui-preview.js'
import { SessionDock } from '../sessiondock.jsx'
import fwCss from './theme.css'
import creationCss from './creation.css'
import pageCss from '../styles.css'

const BASE = 'work-desk/'
const THEMES = [
  { id: 'instrument', label: '量被画出来' },
  { id: 'paper', label: '书桌上的纸' },
  { id: 'type', label: '玻璃上的字' },
]

async function call(path, body) {
  const response = await fetch(BASE + path, {
    method: body === undefined ? 'GET' : 'POST',
    credentials: 'same-origin',
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok && !result.error) throw new Error(`HTTP ${response.status}`)
  if (result.error) throw new Error(result.error)
  return result
}

function superHint(state, selectedAtom) {
  const atom = selectedAtom ? `当前选中：${selectedAtom.id}（${nameOf(selectedAtom)}，${SIZES[selectedAtom.size]?.label}）` : '当前未选中组件'
  return `${UI_CREATION_HINT}\n[超级创模式]
你在超级创模式的独立草稿里工作，不是直接改正式工作台。先理解左侧画布和批注，再改草稿。
${atom}。草稿 revision：${state?.revision ?? '未知'}；待处理批注：${state?.comments?.filter(row => row.status === 'open').length ?? 0} 条。
修改草稿优先调用 super_design：inspect 看状态，ops 应用布局操作，comment 写批注，publish 仅在用户明确确认发布后调用。
用户只是描述设计时，不要直接 publish；生成式卡片用 workbench-ui 代码块输出三档规格，并遵守尺寸与信息预算。
不要把正式工作台数据、邮件正文或密钥写进批注。`
}

function nameOf(atom) {
  if (ATOMS[atom.type]) return ATOMS[atom.type].label
  if (atom.type === 'genui') return atom.spec?.title || '生成式卡片'
  return atom.type?.replace(/^fw:/, '') || '组件'
}

function SuperCanvas({ state, selected, onSelect }) {
  const columns = 8
  const plan = planLayout(state.draft.atoms, columns)
  return (
    <div className="super-canvas" style={{ '--fw-cols': columns }}>
      <div className="fw-grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {state.draft.atoms.map((atom, index) => {
          const spot = plan.placed[index] ?? { row: 0, col: 0, w: 1, h: 1 }
          return (
            <div
              key={atom.id}
              className={`fw-slot is-${atom.size}${selected === atom.id ? ' is-selected' : ''}`}
              style={{ gridColumn: `${spot.col + 1} / span ${spot.w}`, gridRow: `${spot.row + 1} / span ${spot.h}`, cursor: 'pointer' }}
              onClick={() => onSelect(atom.id)}
              role="button"
              tabIndex={0}
              onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') onSelect(atom.id) }}
            >
              <article className="fw-card super-card">
                <header className="fw-head"><span className="fw-label">{nameOf(atom)}</span><span className="fw-label">{SIZES[atom.size]?.label}</span></header>
                <div className="fw-body">
                  {atom.type === 'genui'
                    ? <GenuiAtom spec={atom.spec} size={atom.size} />
                    : <p className="fw-empty">{ATOMS[atom.type]?.hint ?? 'FullWidget 原生组件'}</p>}
                </div>
              </article>
            </div>
          )
        })}
      </div>
      {state.draft.atoms.length === 0 ? <p className="fw-empty">草稿是空的。</p> : null}
    </div>
  )
}

function Comments({ state, selected, refresh }) {
  const [text, setText] = React.useState('')
  const selectedAtom = state.draft.atoms.find(atom => atom.id === selected)
  const add = async () => {
    if (!text.trim()) return
    try {
      await call('super/comment', { action: 'add', atomId: selected ?? '', text: text.trim() })
      setText('')
      await refresh()
    } catch (error) { toast(error.message, { error: true }) }
  }
  const resolve = async id => {
    try { await call('super/comment', { action: 'resolve', id }); await refresh() } catch (error) { toast(error.message, { error: true }) }
  }
  return (
    <section className="super-comments">
      <header><h3>批注</h3><span>{state.comments.filter(row => row.status === 'open').length} 条未处理</span></header>
      <div className="super-comment-list">
        {state.comments.length === 0 ? <p className="fw-empty">点选组件后写一条批注，它会回到右侧同一条会话。</p> : state.comments.map(row => {
          const atom = state.draft.atoms.find(item => item.id === row.atomId)
          return <div key={row.id} className={`super-comment${row.status === 'resolved' ? ' is-resolved' : ''}`}>
            <div><b>{atom ? nameOf(atom) : '整个工作台'}</b><small>{row.status === 'resolved' ? '已处理' : '待处理'}</small></div>
            <p>{row.text}</p>
            {row.status === 'open' ? <button type="button" className="fw-btn" onClick={() => resolve(row.id)}>标记完成</button> : null}
            <button type="button" className="fw-btn" onClick={async () => { try { await call('super/comment', { action: 'remove', id: row.id }); await refresh() } catch (error) { toast(error.message, { error: true }) } }}>删除</button>
          </div>
        })}
      </div>
      <div className="super-comment-add">
        <label>{selectedAtom ? `批注「${nameOf(selectedAtom)}」` : '批注整个工作台'}</label>
        <textarea value={text} onChange={event => setText(event.target.value)} rows={2} maxLength={500} placeholder="比如：主读数只留一个；会议状态降一级。" />
        <button type="button" className="fw-btn" disabled={!text.trim()} onClick={add}>加入批注</button>
      </div>
    </section>
  )
}

export function SuperDesignView({ useSessions, onExit }) {
  const [state, setState] = React.useState(null)
  const [error, setError] = React.useState('')
  const [preview, setPreview] = React.useState(null)
  const [busy, setBusy] = React.useState(false)
  const [benchName, setBenchName] = React.useState('')
  const [zoom, setZoom] = React.useState(1)

  const refresh = React.useCallback(async () => {
    try { setState(await call('super')); setError('') } catch (reason) { setError(reason.message) }
  }, [])
  React.useEffect(() => { call('super/open').then(setState).catch(reason => setError(reason.message)) }, [])
  React.useEffect(() => {
    const timer = setInterval(() => { if (document.visibilityState === 'visible') refresh() }, 15_000)
    return () => clearInterval(timer)
  }, [refresh])

  const select = async id => {
    if (!state) return
    setState({ ...state, selection: id })
    try { await call('super/select', { atomId: id }) } catch { /* local selection still works */ }
  }
  const ops = async list => {
    if (!state) return
    setBusy(true)
    try { setState(await call('super/ops', { ops: list })); setPreview(null) } catch (reason) { toast(reason.message, { error: true }) } finally { setBusy(false) }
  }
  const setTheme = theme => ops([{ op: 'theme', theme }])
  const selected = state?.selection ?? ''
  const selectedAtom = state?.draft?.atoms?.find(atom => atom.id === selected)
  const applyPreview = async () => {
    if (!preview) return
    const size = preview.size ?? 'm'
    if (selectedAtom?.type === 'genui') await ops([{ op: 'update', id: selectedAtom.id, size, spec: preview.spec }])
    else await ops([{ op: 'add', type: 'genui', size, spec: preview.spec }])
  }
  const publish = async () => {
    if (!state) return
    setBusy(true)
    try {
      const result = await call('super/publish', { baseRevision: state.baseRevision })
      if (!result.ok) { toast(result.error ?? '发布冲突，请先刷新草稿', { error: true }); await refresh(); return }
      setState(result.super)
      toast(`已发布 ${result.applied?.join('、') ?? '工作台草稿'}。`)
    } catch (reason) { toast(reason.message, { error: true }) } finally { setBusy(false) }
  }
  const confirmAsBench = async () => {
    if (!state) return
    setBusy(true)
    try {
      const result = await call('super/publish', { mode: 'new', name: benchName.trim() || `工作台 ${new Date().toLocaleDateString('zh-CN')}` })
      if (!result.ok) { toast(result.error ?? '创建失败', { error: true }); return }
      setState(result.super)
      toast(`已创建新工作台「${result.bench?.name ?? '新工作台'}」，原来的工作台保留。`)
      setBenchName('')
    } catch (reason) { toast(reason.message, { error: true }) } finally { setBusy(false) }
  }
  const reset = async () => {
    if (!window.confirm('用当前正式工作台覆盖草稿？未发布的修改会丢失。')) return
    try { setState(await call('super/reset')) ; setPreview(null) } catch (reason) { toast(reason.message, { error: true }) }
  }

  return (
    <div className="wd-root wd-fw super-page" data-fw-theme={state?.draft?.theme ?? 'instrument'}>
      <style>{pageCss}{fwCss}{creationCss}</style>
      <header className="super-topbar">
        <div><span className="super-kicker">超级创模式 · Super Design</span><h1>先看，再改</h1><p>{state?.stale ? '正式工作台已变化，发布前先刷新草稿。' : '左侧是草稿，右侧是同一条 DSH 会话；确认后才发布。'}</p></div>
        <div className="super-actions">
          <button type="button" className="fw-btn" onClick={() => (onExit ? onExit() : getRootCtx()?.layout?.selectPanel('work-desk'))}>回到工作台</button>
          <button type="button" className="fw-btn" disabled={busy} onClick={reset}>刷新草稿</button>
          <input className="fw-input super-name" aria-label="新工作台名称" value={benchName} onChange={event => setBenchName(event.target.value)} placeholder="新工作台名称" />
          <button type="button" className="fw-btn is-on" disabled={busy || !state} onClick={confirmAsBench}>确认并创建为新工作台</button>
          <button type="button" className="fw-btn" disabled={busy} onClick={publish}>覆盖当前工作台</button>
        </div>
      </header>
      <div className="super-body">
        <main className="super-left">
          <div className="super-toolbar">
            <div className="fw-seg" aria-label="主题">
              {THEMES.map(theme => <button type="button" key={theme.id} aria-pressed={state?.draft?.theme === theme.id} onClick={() => setTheme(theme.id)}>{theme.label}</button>)}
            </div>
            {selectedAtom ? <div className="fw-seg" aria-label="尺寸">
              {Object.entries(SIZES).map(([size, meta]) => <button type="button" key={size} aria-pressed={selectedAtom.size === size} onClick={() => ops([{ op: 'resize', id: selectedAtom.id, size }])}>{meta.label}</button>)}
            </div> : null}
            {selectedAtom ? <div className="fw-seg" aria-label="排序">
              <button type="button" disabled={busy} onClick={() => ops([{ op: 'move', id: selectedAtom.id, to: Math.max(0, (state?.draft?.atoms ?? []).findIndex(atom => atom.id === selectedAtom.id) - 1) }])}>↑</button>
              <button type="button" disabled={busy} onClick={() => ops([{ op: 'move', id: selectedAtom.id, to: Math.min((state?.draft?.atoms ?? []).length - 1, (state?.draft?.atoms ?? []).findIndex(atom => atom.id === selectedAtom.id) + 1) }])}>↓</button>
              <button type="button" disabled={busy} onClick={() => ops([{ op: 'remove', id: selectedAtom.id }])}>移除</button>
            </div> : null}
            {selectedAtom ? <span className="super-selected">选中：{nameOf(selectedAtom)}</span> : <span className="super-selected">未选中组件</span>}
          </div>
          {error ? <p className="fw-hint">草稿读取失败：{error}</p> : null}
          {state ? <SuperCanvas state={state} selected={selected} onSelect={select} /> : <p className="fw-empty">正在打开草稿…</p>}
          {state ? <Comments state={state} selected={selected} refresh={refresh} /> : null}
        </main>
        <aside className="super-right">
          {preview ? <div className="super-preview">
            <header><strong>生成预览</strong><button type="button" className="fw-btn" onClick={() => setPreview(null)}>收起</button></header>
            <div className={`fw-preview-body is-${preview.size ?? 'm'}`}><GenuiAtom spec={preview.spec} size={preview.size ?? 'm'} /></div>
            <button type="button" className="fw-btn" disabled={busy} onClick={applyPreview}>{selectedAtom?.type === 'genui' ? '替换选中卡片' : '加入草稿'}</button>
          </div> : null}
          {state ? <SessionDock useSessions={useSessions} embedded hint={superHint(state, selectedAtom)} onPreview={value => setPreview(value)} /> : <p className="fw-empty">会话读取中…</p>}
        </aside>
      </div>
    </div>
  )
}
