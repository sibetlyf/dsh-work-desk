// 灵动岛骨架：收起是一行胶囊，展开是 2×2 原子栅格。
// 这一版只做形态验证——原子数据仍然来自工作台 store，原子注册表留到 M0。
import React from 'react'
import { setDesk, useDesk } from './desk.js'
import { Icon } from './ui.jsx'
import { fmtMoney, fmtTime, timeUntil } from './util.js'

function minutesTo(iso, now) {
  return Math.max(0, Math.round((new Date(iso) - now) / 60000))
}

export function Island() {
  const state = useDesk(s => s.state)
  const quotes = useDesk(s => s.quotes)
  const [open, setOpen] = React.useState(false)
  if (!state) return null

  const now = new Date()
  const events = state.events.filter(event => event.status !== 'cancelled' && new Date(event.end ?? event.start) > now).sort((a, b) => new Date(a.start) - new Date(b.start))
  const next = events[0] ?? null
  const tasks = state.tasks.filter(task => !task.done)
  const unread = state.mails.filter(mail => mail.unread)
  const watch = state.watchlist.map(row => ({ ...row, quote: quotes[row.code] })).filter(row => row.quote)
  const head = watch[0] ?? null

  const items = [
    next ? { key: 'next', icon: 'clock', text: `${fmtTime(next.start)} ${next.title}`, hint: minutesTo(next.start, now) > 0 ? `${timeUntil(next.start, now)}` : '进行中' } : null,
    tasks.length ? { key: 'task', icon: 'check', text: `${tasks.length} 条待办`, hint: tasks[0].title } : null,
    unread.length ? { key: 'mail', icon: 'mail', text: `${unread.length} 封未读`, hint: unread[0].subject } : null,
    head ? { key: 'quote', icon: 'chart', text: `${head.quote.name} ${head.quote.price}`, hint: `${head.quote.changePct >= 0 ? '+' : ''}${Number(head.quote.changePct).toFixed(2)}%` } : null,
  ].filter(Boolean)

  return (
    <div className={`wd-island ${open ? 'is-open' : ''}`} aria-label="灵动岛">
      <div className="wd-island-pill">
        <span className="wd-island-live" aria-hidden="true" />
        {items.slice(0, 2).map(item => (
          <span key={item.key} className="wd-island-item">
            <Icon name={item.icon} size={12} />
            <b>{item.text}</b>
            <small>{item.hint}</small>
          </span>
        ))}
        <button type="button" className="wd-island-toggle" onClick={() => setOpen(value => !value)} aria-expanded={open}>
          <Icon name={open ? 'chevU' : 'chevD'} size={13} />
          {open ? '收起' : '展开'}
        </button>
      </div>

      {open ? (
        <div className="wd-island-grid">
          <section className="wd-island-atom is-2x2">
            <header><h3>下一件</h3><span>{events.length} 个会</span></header>
            <ul>
              {events.slice(0, 3).map(event => (
                <li key={event.id}>
                  <b>{fmtTime(event.start)}</b>
                  <span>{event.title}</span>
                  <small>{minutesTo(event.start, now) > 0 ? timeUntil(event.start, now) : '进行中'}</small>
                </li>
              ))}
              {events.length === 0 ? <li className="is-empty">接下来没有安排</li> : null}
            </ul>
          </section>

          <section className="wd-island-atom is-2x2">
            <header><h3>待办</h3><span>{tasks.length} 条</span></header>
            <ul>
              {tasks.slice(0, 3).map(task => (
                <li key={task.id}>
                  <b>{task.title}</b>
                  <small>{task.due ? fmtTime(task.due) : '无截止'}</small>
                </li>
              ))}
              {tasks.length === 0 ? <li className="is-empty">都做完了</li> : null}
            </ul>
            <button type="button" className="wd-island-link" onClick={() => setDesk({ view: 'today' })}>打开今日<Icon name="arrow" size={11} /></button>
          </section>

          <section className="wd-island-atom is-2x2">
            <header><h3>未读</h3><span>{unread.length} 封</span></header>
            <ul>
              {unread.slice(0, 3).map(mail => (
                <li key={mail.id}>
                  <b>{mail.from?.name || mail.from?.address}</b>
                  <span>{mail.subject}</span>
                </li>
              ))}
              {unread.length === 0 ? <li className="is-empty">没有未读</li> : null}
            </ul>
            <button type="button" className="wd-island-link" onClick={() => setDesk({ view: 'mail' })}>去邮件<Icon name="arrow" size={11} /></button>
          </section>

          <section className="wd-island-atom is-2x2">
            <header><h3>自选</h3><span>{watch.length} 只</span></header>
            <ul className="is-quotes">
              {watch.slice(0, 4).map(row => (
                <li key={row.code}>
                  <b>{row.quote.name}</b>
                  <span className={row.quote.changePct >= 0 ? 'is-up' : 'is-down'}>{fmtMoney(row.quote.price, 2)}</span>
                  <small className={row.quote.changePct >= 0 ? 'is-up' : 'is-down'}>
                    {row.quote.changePct >= 0 ? '+' : ''}{Number(row.quote.changePct).toFixed(2)}%
                  </small>
                </li>
              ))}
              {watch.length === 0 ? <li className="is-empty">还没有自选</li> : null}
            </ul>
          </section>
        </div>
      ) : null}
    </div>
  )
}
