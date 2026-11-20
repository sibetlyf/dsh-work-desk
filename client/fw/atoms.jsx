// 原子组件：同一个组件在 小 1×1 / 中 2×1 / 大 4×3 下呈现不同信息层级。
// 尺寸是语义档位，不是把同一张卡缩放：小卡只留一个判断，大卡才展开列表和操作。
import React from 'react'
import { fmtMoney, fmtPct, fmtTime, relativeDay, timeUntil, toneOf } from '../util.js'

const MAX = { s: 1, m: 2, l: 5 }

function foot(text, label, onClick) {
  return (
    <footer className="fw-foot">
      <span>{text}</span>
      {label ? <button type="button" onClick={onClick}>{label} ↗</button> : null}
    </footer>
  )
}

function eventsOfDay(state, now) {
  const day = now.toDateString()
  return state.events
    .filter(event => event.status !== 'cancelled' && new Date(event.start).toDateString() === day)
    .sort((a, b) => new Date(a.start) - new Date(b.start))
}

function nextEvent(state, now) {
  return state.events
    .filter(event => event.status !== 'cancelled' && new Date(event.end ?? event.start) > now)
    .sort((a, b) => new Date(a.start) - new Date(b.start))[0]
}

function calendar(atom, ctx) {
  const { state, now, size, openCalendar } = ctx
  const today = eventsOfDay(state, now)
  const next = nextEvent(state, now)
  const upcoming = state.events
    .filter(event => event.status !== 'cancelled' && new Date(event.start) > now && new Date(event.start).toDateString() !== now.toDateString())
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, 3)

  if (size === 's') {
    return (
      <button type="button" className="fw-link" onClick={openCalendar}>
        <div className="fw-hero">
          <span className="fw-display">{now.getDate()}</span>
          <div>
            <strong>{today.length ? `${today.length} 场会议` : '今天没有会'}</strong>
            <small>{next ? `下一场 ${fmtTime(next.start)}` : '日历空着'}</small>
          </div>
        </div>
      </button>
    )
  }
  if (size === 'm') {
    return (
      <button type="button" className="fw-link" onClick={openCalendar}>
        <div className="fw-hero">
          <span className="fw-display">{now.getDate()}</span>
          <div>
            <strong>{next ? next.title : '今天没有安排'}</strong>
            <small>{next ? `${fmtTime(next.start)} · ${timeUntil(next.start, now)}` : `${today.length} 场会议已结束`}</small>
          </div>
        </div>
      </button>
    )
  }
  return (
    <>
      <div className="fw-hero" style={{ flex: 'none', marginBottom: 2 }}>
        <span className="fw-display">{now.getDate()}</span>
        <div>
          <strong>{next ? next.title : '今天没有安排'}</strong>
          <small>{next ? `${fmtTime(next.start)} · ${timeUntil(next.start, now)}` : `共 ${today.length} 场`}</small>
        </div>
      </div>
      <hr className="fw-rule" />
      <div className="fw-list">
        {today.length === 0 ? <p className="fw-empty">今天没有会议。</p> : today.slice(0, 4).map(event => {
          const running = new Date(event.start) <= now && new Date(event.end ?? event.start) > now
          const past = new Date(event.end ?? event.start) <= now
          return (
            <div key={event.id} className={`fw-row ${running ? 'is-now' : ''} ${past ? 'is-muted' : ''}`}>
              <time>{fmtTime(event.start)}</time>
              <span className="fw-dot" />
              <div className="fw-row-main">
                <b>{event.title}</b>
                <small>{event.location || (running ? '进行中' : '')}</small>
              </div>
            </div>
          )
        })}
        {upcoming.length ? <hr className="fw-rule" style={{ margin: '6px 0' }} /> : null}
        {upcoming.map(event => (
          <div key={event.id} className="fw-row">
            <time>{relativeDay(event.start, now)}</time>
            <span className="fw-dot" style={{ background: 'transparent' }} />
            <div className="fw-row-main">
              <b>{event.title}</b>
              <small>{fmtTime(event.start)}</small>
            </div>
          </div>
        ))}
      </div>
      {foot(`${today.length} 场 · 日历`, '打开', openCalendar)}
    </>
  )
}

