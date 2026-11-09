// 日程：周视图为主（办公看周比看月有用），月视图做全局感。
// 会议可以拖动改时间，空白处点一下就按那个时间新建。
import React from 'react'
import { dispatchOps, exportIcs, importIcs, setDesk, useDesk } from './desk.js'
import { Icon, IconButton, Segmented, Empty, Tag } from './ui.jsx'
import { addTask, editEvent } from './today.jsx'
import {
  MONTHS, WEEK_LABELS, addDays, atMinutes, dayKey, fmtDate, fmtTime, layoutDay, minutesOfDay,
  startOfDay, startOfWeek, timeUntil, toLocalInput,
} from './util.js'

const START_HOUR = 8
const END_HOUR = 21
const PX_PER_MIN = 1.05
const BODY_HEIGHT = (END_HOUR - START_HOUR) * 60 * PX_PER_MIN

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function newEventAt(day, minutes) {
  const start = atMinutes(day, minutes)
  setDesk({
    dialog: {
      title: '新建日程',
      submitLabel: '加到日历',
      initial: { title: '', start: toLocalInput(start), minutes: 45, location: '' },
      fields: [
        { name: 'title', label: '主题', required: true, placeholder: '和设计对一下改版稿' },
        { name: 'start', label: '开始', type: 'datetime-local', required: true },
        { name: 'minutes', label: '时长（分钟）', type: 'number' },
        { name: 'location', label: '地点' },
      ],
      onSubmit: values => {
        const startAt = new Date(values.start)
        const span = Math.max(5, Number(values.minutes) || 45)
        dispatchOps([{
          op: 'add_event', title: values.title, start: startAt.toISOString(),
          end: new Date(startAt.getTime() + span * 60000).toISOString(), location: values.location ?? '',
        }], { label: '新建日程' })
      },
    },
  })
}

