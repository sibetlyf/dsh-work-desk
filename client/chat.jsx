// 右侧对话栏：一句话改日程、邮件和持仓。解析和执行都在 Host，这里只展示回执。
import React from 'react'
import { getRootCtx, sendChat, setDesk, undo, useDesk } from './desk.js'
import { SessionDock } from './sessiondock.jsx'
import { Icon, IconButton } from './ui.jsx'

const SUGGESTIONS = [
  '今天有几个会？',
  '明天下午三点和设计对一下改版，40 分钟',
  '记一下：回周舟的改版意见，今晚前',
  '茅台现在多少？',
  '帮我写封邮件给王强，说灰度名单周二下班前给',
]

function Receipt({ receipt }) {
  return (
    <div className="wd-receipt">
      <span className="wd-receipt-check"><Icon name="check" size={10} stroke={2.4} /></span>
      <span>{receipt.text}</span>
    </div>
  )
}

function Message({ message, canUndo }) {
  if (message.role === 'user') return <div className="wd-msg is-user">{message.text}</div>
  return (
    <div className="wd-msg is-bot">
      <p>{message.text}</p>
      {message.receipts?.map((receipt, index) => <Receipt key={index} receipt={receipt} />)}
      {message.errors?.map((error, index) => <p key={index} className="wd-msg-error">{error}</p>)}
      {message.notice ? <p className="wd-msg-note">{message.notice}</p> : null}
      <footer>
        <span>{message.engine === 'local' ? '本地规则' : ''}</span>
        {canUndo ? <button type="button" onClick={undo}><Icon name="undo" size={11} />撤销</button> : null}
      </footer>
    </div>
  )
}

export function ChatPanel({ head, suggestions, placeholder = '想让我做什么，直接说', intro = true }) {
  const chat = useDesk(s => s.state.chat ?? [])
  const thinking = useDesk(s => s.thinking)
  const [text, setText] = React.useState('')
  const scroller = React.useRef(null)
  const input = React.useRef(null)

  React.useEffect(() => {
    if (scroller.current) scroller.current.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [chat.length, thinking])
  React.useLayoutEffect(() => {
    const el = input.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`
  }, [text])

  const send = value => {
    const message = String(value ?? text).trim()
    if (!message || thinking) return
    setText('')
    sendChat(message)
  }
  const lastBot = [...chat].reverse().find(row => row.role === 'assistant')

  return (
    <div className="wd-chat">
      <header className="wd-dock-head" data-window-drag="">{head}</header>
      <div className="wd-dock-scroll" ref={scroller} aria-live="polite">
        {chat.length === 0 && intro ? (
          <div className="wd-dock-intro">
            <h3>说一句话，<br />日程、邮件和持仓我一起改。</h3>
            <p>每一步都能撤销；发邮件只会写草稿，发不发由你点。</p>
          </div>
        ) : chat.map(message => (
          <Message key={message.id} message={message} canUndo={message === lastBot && message.undoable} />
        ))}
        {thinking ? <div className="wd-msg is-bot"><span className="wd-shimmer">正在处理……</span></div> : null}
      </div>
      {suggestions?.length ? (
        <div className="wd-suggest">
          {suggestions.slice(0, chat.length ? 2 : 4).map(row => (
            <button type="button" key={row} onClick={() => send(row)} disabled={thinking}>{row}</button>
          ))}
        </div>
      ) : null}
      <form className="wd-composer" onSubmit={event => { event.preventDefault(); send() }}>
        <textarea
          ref={input}
          rows={1}
          aria-label="给助手发消息"
          value={text}
          placeholder={placeholder}
          onChange={e => setText(e.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault()
              send()
            }
          }}
        />
        <button type="submit" className="wd-send" aria-label="发送" disabled={!text.trim() || thinking}><Icon name="send" size={15} /></button>
      </form>
    </div>
  )
}

/** 独立助手：没有会话服务时的兜底（自己调模型 + 本地规则）。 */
function LocalChat() {
  const model = useDesk(s => s.model)
  const modelOk = useDesk(s => s.modelOk)
  const modelError = useDesk(s => s.modelError)
  return (
    <ChatPanel
      head={(
        <>
          <h2>助手</h2>
          <span className={`wd-engine ${!model ? '' : modelOk === false ? 'is-down' : 'is-live'}`} title={modelError || (model ? `使用 ${model}` : '当前没有可用模型，只能处理常见说法')}>
            <i />{model ?? '本地规则'}
          </span>
          <span style={{ flex: 1 }} />
          <IconButton icon="gear" label="设置" onClick={() => setDesk({ settingsOpen: true })} />
          <IconButton icon="close" label="收起对话" onClick={() => setDesk({ dockOpen: false })} />
        </>
      )}
      suggestions={SUGGESTIONS}
      placeholder="比如：明天下午三点和设计对一下改版"
    />
  )
}

/**
 * 有 sessions 服务时，面板里的助手就是 DSH 的那条会话（读 eventSource、写 prompt）；
 * 没有时退回独立助手，功能不至于消失。
 */
export function ChatDock({ useSessions }) {
  const sessions = getRootCtx()?.get?.('sessions')
  const canMirror = Boolean(sessions?.retain) && Boolean(sessions?.list)
  if (canMirror) {
    return (
      <aside className="wd-dock" aria-label="DSH 会话">
        <SessionDock
          useSessions={useSessions}
          head={(
            <>
              <h2>会话</h2>
              <IconButton icon="gear" label="设置" onClick={() => setDesk({ settingsOpen: true })} />
            </>
          )}
        />
      </aside>
    )
  }
  return (
    <aside className="wd-dock" aria-label="对话助手">
      <LocalChat />
    </aside>
  )
}