function tasks(atom, ctx) {
  const { state, size, toggleTask, openToday } = ctx
  const open = state.tasks.filter(task => !task.done)
  const nearest = open.slice().sort((a, b) => (a.due ? new Date(a.due) : Infinity) - (b.due ? new Date(b.due) : Infinity))[0]
  if (size === 's') {
    return (
      <button type="button" className="fw-link" onClick={openToday}>
        <div className="fw-hero">
          <span className="fw-display">{open.length}</span>
          <div>
            <strong>条待办</strong>
            <small>{nearest ? (nearest.due ? `${relativeDay(nearest.due)} ${fmtTime(nearest.due)}` : '没有截止') : '都做完了'}</small>
          </div>
        </div>
      </button>
    )
  }
  if (size === 'm') {
    return (
      <>
        {open.length === 0 ? <p className="fw-empty">都做完了。</p> : open.slice(0, MAX.m).map(task => (
          <div key={task.id} className="fw-row">
            <button type="button" className="fw-check" aria-pressed="false" aria-label={`完成 ${task.title}`} onClick={() => toggleTask(task.id)} />
            <div className="fw-row-main"><b>{task.title}</b></div>
            <span className="fw-label">{task.due ? relativeDay(task.due) : ''}</span>
          </div>
        ))}
      </>
    )
  }
  return (
    <>
      <div className="fw-list">
        {open.length === 0 ? <p className="fw-empty">都做完了。</p> : open.slice(0, MAX.l).map(task => (
          <div key={task.id} className="fw-row">
            <button type="button" className="fw-check" aria-pressed="false" aria-label={`完成 ${task.title}`} onClick={() => toggleTask(task.id)} />
            <div className="fw-row-main"><b>{task.title}</b></div>
            <span className="fw-label">{task.due ? `${relativeDay(task.due)}` : '无截止'}</span>
          </div>
        ))}
      </div>
      {foot(`${open.length} 条未完成`, '全部', openToday)}
    </>
  )
}

function mail(atom, ctx) {
  const { state, size, openMail, mail } = ctx
  const unread = state.mails.filter(row => row.unread)
  const recent = state.mails.slice().sort((a, b) => new Date(b.date) - new Date(a.date))
  const note = mail?.provider === 'dsh-email' ? '本地未查看' : '收件箱'
  if (size === 's') {
    return (
      <button type="button" className="fw-link" onClick={() => openMail(null)}>
        <div className="fw-hero">
          <span className="fw-display">{unread.length}</span>
          <div>
            <strong>{note}</strong>
            <small>{recent[0] ? (recent[0].from?.name || '新邮件') : '没有邮件'}</small>
          </div>
        </div>
      </button>
    )
  }
  const rows = recent.slice(0, size === 'm' ? MAX.m : MAX.l)
  return (
    <>
      <div className="fw-list">
        {rows.length === 0 ? <p className="fw-empty">收件箱是空的。</p> : rows.map(row => (
          <button key={row.id} type="button" className="fw-row fw-row-btn" onClick={() => openMail(row.id)}>
            <span className="fw-dot" style={{ background: row.unread ? undefined : 'transparent' }} />
            <div className="fw-row-main">
              <b>{row.subject || '（无主题）'}</b>
              <small>{row.from?.name || row.from?.address || '未知发件人'}</small>
            </div>
            <span className="fw-label">{relativeDay(row.date)}</span>
          </button>
        ))}
      </div>
      {size === 'l' ? foot(`${unread.length} 封本地未查看 · ${note}`, '打开邮件', () => openMail(null)) : null}
    </>
  )
}

