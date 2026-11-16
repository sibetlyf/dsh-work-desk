// dsh-work-desk 浏览器半片：侧栏入口 + main 全局面板。
import React from 'react'
import { CalendarView } from './calendar.jsx'
import { ChatDock } from './chat.jsx'
import { loadDesk, setDesk, setRootCtx, startTicker, undo, useDesk } from './desk.js'
import { WorkbenchView } from './fw/bench.jsx'
import { WorkbenchSettings } from './fw/settings-section.jsx'
import fwCss from './fw/theme.css'
import creationCss from './fw/creation.css'
import { Island } from './island.jsx'
import { MailView } from './mail.jsx'
import { MarketView } from './market.jsx'
import { SettingsDialog } from './settings.jsx'
import { TodayView } from './today.jsx'
import css from './styles.css'
import { FormDialog, Icon, IconButton, Toast } from './ui.jsx'

const PANEL_ID = 'work-desk'

const NAV = [
  { id: 'bench', label: '工作台', icon: 'grid' },
  { id: 'today', label: '今日', icon: 'today' },
  { id: 'calendar', label: '日程', icon: 'calendar' },
  { id: 'mail', label: '邮件', icon: 'mail' },
  { id: 'market', label: '行情', icon: 'chart' },
]

const VIEWS = { bench: WorkbenchView, today: TodayView, calendar: CalendarView, mail: MailView, market: MarketView }

function Alerts() {
  const alerts = useDesk(s => s.alerts)
  const [open, setOpen] = React.useState(false)
  if (!alerts.length) return null
  return (
    <div className="wd-alerts">
      <button type="button" className="wd-bell" aria-label={`${alerts.length} 条提醒`} onClick={() => setOpen(v => !v)}>
        <Icon name="bell" size={16} />
        <i>{alerts.length}</i>
      </button>
      {open ? (
        <div className="wd-alerts-pop" role="dialog" aria-label="提醒">
          {alerts.map((alert, index) => (
            <p key={index} className={`is-${alert.level}`}>
              <Icon name={alert.kind === 'price' ? 'chart' : alert.kind === 'task' ? 'check' : 'clock'} size={12} />
              {alert.text}
            </p>
          ))}
          <button type="button" className="wd-link" onClick={() => { setOpen(false); setDesk({ view: 'today' }) }}>去今日页</button>
        </div>
      ) : null}
    </div>
  )
}

function Shell(props) {
  const ready = useDesk(s => s.ready)
  const error = useDesk(s => s.error)
  const view = useDesk(s => s.view)
  const dockOpen = useDesk(s => s.dockOpen)
  const canUndo = useDesk(s => s.canUndo)
  const rootRef = React.useRef(null)
  const [width, setWidth] = React.useState(1440)
  const narrow = width < 1180
  const compact = width < 820

  React.useEffect(() => {
    loadDesk()
    const stopTicker = startTicker()
    // DSH 对话里的 Agent 也能改工作台；30 秒一轮，页面不可见时不拉，避免看着像一直在刷新
    const reload = setInterval(() => { if (document.visibilityState === 'visible') loadDesk() }, 30_000)
    const onVisible = () => { if (document.visibilityState === 'visible') loadDesk() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      stopTicker()
      clearInterval(reload)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [])

  React.useEffect(() => {
    if (narrow) setDesk({ dockOpen: false })
  }, [narrow])

  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return undefined
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    const onKey = event => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName) || event.target.isContentEditable
      if ((event.metaKey || event.ctrlKey) && event.key === 'z' && !event.shiftKey && !typing && canUndo) {
        event.preventDefault()
        undo()
      }
      if (event.key === '/' && !typing && view === 'mail') {
        event.preventDefault()
        document.querySelector('.wd-search input')?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [canUndo, view])

  const Active = VIEWS[view] ?? TodayView
  // 工作台已经有嵌入式会话栏，不能再挂载第二个 ChatDock。
  const showDock = dockOpen && view !== 'bench'
  return (
    <div className={`wd-root ${narrow ? 'is-narrow' : ''} ${compact ? 'is-compact' : ''} ${showDock ? 'has-dock' : ''}`} ref={rootRef}>
      <style>{css}{fwCss}{creationCss}</style>
      <div className="wd-ambient" aria-hidden="true"><i /><i /><i /></div>
      <div className="wd-main">
        <header className="wd-topbar" data-window-drag="">
          <nav className="wd-nav" aria-label="工作台导航">
            {NAV.map(entry => (
              <button type="button" key={entry.id} className={view === entry.id ? 'is-on' : ''} aria-current={view === entry.id ? 'page' : undefined} onClick={() => setDesk({ view: entry.id })}>
                <Icon name={entry.icon} size={14} />
                <span>{entry.label}</span>
              </button>
            ))}
          </nav>
          <span style={{ flex: 1 }} />
          <Alerts />
          {canUndo ? <IconButton icon="undo" label="撤销上一步" onClick={undo} /> : null}
          <IconButton icon="gear" label="设置" onClick={() => setDesk({ settingsOpen: true })} />
          {showDock || view === 'bench' ? null : <button type="button" className="wd-open-dock" onClick={() => setDesk({ dockOpen: true })}><Icon name="spark" size={14} />助手</button>}
        </header>
        {ready && view !== 'bench' ? <Island /> : null}
        <main className="wd-content" key={view}>
          {error ? (
            <div className="wd-page"><p className="wd-muted">工作台加载失败：{error}</p><button type="button" className="wd-btn" onClick={loadDesk}>重试</button></div>
          ) : ready ? <Active /> : <div className="wd-loading"><span className="wd-shimmer">正在把今天铺开…</span></div>}
        </main>
      </div>
      {ready && showDock ? <ChatDock useSessions={props.useSessions} /> : null}
      <FormDialog />
      {ready ? <SettingsDialog /> : null}
      <Toast />
    </div>
  )
}

export const inject = ['slots']

export function apply(ctx) {
  setRootCtx(ctx)
  ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANEL_ID }, Shell))
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist',
    id: PANEL_ID,
    order: 5,
    label: () => '办公工作台',
  }, ({ size }) => <Icon name="calendar" size={size} />))
  // DSH 设置页里加一节「工作台」：主题、布局 revision、恢复默认，读写的是同一份 Host 布局
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'work-desk-workbench',
    order: 55,
    label: () => '工作台',
  }, WorkbenchSettings))
}
