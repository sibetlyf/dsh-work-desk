// 今日：一眼看完今天要做的事。左边是议程，右边是晨报、要回的邮件和待办。
import React from 'react'
import { dispatchOps, generateBrief, openMail, setDesk, useDesk } from './desk.js'
import { Icon, IconButton, Empty, Tag } from './ui.jsx'
import {
  WEEK_LABELS, briefToLines, dayKey, fmtMoney, fmtPct, fmtTime, minutesOfDay, relativeDay,
  timeUntil, toLocalInput, toneOf,
} from './util.js'

function openNewEvent(initial = {}) {
  const start = initial.start ?? (() => {
    const d = new Date()
    d.setMinutes(Math.ceil((d.getMinutes() + 30) / 15) * 15, 0, 0)
    return d
  })()
  setDesk({
    dialog: {
      title: '新建日程',
      submitLabel: '加到日历',
      initial: { title: '', start: toLocalInput(start), minutes: 30, location: '' },
      fields: [
        { name: 'title', label: '主题', required: true, placeholder: '产品周会' },
        { name: 'start', label: '开始', type: 'datetime-local', required: true },
        { name: 'minutes', label: '时长（分钟）', type: 'number' },
        { name: 'location', label: '地点', placeholder: '会议室 / 线上链接' },
      ],
      onSubmit: values => {
        const startAt = new Date(values.start)
        const minutes = Math.max(5, Number(values.minutes) || 30)
        dispatchOps([{
          op: 'add_event',
          title: values.title,
          start: startAt.toISOString(),
          end: new Date(startAt.getTime() + minutes * 60000).toISOString(),
          location: values.location ?? '',
        }], { label: '新建日程' })
      },
    },
  })
}

