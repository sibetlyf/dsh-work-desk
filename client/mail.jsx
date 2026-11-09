// 邮件：左边筛选，中间列表，右边读信。回复只写草稿，发送必须在这里点两次确认。
import React from 'react'
import { closeComposer, dispatchOps, markMail, openComposer, openMail, saveSettings, sendComposer, setDesk, syncMail, useDesk } from './desk.js'
import { Dialog, Empty, Icon, IconButton, Segmented } from './ui.jsx'
import { addTask } from './today.jsx'
import { fmtDateTime, fmtTime, mailTime, relativeDay } from './util.js'

function Filter({ value, onChange, counts }) {
  const options = [
    { value: 'all', label: `全部 ${counts.all}` },
    { value: 'unread', label: `未读 ${counts.unread}` },
    { value: 'starred', label: `星标 ${counts.starred}` },
    { value: 'drafts', label: `草稿 ${counts.drafts}` },
  ]
  return (
    <div className="wd-mail-filters" role="tablist" aria-label="邮件筛选">
      {options.map(option => (
        <button key={option.value} type="button" role="tab" aria-selected={value === option.value} className={value === option.value ? 'is-on' : ''} onClick={() => onChange(option.value)}>{option.label}</button>
      ))}
    </div>
  )
}

function Row({ mail, active, onClick }) {
  return (
    <button type="button" className={`wd-mail-row ${mail.unread ? 'is-unread' : ''} ${active ? 'is-active' : ''}`} onClick={onClick}>
      <span className={`wd-mail-dot ${mail.unread ? 'is-unread' : ''}`} aria-hidden="true" />
      <span className="wd-mail-row-main">
        <span className="wd-mail-row-top">
          <b>{mail.from?.name || mail.from?.address || '我'}</b>
          <time>{mailTime(mail.date)}</time>
        </span>
        <span className="wd-mail-row-subject">
          {mail.starred ? <Icon name="star" size={11} fill /> : null}
          {mail.hasAttachments ? <Icon name="paperclip" size={11} /> : null}
          {mail.subject}
        </span>
        <span className="wd-mail-row-snippet">{mail.snippet || '（无正文预览）'}</span>
      </span>
    </button>
  )
}