function quotes(atom, ctx) {
  const { state, quotes, size, openMarket } = ctx
  const rows = state.watchlist.map(row => ({ ...row, quote: quotes[row.code] })).filter(row => row.quote)
  if (size === 's') {
    const first = rows[0]
    if (!first) return <p className="fw-empty">还没有自选。</p>
    return (
      <button type="button" className="fw-link" onClick={openMarket}>
        <div className="fw-hero">
          <span className="fw-display">{first.quote.price}</span>
          <div>
            <strong>{first.quote.name || first.name || first.code}</strong>
            <small className={toneOf(first.quote.changePct)}>{fmtPct(first.quote.changePct)}</small>
          </div>
        </div>
      </button>
    )
  }
  return (
    <>
      <div className="fw-list">
        {rows.length === 0 ? <p className="fw-empty">还没有自选。</p> : rows.slice(0, size === 'm' ? MAX.m : MAX.l).map(row => (
          <div key={row.code} className="fw-quote">
            <span className="fw-quote-name">{row.quote.name || row.name || row.code}</span>
            <span className="fw-num">{fmtMoney(row.quote.price, 2)}</span>
            <span className={`fw-pct ${toneOf(row.quote.changePct)}`}>{fmtPct(row.quote.changePct)}</span>
          </div>
        ))}
      </div>
      {size === 'l' ? foot(`${rows.length} 只自选 · 示意行情`, '行情页', openMarket) : null}
    </>
  )
}

function brief(atom, ctx) {
  const { state, size, openToday } = ctx
  const data = state.brief
  if (!data) {
    return <p className="fw-empty">还没有晨报。到今日页生成一份，把今天的会议、邮件和行情读成一段话。</p>
  }
  const lines = String(data.text || '').split('\n').filter(line => line.trim())
  const title = lines[0]?.replace(/^#+\s*/, '') || '今天先做什么'
  const body = lines.slice(1).join('\n') || lines[0]
  const clip = size === 's' ? 2 : size === 'm' ? 3 : 8
  return (
    <>
      <div className="fw-brief" style={{ '--fw-lines': clip }}>
        {size === 'l' ? <h3>{title}</h3> : null}
        <p className="fw-clamp">{size === 'l' ? body : lines.join(' ')}</p>
      </div>
      {size === 'l' ? foot(`${data.engine === 'local' ? '模板拼装' : '模型生成'} · ${fmtTime(data.createdAt)}`, '今日页', openToday) : null}
      {size === 's' ? <span className="fw-label">{data.engine === 'local' ? '模板' : '生成'}</span> : null}
    </>
  )
}

function alerts(atom, ctx) {
  const { alerts, size, openToday } = ctx
  if (!alerts?.length) return <p className="fw-empty">没有需要提醒的事。</p>
  if (size === 's') {
    return (
      <button type="button" className="fw-link" onClick={openToday}>
        <div className="fw-hero">
          <span className="fw-display">{alerts.length}</span>
          <div><strong>条提醒</strong><small>{alerts[0].text.slice(0, 6)}</small></div>
        </div>
      </button>
    )
  }
  return (
    <>
      <div className="fw-list">
        {alerts.slice(0, size === 'm' ? MAX.m : 6).map((alert, index) => (
          <div key={index} className="fw-row">
            <span className="fw-dot" style={{ background: alert.level === 'down' ? 'var(--fw-accent)' : undefined }} />
            <div className="fw-row-main"><b>{alert.text}</b></div>
          </div>
        ))}
      </div>
      {size === 'l' ? foot(`${alerts.length} 条 · 来自日程与行情`, '今日页', openToday) : null}
    </>
  )
}

function clock(atom, ctx) {
  const { now, size } = ctx
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()]
  const dayOfYear = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(now.getFullYear(), 0, 1)) / 864e5) + 1
  const percent = Math.round(((now.getHours() * 60 + now.getMinutes()) / 1440) * 100)
  if (size === 's') {
    return <div className="fw-hero"><span className="fw-display" style={{ fontSize: 30 }}>{time}</span></div>
  }
  return (
    <>
      <div className="fw-hero" style={{ flex: 'none' }}>
        <span className="fw-display">{time}</span>
        <div>
          <strong>{`${now.getMonth() + 1} 月 ${now.getDate()} 日`}</strong>
          <small>{weekday}</small>
        </div>
      </div>
      {size === 'l' ? (
        <>
          <hr className="fw-rule" />
          <div className="fw-label">第 {dayOfYear} 天 · 今天已过 {percent}%</div>
          <div className="fw-track" aria-hidden="true"><i style={{ width: `${percent}%` }} /></div>
        </>
      ) : null}
    </>
  )
}