function BriefText({ text }) {
  const lines = briefToLines(text)
  return (
    <div className="wd-brief">
      {lines.map((line, index) => {
        if (/^###\s+/.test(line)) return <h4 key={index}>{line.replace(/^###\s+/, '')}</h4>
        if (/^[-·]\s+/.test(line)) return <p key={index} className="wd-brief-li">{line.replace(/^[-·]\s+/, '')}</p>
        return <p key={index}>{line}</p>
      })}
    </div>
  )
}

function Agenda({ events, now }) {
  const today = events.filter(event => dayKey(event.start) === dayKey(now) && event.status !== 'cancelled')
  const timed = today.filter(event => !event.allDay).sort((a, b) => new Date(a.start) - new Date(b.start))
  const current = timed.find(event => new Date(event.start) <= now && new Date(event.end) > now)
  return (
    <section className="wd-card wd-agenda">
      <header className="wd-card-head">
        <h2>今天的议程</h2>
        <span className="wd-card-meta">{timed.length ? `${timed.length} 个会` : '没有会议'}</span>
        <span style={{ flex: 1 }} />
        <IconButton icon="plus" label="新建日程" onClick={() => openNewEvent()} />
      </header>
      <div className="wd-agenda-body">
        {timed.length === 0 ? (
          <Empty title="今天没有被约满" hint="留出来的整块时间，适合做需要连续注意力的事。" action={<button type="button" className="wd-btn is-small" onClick={() => openNewEvent()}>加一个日程</button>} />
        ) : timed.map(event => {
          const running = current?.id === event.id
          const done = new Date(event.end) <= now
          return (
            <article key={event.id} className={`wd-event ${running ? 'is-running' : ''} ${done ? 'is-past' : ''} tone-${event.color ?? 'blue'}`}>
              <div className="wd-event-time">
                <b>{fmtTime(event.start)}</b>
                <small>{fmtTime(event.end)}</small>
              </div>
              <div className="wd-event-bar" aria-hidden="true" />
              <div className="wd-event-main">
                <h3>{event.title}</h3>
                <p>
                  {event.location ? <span>{event.location}</span> : null}
                  {event.attendees?.length ? <span>{event.attendees.join('、')}</span> : null}
                  {event.status === 'tentative' ? <Tag tone="amber">待定</Tag> : null}
                  {running ? <Tag tone="green">进行中</Tag> : done ? null : <span className="wd-muted">{timeUntil(event.start, now)}</span>}
                </p>
              </div>
              <IconButton icon="edit" label="编辑" onClick={() => editEvent(event)} />
            </article>
          )
        })}
      </div>
      {current ? (
        <footer className="wd-agenda-foot">
          <Icon name="clock" size={13} />
          现在进行：{current.title}，还有 {Math.max(0, Math.round((new Date(current.end) - now) / 60000))} 分钟
        </footer>
      ) : null}
    </section>
  )
}

export function editEvent(event) {
  setDesk({
    dialog: {
      title: '编辑日程',
      submitLabel: '保存',
      initial: { title: event.title, start: toLocalInput(event.start), minutes: Math.max(5, Math.round((new Date(event.end) - new Date(event.start)) / 60000)), location: event.location ?? '', notes: event.notes ?? '' },
      fields: [
        { name: 'title', label: '主题', required: true },
        { name: 'start', label: '开始', type: 'datetime-local', required: true },
        { name: 'minutes', label: '时长（分钟）', type: 'number' },
        { name: 'location', label: '地点' },
        { name: 'notes', label: '备注', type: 'textarea', rows: 3 },
      ],
      onSubmit: values => {
        const startAt = new Date(values.start)
        const minutes = Math.max(5, Number(values.minutes) || 30)
        dispatchOps([{
          op: 'update_event', id: event.id, title: values.title, start: startAt.toISOString(),
          end: new Date(startAt.getTime() + minutes * 60000).toISOString(), location: values.location ?? '', notes: values.notes ?? '',
        }], { label: '修改日程' })
      },
      onDelete: () => dispatchOps([{ op: 'delete_event', id: event.id }], { label: `删除「${event.title.slice(0, 10)}」` }),
    },
  })
}

function NeedsReply({ mails }) {
  return (
    <section className="wd-card">
      <header className="wd-card-head">
        <h2>需要你回</h2>
        <span className="wd-card-meta">{mails.length ? `${mails.length} 封` : '清空了'}</span>
        <span style={{ flex: 1 }} />
        <button type="button" className="wd-link" onClick={() => setDesk({ view: 'mail' })}>全部邮件</button>
      </header>
      {mails.length === 0 ? (
        <p className="wd-card-empty">
          还没有邮件。<button type="button" className="wd-link" onClick={() => setDesk({ settingsOpen: true })}>去接一个真实邮箱</button>
        </p>
      ) : (
        <ul className="wd-mail-mini">
          {mails.slice(0, 4).map(mail => (
            <li key={mail.id}>
              <button type="button" onClick={() => openMail(mail.id)}>
                <span className="wd-dot" />
                <span className="wd-mail-mini-main">
                  <b>{mail.from?.name || mail.from?.address}</b>
                  <span>{mail.subject}</span>
                </span>
                <time>{relativeDay(mail.date)}</time>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Tasks({ tasks }) {
  const open = tasks.filter(task => !task.done)
  const done = tasks.filter(task => task.done).slice(0, 3)
  return (
    <section className="wd-card">
      <header className="wd-card-head">
        <h2>待办</h2>
        <span className="wd-card-meta">{open.length ? `${open.length} 条` : '都做完了'}</span>
        <span style={{ flex: 1 }} />
        <IconButton icon="plus" label="加待办" onClick={() => addTask()} />
      </header>
      <ul className="wd-tasks">
        {[...open, ...done].map(task => (
          <li key={task.id} className={task.done ? 'is-done' : ''}>
            <button type="button" className="wd-check" aria-label={task.done ? '标记未完成' : '标记完成'} onClick={() => dispatchOps([{ op: 'toggle_task', id: task.id }], { label: '更新待办', silent: true })}>
              {task.done ? <Icon name="check" size={11} stroke={2.6} /> : null}
            </button>
            <span className="wd-task-title">{task.title}</span>
            {task.due ? <time className={new Date(task.due) < new Date() && !task.done ? 'is-overdue' : ''}>{relativeDay(task.due)} {fmtTime(task.due)}</time> : null}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function addTask(initial = {}) {
  setDesk({
    dialog: {
      title: '新建待办',
      submitLabel: '记下',
      initial: { title: '', due: '', priority: '0', ...initial },
      fields: [
        { name: 'title', label: '内容', required: true, placeholder: '回周舟的改版意见' },
        { name: 'due', label: '截止', type: 'datetime-local' },
        { name: 'priority', label: '优先级', type: 'select', options: [{ value: '0', label: '普通' }, { value: '1', label: '重要' }, { value: '2', label: '今天必须' }] },
      ],
      onSubmit: values => dispatchOps([{
        op: 'add_task', title: values.title,
        due: values.due ? new Date(values.due).toISOString() : null,
        priority: Number(values.priority) || 0,
      }], { label: '新建待办' }),
    },
  })
}

function Upcoming({ events, now }) {
  const list = events
    .filter(event => event.status !== 'cancelled' && new Date(event.start) > now && dayKey(event.start) !== dayKey(now))
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, 5)
  return (
    <section className="wd-card">
      <header className="wd-card-head">
        <h2>接下来</h2>
        <span className="wd-card-meta">{list.length ? `未来 ${list.length} 件` : '空的'}</span>
        <span style={{ flex: 1 }} />
        <button type="button" className="wd-link" onClick={() => setDesk({ view: 'calendar' })}>打开日历</button>
      </header>
      {list.length === 0 ? <p className="wd-card-empty">接下来几天还没有安排。</p> : (
        <ul className="wd-upcoming">
          {list.map(event => (
            <li key={event.id}>
              <time>
                <b>{relativeDay(event.start, now)}</b>
                {fmtTime(event.start)}
              </time>
              <span className={`wd-upcoming-dot tone-${event.color ?? 'blue'}`} aria-hidden="true" />
              <button type="button" className="wd-upcoming-title" onClick={() => editEvent(event)}>{event.title}</button>
              {event.status === 'tentative' ? <Tag tone="amber">待定</Tag> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Holdings({ positions, quotes }) {
  if (!positions.length) return null
  const rows = positions.map(row => {
    const price = quotes[row.code]?.price ?? null
    const value = price === null ? null : price * row.shares
    const pnl = price === null ? null : (price - row.cost) * row.shares
    return { ...row, price, value, pnl }
  })
  const total = rows.reduce((sum, row) => sum + (row.pnl ?? 0), 0)
  return (
    <section className="wd-card">
      <header className="wd-card-head">
        <h2>持仓</h2>
        <span className={`wd-card-meta ${toneOf(total)}`}>{total >= 0 ? '+' : ''}{fmtMoney(total, 0)}</span>
        <span style={{ flex: 1 }} />
        <button type="button" className="wd-link" onClick={() => setDesk({ view: 'market' })}>行情</button>
      </header>
      <ul className="wd-holdings">
        {rows.map(row => (
          <li key={row.id}>
            <span>{row.name}</span>
            <b>{row.price ?? '—'}</b>
            <em className={toneOf(row.pnl)}>{row.pnl === null ? '—' : `${row.pnl >= 0 ? '+' : ''}${fmtMoney(row.pnl, 0)}`}</em>
          </li>
        ))}
      </ul>
    </section>
  )
}

function MarketStrip({ rows, onOpen }) {
  if (!rows.length) return null
  return (
    <section className="wd-strip" aria-label="自选行情">
      <span className="wd-strip-label"><Icon name="chart" size={14} />自选</span>
      <div className="wd-strip-list">
        {rows.map(row => (
          <button key={row.code} type="button" className={`wd-strip-item ${toneOf(row.quote?.changePct)}`} onClick={() => onOpen(row.code)}>
            <span className="wd-strip-name">{row.quote?.name ?? row.name}</span>
            <b>{row.quote?.price ?? '—'}</b>
            <small>{fmtPct(row.quote?.changePct)}</small>
          </button>
        ))}
      </div>
      <button type="button" className="wd-link" onClick={() => setDesk({ view: 'market' })}>行情页</button>
    </section>
  )
}

export function TodayView() {
  const state = useDesk(s => s.state)
  const quotes = useDesk(s => s.quotes)
  const brief = useDesk(s => s.brief)
  const tick = useDesk(s => s.tick)
  const [busy, setBusy] = React.useState(false)
  const now = React.useMemo(() => new Date(), [tick])
  const events = state.events
  const tasks = state.tasks
  const todayEvents = events.filter(event => dayKey(event.start) === dayKey(now) && event.status !== 'cancelled')
  const openTasks = tasks.filter(task => !task.done)
  const needsReply = state.mails.filter(mail => mail.unread && !mail.sent).sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
  const next = todayEvents.filter(event => new Date(event.end) > now && !event.allDay).sort((a, b) => new Date(a.start) - new Date(b.start))[0]
  const watch = state.watchlist.map(row => ({ ...row, quote: quotes[row.code] }))

  return (
    <div className="wd-page wd-today">
      <header className="wd-hero">
        <p className="wd-hero-date">{now.getFullYear()} · {now.getMonth() + 1} 月 {now.getDate()} 日 · {WEEK_LABELS[(now.getDay() + 6) % 7]}</p>
        <h1 className="wd-hero-line">
          今天 <b>{todayEvents.length}</b> 个会，<b>{openTasks.length}</b> 条待办，<b>{needsReply.length}</b> 封未读。
        </h1>
        {next ? (
          <p className="wd-hero-next">
            <Icon name="clock" size={14} />
            {new Date(next.start) <= now ? '正在进行：' : '下一件：'}<b>{fmtTime(next.start)}</b> {next.title}
            <span className="wd-muted">
              · {new Date(next.start) <= now ? `还有 ${Math.max(0, Math.round((new Date(next.end) - now) / 60000))} 分钟` : timeUntil(next.start, now)}
            </span>
          </p>
        ) : todayEvents.length ? <p className="wd-hero-next">今天的会议都结束了。</p> : <p className="wd-hero-next">今天没有安排，适合推进一件重要的事。</p>}
        <div className="wd-hero-actions">
          <button type="button" className="wd-btn is-primary" disabled={busy} onClick={async () => { setBusy(true); await generateBrief(); setBusy(false) }}>
            <Icon name="spark" size={14} />{busy ? '正在写…' : brief ? '重新生成晨报' : '生成晨报'}
          </button>
          <button type="button" className="wd-btn" onClick={() => openNewEvent()}><Icon name="calendar" size={14} />新建日程</button>
          <button type="button" className="wd-btn" onClick={() => setDesk({ view: 'mail', composer: { to: '', cc: '', subject: '', text: '' } })}><Icon name="mail" size={14} />写邮件</button>
        </div>
      </header>

      <div className="wd-today-grid">
        <div className="wd-today-left">
          <Agenda events={events} now={now} />
          <section className="wd-card wd-brief-card">
            <header className="wd-card-head">
              <h2>晨报</h2>
              {brief ? <span className="wd-card-meta">{brief.engine === 'local' ? '模板拼装' : '模型生成'} · {fmtTime(brief.createdAt)}</span> : null}
            </header>
            {brief ? <BriefText text={brief.text} /> : <p className="wd-card-empty">还没有晨报。点上面的「生成晨报」，把今天的会、邮件和行情读成一段话。</p>}
          </section>
          <Upcoming events={state.events} now={now} />
        </div>
        <div className="wd-today-right">
          <NeedsReply mails={needsReply} />
          <Tasks tasks={tasks} />
          <Holdings positions={state.positions} quotes={quotes} />
        </div>
      </div>

      <MarketStrip rows={watch} onOpen={code => setDesk({ view: 'market', minuteCode: code })} />
    </div>
  )
}