function WeekGrid({ weekStart: monday, events, now }) {
  const bodyRef = React.useRef(null)
  const dragRef = React.useRef(null)
  const [, force] = React.useReducer(v => v + 1, 0)
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i))
  const todayKey = dayKey(now)
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

  const byDay = React.useMemo(() => {
    const map = new Map()
    for (const day of days) {
      const key = dayKey(day)
      const list = events.filter(event => event.status !== 'cancelled' && dayKey(event.start) === key)
      map.set(key, layoutDay(list))
    }
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, monday])

  const topFor = value => (minutesOfDay(value) - START_HOUR * 60) * PX_PER_MIN
  const heightFor = (start, end) => Math.max(20, ((new Date(end) - new Date(start)) / 60000) * PX_PER_MIN - 2)

  const onSlotClick = (event, day) => {
    if (event.target.closest('.wd-cal-event')) return
    const rect = bodyRef.current.getBoundingClientRect()
    const minutes = clamp(Math.round((((event.clientY - rect.top) / PX_PER_MIN) + START_HOUR * 60) / 15) * 15, START_HOUR * 60, END_HOUR * 60 - 15)
    newEventAt(day, minutes)
  }

  const startDrag = (pointer, item) => {
    if (pointer.button !== 0) return
    pointer.stopPropagation()
    const rect = bodyRef.current.getBoundingClientRect()
    const span = new Date(item.end) - new Date(item.start)
    dragRef.current = { id: item.id, dayIndex: days.findIndex(day => dayKey(day) === dayKey(item.start)), minutes: minutesOfDay(item.start), moved: false, span, startX: pointer.clientX, startY: pointer.clientY }
    const move = e => {
      const drag = dragRef.current
      if (!drag) return
      if (!drag.moved && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < 4) return
      drag.moved = true
      drag.dayIndex = clamp(Math.floor((e.clientX - rect.left) / (rect.width / 7)), 0, 6)
      drag.minutes = clamp(Math.round((((e.clientY - rect.top) / PX_PER_MIN) + START_HOUR * 60) / 15) * 15, START_HOUR * 60, END_HOUR * 60 - 15)
      force()
    }
    const up = async () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      const drag = dragRef.current
      dragRef.current = null
      force()
      if (!drag?.moved) return
      const day = days[drag.dayIndex]
      const start = atMinutes(day, drag.minutes)
      await dispatchOps([{
        op: 'update_event', id: drag.id, start: start.toISOString(),
        end: new Date(start.getTime() + drag.span).toISOString(),
      }], { label: '移动日程', silent: true })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const nowTop = topFor(now)
  const showNow = days.some(day => dayKey(day) === todayKey) && nowTop >= 0 && nowTop <= BODY_HEIGHT

  return (
    <section className="wd-card wd-cal">
      <header className="wd-cal-head">
        <div className="wd-cal-days">
          <span className="wd-cal-gutter" />
          {days.map(day => (
            <div key={dayKey(day)} className={`wd-cal-day ${dayKey(day) === todayKey ? 'is-today' : ''}`}>
              <small>{WEEK_LABELS[(day.getDay() + 6) % 7]}</small>
              <b>{day.getDate()}</b>
            </div>
          ))}
        </div>
      </header>
      <div className="wd-cal-scroll">
        <div className="wd-cal-body" ref={bodyRef} style={{ height: BODY_HEIGHT }}>
          <div className="wd-cal-gutter">
            {hours.map(hour => <span key={hour} style={{ top: (hour - START_HOUR) * 60 * PX_PER_MIN }}>{String(hour).padStart(2, '0')}:00</span>)}
          </div>
          {days.map(day => {
            const key = dayKey(day)
            const list = byDay.get(key) ?? []
            return (
              <div
                key={key}
                className={`wd-cal-col ${key === todayKey ? 'is-today' : ''}`}
                onClick={event => onSlotClick(event, day)}
              >
                {list.map(({ event, lane, lanes }) => {
                  const dragging = dragRef.current?.id === event.id && dragRef.current?.moved
                  const top = dragging ? (dragRef.current.minutes - START_HOUR * 60) * PX_PER_MIN : topFor(event.start)
                  const left = lanes > 1 ? (lane / lanes) * 100 : 0
                  const width = lanes > 1 ? (100 / lanes) - 1 : 100
                  return (
                    <article
                      key={event.id}
                      className={`wd-cal-event tone-${event.color ?? 'blue'} ${event.status === 'tentative' ? 'is-tentative' : ''} ${dragging ? 'is-dragging' : ''}`}
                      style={{ top, height: heightFor(event.start, event.end), left: `${left}%`, width: `${width}%` }}
                      onPointerDown={pointer => startDrag(pointer, event)}
                      onDoubleClick={() => editEvent(event)}
                      title={`${fmtTime(event.start)} ${event.title}`}
                    >
                      <b>{event.title}</b>
                      <span>{fmtTime(event.start)}</span>
                      {lanes > 1 ? <i className="wd-cal-conflict" title="和另一个会冲突">冲突</i> : null}
                    </article>
                  )
                })}
                {showNow && key === todayKey ? <div className="wd-cal-now" style={{ top: nowTop }}><i /></div> : null}
              </div>
            )
          })}
        </div>
      </div>
      <footer className="wd-cal-foot">
        <span className="wd-muted">拖动会议改时间，双击编辑；空白处点一下按那个时间新建。</span>
      </footer>
    </section>
  )
}