function next(atom, ctx) {
  const { state, now, size, openCalendar } = ctx
  const event = nextEvent(state, now)
  if (!event) return <p className="fw-empty">接下来没有安排。</p>
  if (size === 's') {
    return (
      <button type="button" className="fw-link" onClick={openCalendar}>
        <div className="fw-hero"><span className="fw-display" style={{ fontSize: 26 }}>{fmtTime(event.start)}</span></div>
      </button>
    )
  }
  return (
    <>
      <div className="fw-hero" style={{ flex: 'none' }}>
        <span className="fw-display" style={{ fontSize: 28 }}>{fmtTime(event.start)}</span>
        <div>
          <strong>{event.title}</strong>
          <small>{timeUntil(event.start, now)}{event.location ? ` · ${event.location}` : ''}</small>
        </div>
      </div>
      {size === 'l' ? (
        <>
          <hr className="fw-rule" />
          <div className="fw-list">
            {state.events
              .filter(row => row.status !== 'cancelled' && new Date(row.start) > new Date(event.start))
              .sort((a, b) => new Date(a.start) - new Date(b.start))
              .slice(0, 3)
              .map(row => (
                <div key={row.id} className="fw-row">
                  <time>{relativeDay(row.start, now)}</time>
                  <div className="fw-row-main"><b>{row.title}</b><small>{fmtTime(row.start)}</small></div>
                </div>
              ))}
          </div>
        </>
      ) : null}
      {size === 'l' ? foot('接下来的安排', '日历', openCalendar) : null}
    </>
  )
}

function quick(atom, ctx) {
  const { size, openToday, openCalendar, openMail, openMarket } = ctx
  const entries = [
    ['今日', openToday], ['日程', openCalendar], ['邮件', openMail], ['行情', openMarket],
  ]
  if (size === 's') {
    return (
      <div className="fw-list" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, alignContent: 'center' }}>
        {entries.map(([label, action]) => (
          <button key={label} type="button" className="fw-btn" style={{ height: 26, padding: 0, fontSize: 10.5 }} onClick={() => action(null)}>{label}</button>
        ))}
      </div>
    )
  }
  return (
    <>
      <div className="fw-list" style={{ justifyContent: 'center', gap: 6 }}>
        {entries.map(([label, action]) => (
          <button key={label} type="button" className="fw-btn" style={{ textAlign: 'left' }} onClick={() => action(null)}>{label} ↗</button>
        ))}
      </div>
      {size === 'l' ? foot('四个页面仍在，工作台是新的入口', '', null) : null}
    </>
  )
}