function toEvent(mail) {
  const start = new Date(Date.now() + 30 * 60000)
  start.setSeconds(0, 0)
  setDesk({
    dialog: {
      title: '把邮件变成日程',
      submitLabel: '加到日历',
      initial: { title: mail.subject, start: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}T${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`, minutes: 30, location: '' },
      fields: [
        { name: 'title', label: '主题', required: true },
        { name: 'start', label: '开始', type: 'datetime-local', required: true },
        { name: 'minutes', label: '时长（分钟）', type: 'number' },
        { name: 'location', label: '地点' },
      ],
      onSubmit: values => {
        const startAt = new Date(values.start)
        dispatchOps([{
          op: 'add_event', title: values.title, start: startAt.toISOString(),
          end: new Date(startAt.getTime() + Math.max(5, Number(values.minutes) || 30) * 60000).toISOString(),
          location: values.location ?? '', notes: mail.snippet ?? '', mailId: mail.id, source: 'mail',
        }], { label: '从邮件新建日程' })
      },
    },
  })
}

function Reader({ mail }) {
  if (!mail) {
    return <Empty title="选一封邮件" hint="左边列表里点一封，这里显示正文。邮件正文按纯文本渲染，不加载远程图片。" />
  }
  const from = mail.from ?? {}
  return (
    <article className="wd-reader">
      <header className="wd-reader-head">
        <h2>{mail.subject}</h2>
        <div className="wd-reader-meta">
          <span><b>{from.name || from.address}</b> {from.name ? `<${from.address}>` : ''}</span>
          <span>{fmtDateTime(mail.date)}</span>
          {mail.folder ? <span className="wd-muted">{mail.folder}</span> : null}
        </div>
        <div className="wd-reader-actions">
          <button type="button" className="wd-btn is-small" onClick={() => openComposer({ to: from.address ?? '', subject: /^re:/i.test(mail.subject) ? mail.subject : `Re: ${mail.subject}`, text: '', replyToId: mail.id })}>
            <Icon name="reply" size={13} />回复
          </button>
          <button type="button" className="wd-btn is-small" onClick={() => markMail(mail.id, mail.starred ? 'unstar' : 'star')}>
            <Icon name="star" size={13} fill={mail.starred} />{mail.starred ? '取消星标' : '星标'}
          </button>
          <button type="button" className="wd-btn is-small" onClick={() => markMail(mail.id, mail.unread ? 'read' : 'unread')}>
            <Icon name="eye" size={13} />{mail.unread ? '标为已读' : '标为未读'}
          </button>
          <button type="button" className="wd-btn is-small" onClick={() => toEvent(mail)}>
            <Icon name="calendar" size={13} />转日程
          </button>
          <button type="button" className="wd-btn is-small" onClick={() => addTask({ title: `回复：${mail.subject.slice(0, 30)}`, mailId: mail.id })}>
            <Icon name="check" size={13} />转待办
          </button>
        </div>
      </header>
      {mail.attachments?.length ? (
        <ul className="wd-reader-files">
          {mail.attachments.map((file, index) => (
            <li key={index}><Icon name="paperclip" size={12} />{file.filename}<small>{Math.round((file.size ?? 0) / 1024)} KB</small></li>
          ))}
        </ul>
      ) : null}
      <pre className="wd-reader-body">{mail.body || mail.snippet || '（这封邮件没有正文）'}</pre>
    </article>
  )
}

function Composer() {
  const composer = useDesk(s => s.composer)
  const confirm = useDesk(s => s.confirmSend)
  const sending = useDesk(s => s.sending)
  const settings = useDesk(s => s.settings)
  const [draft, setDraft] = React.useState(composer ?? {})
  React.useEffect(() => setDraft(composer ?? {}), [composer])
  if (!composer) return null
  const set = (key, value) => setDraft(d => ({ ...d, [key]: value }))
  const provider = settings?.mail?.provider ?? 'demo'
  const viaPlugin = provider === 'dsh-email'
  const smtpReady = viaPlugin || Boolean(settings?.mail?.smtp?.host)
  const saveDraft = async () => {
    const payload = { to: draft.to, cc: draft.cc ?? '', subject: draft.subject, text: draft.text, replyToId: draft.replyToId ?? null }
    const result = draft.id
      ? await dispatchOps([{ op: 'update_draft', id: draft.id, ...payload }], { label: '保存草稿' })
      : await dispatchOps([{ op: 'add_draft', ...payload }], { label: '保存草稿' })
    if (result) closeComposer()
  }
  return (
    <Dialog title={draft.replyToId ? '回复' : '写邮件'} onClose={closeComposer} width={620}>
      <div className="wd-form">
        <label className="wd-field"><span>收件人</span><input value={draft.to ?? ''} onChange={e => set('to', e.target.value)} placeholder="name@company.com" /></label>
        <label className="wd-field"><span>抄送</span><input value={draft.cc ?? ''} onChange={e => set('cc', e.target.value)} placeholder="可留空" /></label>
        <label className="wd-field"><span>主题</span><input value={draft.subject ?? ''} onChange={e => set('subject', e.target.value)} /></label>
        <label className="wd-field"><span>正文</span><textarea rows={10} value={draft.text ?? ''} onChange={e => set('text', e.target.value)} placeholder="写清楚要对方做什么、什么时候要。" /></label>
        <div className="wd-form-foot">
          {viaPlugin ? null : <button type="button" className="wd-btn" onClick={saveDraft}>存草稿</button>}
          <span style={{ flex: 1 }} />
          <button type="button" className="wd-btn" onClick={closeComposer}>取消</button>
          <button type="button" className="wd-btn is-primary" disabled={sending || !draft.to || !draft.subject} onClick={() => setDesk({ confirmSend: true })}>
            {viaPlugin ? '存为草稿' : smtpReady ? '发送' : '发送（未配置 SMTP）'}
          </button>
        </div>
        {confirm ? (
          <div className="wd-confirm">
            {viaPlugin
              ? <p>确认把这封放进 DSH 邮件插件的草稿箱？<b>它不会直接发出去</b>，要你在 设置 → 邮件 → 草稿 里预览后再确认。</p>
              : <p>确认发给 <b>{draft.to}</b>？发出后不可撤回。</p>}
            <div>
              <button type="button" className="wd-btn is-small" onClick={() => setDesk({ confirmSend: false })}>再看看</button>
              <button type="button" className="wd-btn is-small is-primary" disabled={sending} onClick={sendComposer}>{sending ? '处理中…' : viaPlugin ? '写入草稿' : '确认发送'}</button>
            </div>
          </div>
        ) : null}
        {!smtpReady && !viaPlugin ? <p className="wd-muted wd-composer-hint">还没有配置 SMTP，发不出去。先存草稿，或者到设置里填发信服务器。</p> : null}
        {viaPlugin ? <p className="wd-muted wd-composer-hint">发送由 DSH 邮件插件负责，工作台只写草稿，不碰你的授权码。</p> : null}
      </div>
    </Dialog>
  )
}

function ConnectMail() {
  const mail = useDesk(s => s.mail)
  return (
    <div className="wd-connect">
      <h2>先接一个真实邮箱</h2>
      <p>工作台不放示例邮件。{mail.pluginAvailable ? '检测到你装了 DSH 邮件插件，直接用它最省事：' : '两种接法，任选一种：'}</p>
      <div className="wd-connect-opts">
        {mail.pluginAvailable ? (
          <button type="button" className="wd-connect-opt" onClick={async () => {
            await saveSettings({ mail: { provider: 'dsh-email' } })
            const result = await syncMail()
            if (!result?.ok) setDesk({ settingsOpen: true })
          }}>
            <b>一键接入 DSH 邮件插件{mail.account ? `（${mail.account}）` : ''}</b>
            <span>账号、授权码、同步都在 dsh-email 里；工作台只读它、写草稿，发送留在它的草稿箱确认。</span>
          </button>
        ) : null}
        <button type="button" className="wd-connect-opt" onClick={() => setDesk({ settingsOpen: true })}>
          <b>{mail.pluginAvailable ? '改用自己填的 IMAP / SMTP' : '填 IMAP / SMTP'}</b>
          <span>QQ / 163 用授权码，Gmail 用应用专用密码；填完点「测试连接」。</span>
        </button>
      </div>
      <p className="wd-muted">路径：设置 → 邮件 → 邮件来源。接好后回到这里点「同步」。</p>
    </div>
  )
}

export function MailView() {
  const state = useDesk(s => s.state)
  const filter = useDesk(s => s.mailFilter)
  const query = useDesk(s => s.mailQuery)
  const focusId = useDesk(s => s.focusMailId)
  const mail = useDesk(s => s.mail)
  const drafts = state.drafts ?? []

  const counts = {
    all: state.mails.length,
    unread: state.mails.filter(row => row.unread).length,
    starred: state.mails.filter(row => row.starred).length,
    drafts: drafts.length,
  }
  const rows = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    return state.mails.filter(row => {
      if (filter === 'unread' && !row.unread) return false
      if (filter === 'starred' && !row.starred) return false
      if (filter === 'drafts') return false
      if (!needle) return true
      return [row.subject, row.snippet, row.from?.name, row.from?.address].some(value => String(value ?? '').toLowerCase().includes(needle))
    })
  }, [state.mails, filter, query])

  const current = state.mails.find(row => row.id === focusId) ?? null
  const currentDraft = filter === 'drafts' ? drafts.find(row => row.id === focusId) : null
  const noMail = state.mails.length === 0

  return (
    <div className="wd-page wd-mail-page">
      <aside className="wd-mail-side">
        <button type="button" className="wd-btn is-primary is-wide" onClick={() => openComposer({ to: '', cc: '', subject: '', text: '' })}>
          <Icon name="edit" size={14} />写邮件
        </button>
        <Filter value={filter} onChange={value => setDesk({ mailFilter: value })} counts={counts} />
        <div className="wd-mail-account">
          {mail.provider === 'demo' && mail.pluginAvailable ? (
            <p className="wd-mail-hint">
              检测到 DSH 邮件插件，可以直接复用它的账号。
              <button type="button" className="wd-link" onClick={() => setDesk({ settingsOpen: true })}>去接入</button>
            </p>
          ) : null}
          <p>
            {mail.provider === 'dsh-email'
              ? `DSH 邮件${mail.account ? ` · ${mail.account}` : ''}`
              : mail.provider === 'imap' ? (mail.address || 'IMAP') : '未接入邮箱'}
          </p>
          <small>
            {mail.provider === 'dsh-email' && !mail.pluginAvailable
              ? '没检测到 dsh-email 的邮件工具'
              : mail.provider === 'demo'
                ? '设置里接一个真实邮箱'
                : mail.lastSyncAt ? `上次同步 ${fmtTime(mail.lastSyncAt)}` : mail.configured ? '等待同步' : '设置里接入自己的邮箱'}
          </small>
          {mail.lastSyncError ? <small className="wd-error">{mail.lastSyncError}</small> : null}
          <button
            type="button"
            className="wd-btn is-small"
            onClick={syncMail}
            disabled={mail.provider === 'demo' || (mail.provider === 'dsh-email' && !mail.pluginAvailable)}
          >
            <Icon name="refresh" size={12} />同步
          </button>
          {mail.provider === 'dsh-email' ? <small>读信和标记走 dsh-email，发信只在它的草稿里确认。</small> : null}
        </div>
        <p className="wd-muted wd-mail-tip">正文按纯文本显示，不加载远程图片，追踪像素不会记录你打开过。</p>
      </aside>

      <section className="wd-mail-list">
        <header className="wd-mail-search">
          <label className="wd-search">
            <Icon name="search" size={15} />
            <input value={query} onChange={e => setDesk({ mailQuery: e.target.value })} placeholder="搜发件人、主题、正文摘要" aria-label="搜索邮件" />
          </label>
        </header>
        <div className="wd-mail-rows">
          {filter === 'drafts' ? (
            drafts.length === 0 ? <p className="wd-card-empty">没有草稿。</p> : drafts.map(draft => (
              <button key={draft.id} type="button" className={`wd-mail-row ${draft.id === focusId ? 'is-active' : ''}`} onClick={() => setDesk({ focusMailId: draft.id })}>
                <span className="wd-mail-dot" />
                <span className="wd-mail-row-main">
                  <span className="wd-mail-row-top"><b>草稿</b><time>{relativeDay(draft.createdAt)}</time></span>
                  <span className="wd-mail-row-subject">{draft.subject || '（无主题）'}</span>
                  <span className="wd-mail-row-snippet">{draft.to}</span>
                </span>
              </button>
            ))
          ) : rows.length === 0 ? (
            <Empty
              title={noMail ? '还没有邮件' : '没有匹配的邮件'}
              hint={noMail ? '右边接一个真实邮箱，或在设置里接 DSH 邮件插件。' : query ? '换个关键词试试。' : '点右上角同步，或者在设置里接入邮箱。'}
            />
          ) : rows.map(row => (
            <Row key={row.id} mail={row} active={row.id === focusId} onClick={() => openMail(row.id)} />
          ))}
        </div>
      </section>

      <section className="wd-mail-read">
        {noMail && filter !== 'drafts' ? <ConnectMail /> : currentDraft ? (
          <article className="wd-reader">
            <header className="wd-reader-head">
              <h2>{currentDraft.subject}</h2>
              <div className="wd-reader-meta"><span>发给 {currentDraft.to}</span><span>{fmtDateTime(currentDraft.createdAt)}</span></div>
              <div className="wd-reader-actions">
                <button type="button" className="wd-btn is-small" onClick={() => openComposer(currentDraft)}><Icon name="edit" size={13} />继续写</button>
                <button type="button" className="wd-btn is-small is-danger" onClick={() => dispatchOps([{ op: 'delete_draft', id: currentDraft.id }], { label: '丢弃草稿' })}><Icon name="trash" size={13} />丢弃</button>
              </div>
            </header>
            <pre className="wd-reader-body">{currentDraft.text || '（还没写正文）'}</pre>
          </article>
        ) : <Reader mail={current} />}
      </section>

      <Composer />
    </div>
  )
}

export function openMailList() {
  setDesk({ view: 'mail', focusMailId: null })
}