function MonthGrid({ cursor, events, now, onOpenDay }) {
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const first = new Date(year, month, 1)
  const start = startOfWeek(first)
  const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i))
  const rows = cells[35].getMonth() === month ? cells : cells.slice(0, 35)
  const todayKey = dayKey(now)
  return (
    <section className="wd-card wd-month">
      <div className="wd-month-week">{WEEK_LABELS.map(label => <span key={label}>{label}</span>)}</div>
      <div className="wd-month-grid">
        {rows.map(day => {
          const key = dayKey(day)
          const list = events.filter(event => event.status !== 'cancelled' && dayKey(event.start) === key)
          return (
            <div key={key} className={`wd-month-cell ${day.getMonth() !== month ? 'is-outside' : ''} ${key === todayKey ? 'is-today' : ''}`} onClick={() => onOpenDay(day)}>
              <span className="wd-month-date">{day.getDate()}</span>
              {list.slice(0, 3).map(event => (
                <button key={event.id} type="button" className={`wd-month-event tone-${event.color ?? 'blue'}`} onClick={e => { e.stopPropagation(); editEvent(event) }}>
                  <time>{fmtTime(event.start)}</time>{event.title}
                </button>
              ))}
              {list.length > 3 ? <span className="wd-month-more">还有 {list.length - 3} 个</span> : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function openImport() {
  setDesk({
    dialog: {
      title: '导入 .ics 日历',
      submitLabel: '导入',
      width: 560,
      fields: [{ name: 'text', label: '把 .ics 文件里的内容贴进来（也可以直接拖文件到窗口）', type: 'textarea', rows: 9, required: true, placeholder: 'BEGIN:VCALENDAR…' }],
      onSubmit: values => importIcs(values.text),
    },
  })
}

function Rail({ tasks }) {
  const open = tasks.filter(task => !task.done)
  return (
    <aside className="wd-cal-rail">
      <section className="wd-card">
        <header className="wd-card-head">
          <h2>待办</h2>
          <span className="wd-card-meta">{open.length} 条</span>
          <span style={{ flex: 1 }} />
          <IconButton icon="plus" label="加待办" onClick={() => addTask()} />
        </header>
        {open.length === 0 ? <p className="wd-card-empty">没有待办。</p> : (
          <ul className="wd-tasks">
            {open.slice(0, 8).map(task => (
              <li key={task.id}>
                <button type="button" className="wd-check" aria-label="标记完成" onClick={() => dispatchOps([{ op: 'toggle_task', id: task.id }], { label: '更新待办', silent: true })} />
                <span className="wd-task-title">{task.title}</span>
                {task.due ? <time>{fmtDate(task.due)}</time> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="wd-card">
        <header className="wd-card-head"><h2>日历</h2></header>
        <div className="wd-cal-actions">
          <button type="button" className="wd-btn is-small" onClick={openImport}><Icon name="archive" size={13} />导入 .ics</button>
          <button type="button" className="wd-btn is-small" onClick={exportIcs}><Icon name="external" size={13} />导出 .ics</button>
        </div>
        <p className="wd-muted wd-cal-hint">导出的文件可以直接导入企业微信、飞书或手机日历；重复日程（RRULE）只导入第一条。</p>
      </section>
    </aside>
  )
}

export function CalendarView() {
  const state = useDesk(s => s.state)
  const tick = useDesk(s => s.tick)
  const mode = useDesk(s => s.calendarMode)
  const [monday, setMonday] = React.useState(() => startOfWeek(new Date()))
  const [cursor, setCursor] = React.useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const now = React.useMemo(() => new Date(), [tick])
  const today = startOfDay(now)
  const weekEnd = addDays(monday, 6)
  const nextEvent = state.events
    .filter(event => event.status !== 'cancelled' && new Date(event.end) > now)
    .sort((a, b) => new Date(a.start) - new Date(b.start))[0]

  return (
    <div className="wd-page wd-cal-page">
      <header className="wd-page-head">
        <div>
          <h1>{mode === 'week' ? `${monday.getMonth() + 1} 月 ${monday.getDate()} 日 – ${weekEnd.getMonth() + 1} 月 ${weekEnd.getDate()} 日` : `${cursor.getFullYear()} 年 ${MONTHS[cursor.getMonth()]}`}</h1>
          <p className="wd-page-sub">
            {nextEvent
              ? `下一件：${fmtDate(nextEvent.start)} ${fmtTime(nextEvent.start)} ${nextEvent.title}（${new Date(nextEvent.start) <= now ? `进行中，还有 ${Math.max(0, Math.round((new Date(nextEvent.end) - now) / 60000))} 分钟` : timeUntil(nextEvent.start, now)}）`
              : '接下来没有安排'}
          </p>
        </div>
        <span style={{ flex: 1 }} />
        <IconButton icon="chevL" label={mode === 'week' ? '上一周' : '上个月'} onClick={() => {
          if (mode === 'week') setMonday(addDays(monday, -7))
          else setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
        }} />
        <button type="button" className="wd-btn is-small" onClick={() => { setMonday(startOfWeek(new Date())); setCursor(new Date(now.getFullYear(), now.getMonth(), 1)) }}>今天</button>
        <IconButton icon="chevR" label={mode === 'week' ? '下一周' : '下个月'} onClick={() => {
          if (mode === 'week') setMonday(addDays(monday, 7))
          else setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
        }} />
        <Segmented
          label="视图"
          value={mode}
          onChange={value => setDesk({ calendarMode: value })}
          options={[{ value: 'week', label: '周' }, { value: 'month', label: '月' }]}
        />
      </header>
      <div className="wd-cal-wrap">
        {mode === 'week'
          ? <WeekGrid weekStart={monday} events={state.events} now={now} />
          : <MonthGrid cursor={cursor} events={state.events} now={now} onOpenDay={day => { setMonday(startOfWeek(day)); setDesk({ calendarMode: 'week' }) }} />}
        <Rail tasks={state.tasks} />
      </div>
    </div>
  )
}