/** 会议助手：把「马上要开的会」和「会前待办」放在一起，状态取不到就只说原因。 */
function meeting(atom, ctx) {
  const { size, sources, openToday, openCalendar } = ctx
  const assistant = sources?.meeting
  const desk = sources?.desk?.value ?? {}
  const next = desk.nextEvents ?? []
  const tasks = desk.dueTasks ?? []
  const please = Number(desk.openTasks ?? 0)
  const state = !assistant ? '读取中' : !assistant.available ? '不可用' : (assistant.value?.running ? '正在听' : '未运行')
  const live = assistant?.available ? (assistant.value?.capturing ? '采集中' : '未采集') : '—'
  const nextEvent = next[0]
  const until = nextEvent ? (nextEvent.running ? '进行中' : nextEvent.minutesUntil <= 0 ? '马上开始' : `${nextEvent.minutesUntil} 分钟后`) : '接下来没有会'

  if (size === 's') {
    return (
      <button type="button" className="fw-link" onClick={openCalendar}>
        <div className="fw-hero">
          <span className="fw-display" style={{ fontSize: 26 }}>{nextEvent ? fmtTime(nextEvent.start) : '—'}</span>
          <div>
            <strong>{nextEvent ? nextEvent.title : '没有会'}</strong>
            <small>{nextEvent ? until : `${please} 条待办`}</small>
          </div>
        </div>
      </button>
    )
  }

  if (size === 'm') {
    return (
      <>
        {next.length === 0 ? <p className="fw-empty">接下来没有会。</p> : next.slice(0, 2).map(event => (
          <div key={event.id} className={`fw-row ${event.running ? 'is-now' : ''}`}>
            <time>{fmtTime(event.start)}</time>
            <div className="fw-row-main"><b>{event.title}</b></div>
            <span className="fw-label">{event.running ? '进行中' : `${event.minutesUntil} 分钟`}</span>
          </div>
        ))}
        <footer className="fw-foot">
          <span>{`助手 ${state} · ${live}`}</span>
          <button type="button" onClick={openToday}>{`待办 ${please} 条`} ↗</button>
        </footer>
      </>
    )
  }

  return (
    <>
      <div className="fw-hero" style={{ flex: 'none' }}>
        <span className="fw-display" style={{ fontSize: 30 }}>{next.length}</span>
        <div>
          <strong>{nextEvent ? nextEvent.title : '接下来没有会'}</strong>
          <small>{`${until}${nextEvent?.location ? ` · ${nextEvent.location}` : ''} · 助手 ${state}`}</small>
        </div>
      </div>
      <hr className="fw-rule" />
      <div className="fw-list">
        {next.length === 0 ? <p className="fw-empty">今天之后没有安排。</p> : next.slice(0, 4).map(event => (
          <div key={event.id} className={`fw-row ${event.running ? 'is-now' : ''}`}>
            <time>{fmtTime(event.start)}</time>
            <span className="fw-dot" />
            <div className="fw-row-main">
              <b>{event.title}</b>
              <small>{event.running ? '进行中' : `${relativeDay(event.start, ctx.now)} · ${event.minutesUntil} 分钟后`}{event.location ? ` · ${event.location}` : ''}</small>
            </div>
          </div>
        ))}
        {tasks.length ? <hr className="fw-rule" style={{ margin: '6px 0' }} /> : null}
        {tasks.slice(0, 3).map(task => (
          <div key={task.id} className="fw-row">
            <span className="fw-dot" style={{ background: 'transparent' }} />
            <div className="fw-row-main"><b>{task.title}</b><small>待办{task.due ? ` · ${relativeDay(task.due, ctx.now)}` : ''}</small></div>
          </div>
        ))}
      </div>
      {foot(
        assistant?.available
          ? `监听 ${assistant.value?.heard ?? 0} · 触发 ${assistant.value?.triggered ?? 0} · 播报 ${assistant.value?.spoken ?? 0}`
          : `会议助手：${assistant?.reason ?? '读取中'}`,
        '日历',
        openCalendar,
      )}
    </>
  )
}

import image from './image-atom.jsx'
import { CodeFrame } from './code-frame.jsx'

function codeAtom(atom, ctx) {
  const config = atom.config ?? {}
  if (!config.code) return <p className="fw-empty">这个代码组件还没有内容。</p>
  return <CodeFrame code={config.code} data={ctx.sources} theme={ctx.theme ?? 'instrument'} title={config.title ?? '代码组件'} />
}

const RENDERERS = { calendar, tasks, mail, quotes, brief, alerts, clock, next, quick, meeting, image, code: codeAtom }

/** 渲染一个原子实例。 */
export function renderAtom(atom, ctx) {
  const render = RENDERERS[atom.type]
  if (!render) return <p className="fw-empty">未知组件：{atom.type}</p>
  return render(atom, { ...ctx, size: atom.size })
}
