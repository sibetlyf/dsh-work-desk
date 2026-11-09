// 会话镜像：面板里的助手不再是插件自己调模型，而是直接读写 DSH 的那条会话。
// 读：retain 会话 → 订阅 eventSource；写：session.prompt 投一条用户消息。
import React from 'react'
import { getRootCtx, setDesk } from './desk.js'
import { Icon, IconButton } from './ui.jsx'

const EMPTY_SNAPSHOT = { running: false, openState: 'cold' }

function textOf(blocks) {
  return (blocks ?? [])
    .filter(block => block?.type === 'text' && typeof block.text === 'string')
    .map(block => block.text)
    .join('')
}

function toolNames(blocks) {
  return (blocks ?? []).filter(block => block?.type === 'tool-call').map(block => block.name).filter(Boolean)
}

/** 把会话事件摊平成几条能显示的消息。只收真人输入，跳过 system-reminder／技能注入这类合成消息。 */
export function messagesOf(entries) {
  const out = []
  for (const entry of entries ?? []) {
    if (entry?.type !== 'event') continue
    const event = entry.event
    const seq = event?.seq ?? 0
    if (event?.type === 'user/message') {
      const kind = event.data?.source?.kind
      if (kind && kind !== 'user') continue
      const text = textOf(event.data?.content).trim()
      if (text) out.push({ id: `u${seq}`, role: 'user', text })
    } else if (event?.type === 'assistant/message') {
      const message = event.data?.message
      const text = textOf(message?.content).trim()
      const tools = toolNames(message?.content)
      if (text || tools.length) out.push({ id: `a${seq}`, role: 'assistant', text, tools })
    }
  }
  return out.slice(-80)
}

function useSessionSnapshot(session) {
  const subscribe = React.useCallback(callback => (session ? session.subscribe(callback) : () => {}), [session])
  const snapshot = React.useCallback(() => (session ? session.getSnapshot() : EMPTY_SNAPSHOT), [session])
  return React.useSyncExternalStore(subscribe, snapshot)
}

export function SessionDock({ useSessions, head }) {
  const list = useSessions(state => state)
  const [picked, setPicked] = React.useState(null)
  const [binding, setBinding] = React.useState(null)
  const [entries, setEntries] = React.useState([])
  const [error, setError] = React.useState(null)
  const [text, setText] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const scroller = React.useRef(null)

  const rows = React.useMemo(() => {
    const list_ = (list?.ids ?? []).map(id => ({ id, ...(list.byId?.[id] ?? {}) }))
    // 空会话（刚点「新会话」还没说话）排后面，默认落到真有内容的那条
    return list_.sort((a, b) => Number(a.blank ?? false) - Number(b.blank ?? false) || (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
  }, [list])
  const sessionId = picked ?? rows[0]?.id ?? null

  React.useEffect(() => {
    if (!sessionId) return undefined
    const sessions = getRootCtx()?.get('sessions')
    if (!sessions?.retain) {
      setError('这个环境没有 sessions 服务，会话镜像不可用')
      return undefined
    }
    let cancelled = false
    let reference = null
    let off = null
    setBinding(null)
    setEntries([])
    setError(null)
    try {
      reference = sessions.retain(sessionId, { source: 'work-desk' })
      reference.ready.then(bound => {
        if (cancelled) return
        setBinding(bound)
        const read = () => setEntries(bound.eventSource.getSnapshot().entries)
        read()
        off = bound.eventSource.subscribe(read)
      }).catch(err => { if (!cancelled) setError(err?.message ?? '打不开这条会话') })
    } catch (err) {
      setError(err?.message ?? '打不开这条会话')
    }
    return () => {
      cancelled = true
      try { off?.() } catch {}
      try { reference?.release?.() } catch {}
    }
  }, [sessionId])

  const messages = React.useMemo(() => messagesOf(entries), [entries])
  const snapshot = useSessionSnapshot(binding?.session ?? null)

  React.useEffect(() => {
    if (scroller.current) scroller.current.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length, snapshot?.running])

  const send = async () => {
    const value = text.trim()
    if (!value || !binding || sending) return
    setSending(true)
    setText('')
    try {
      const result = await binding.session.prompt([{ type: 'text', text: value }], 'queue')
      if (result && result.ok === false) setError(result.error?.message ?? '发送失败')
    } catch (err) {
      setError(err?.message ?? '发送失败')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="wd-chat">
      <header className="wd-dock-head" data-window-drag="">
        {head}
        <span className="wd-engine is-live" title="这条就是 DSH 的会话，不是插件自己的模型调用">
          <i />{snapshot?.running ? '运行中' : '会话'}
        </span>
        <span style={{ flex: 1 }} />
        {rows.length > 1 ? (
          <select className="wd-session-pick" aria-label="选择会话" value={sessionId ?? ''} onChange={event => setPicked(event.target.value)}>
            {rows.slice(0, 12).map(row => <option key={row.id} value={row.id}>{(row.title ?? row.id).slice(0, 18)}</option>)}
          </select>
        ) : null}
        <IconButton icon="close" label="收起对话" onClick={() => setDesk({ dockOpen: false })} />
      </header>

      <div className="wd-dock-scroll" ref={scroller} aria-live="polite">
        {error ? <p className="wd-msg-error">{error}</p> : null}
        {!binding && !error ? <div className="wd-dock-intro"><p className="wd-shimmer">正在接上会话…</p></div> : null}
        {binding && messages.length === 0 ? (
          <div className="wd-dock-intro">
            <h3>这里就是 DSH 的会话。</h3>
            <p>你在这里说的每一句都会进同一条会话，Agent 加日程、记待办，工作台也会同步显示。</p>
          </div>
        ) : null}
        {messages.map(message => (
          <div key={message.id} className={`wd-msg is-${message.role === 'user' ? 'user' : 'bot'}`}>
            {message.text ? <p>{message.text}</p> : null}
            {message.tools?.length ? <p className="wd-msg-tool"><Icon name="bolt" size={11} />{message.tools.join(' · ')}</p> : null}
          </div>
        ))}
        {snapshot?.running ? <div className="wd-msg is-bot"><span className="wd-shimmer">正在处理……</span></div> : null}
      </div>

      <form className="wd-composer" onSubmit={event => { event.preventDefault(); send() }}>
        <textarea
          rows={1}
          aria-label="给会话发消息"
          value={text}
          placeholder={binding ? '说一句话，进的是 DSH 同一条会话' : '正在接上会话…'}
          disabled={!binding || sending}
          onChange={event => setText(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault()
              send()
            }
          }}
        />
        <button type="submit" className="wd-send" aria-label="发送" disabled={!text.trim() || !binding || sending}><Icon name="send" size={15} /></button>
      </form>
    </div>
  )
}
