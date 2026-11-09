// 设置：只放真的会生效的项。邮箱授权码只在本机，界面上只看得到末四位。
import React from 'react'
import { saveSettings, setDesk, testMail, useDesk } from './desk.js'
import { Dialog, Icon } from './ui.jsx'

const PROVIDERS = [
  { value: 'dsh-email', label: 'DSH 邮件插件' },
  { value: 'imap', label: '自建 IMAP / SMTP' },
  { value: 'demo', label: '示例邮箱' },
]

const PRESETS = [
  { id: 'qq', label: 'QQ 邮箱', imap: 'imap.qq.com', smtp: 'smtp.qq.com' },
  { id: 'exmail', label: '腾讯企业邮', imap: 'imap.exmail.qq.com', smtp: 'smtp.exmail.qq.com' },
  { id: '163', label: '网易 163', imap: 'imap.163.com', smtp: 'smtp.163.com' },
  { id: 'aliyun', label: '阿里企业邮', imap: 'imap.qiye.aliyun.com', smtp: 'smtp.qiye.aliyun.com' },
  { id: 'gmail', label: 'Gmail', imap: 'imap.gmail.com', smtp: 'smtp.gmail.com' },
  { id: 'outlook', label: 'Outlook', imap: 'outlook.office365.com', smtp: 'smtp.office365.com' },
]

export function SettingsDialog() {
  const open = useDesk(s => s.settingsOpen)
  const settings = useDesk(s => s.settings)
  const pluginAvailable = useDesk(s => s.mail.pluginAvailable)
  const [form, setForm] = React.useState(null)
  const [test, setTest] = React.useState(null)
  const [testing, setTesting] = React.useState(false)

  const opened = React.useRef(false)
  React.useEffect(() => {
    if (!open) { opened.current = false; return }
    // 只在「打开设置」这一刻灌一次表单：面板每 15 秒会重拉 state，
    // 如果每次都重灌，测试连接的返回和正在填的字段都会被打回去。
    if (!settings || opened.current) return
    opened.current = true
    setForm({
      provider: settings.mail.provider,
      account: settings.mail.account ?? '',
      address: settings.mail.address,
      folder: settings.mail.folder,
      syncSec: settings.mail.syncSec,
      imap: { host: settings.mail.imap.host, port: settings.mail.imap.port, secure: settings.mail.imap.secure, user: settings.mail.imap.user, pass: '' },
      smtp: { host: settings.mail.smtp.host, port: settings.mail.smtp.port, secure: settings.mail.smtp.secure, user: settings.mail.smtp.user, pass: '' },
      quotes: { enabled: settings.quotes.enabled, intervalSec: settings.quotes.intervalSec },
    })
    setTest(null)
  }, [open, settings])

  if (!open || !form) return null
  const close = () => setDesk({ settingsOpen: false })
  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))
  const setNested = (group, key, value) => setForm(f => ({ ...f, [group]: { ...f[group], [key]: value } }))
  const applyPreset = preset => setForm(f => ({
    ...f,
    provider: 'imap',
    imap: { ...f.imap, host: preset.imap, port: 993, secure: true },
    smtp: { ...f.smtp, host: preset.smtp, port: 465, secure: true },
  }))

  const payload = () => ({
    mail: {
      provider: form.provider,
      account: form.account,
      address: form.address,
      folder: form.folder,
      syncSec: Number(form.syncSec),
      imap: { host: form.imap.host, port: Number(form.imap.port), secure: form.imap.secure, user: form.imap.user, pass: form.imap.pass },
      smtp: { host: form.smtp.host, port: Number(form.smtp.port), secure: form.smtp.secure, user: form.smtp.user, pass: form.smtp.pass },
    },
    quotes: { enabled: form.quotes.enabled, intervalSec: Number(form.quotes.intervalSec) },
  })

  return (
    <Dialog title="设置" onClose={close} width={620}>
      <form className="wd-form" onSubmit={async event => { event.preventDefault(); if (await saveSettings(payload())) close() }}>
        <div className="wd-field">
          <span>邮件来源</span>
          <div className="wd-presets" role="radiogroup" aria-label="邮件来源">
            {PROVIDERS.map(option => (
              <button type="button" key={option.value} role="radio" aria-checked={form.provider === option.value} className={form.provider === option.value ? 'is-on' : ''} onClick={() => set('provider', option.value)}>{option.label}</button>
            ))}
          </div>
          <small>
            {form.provider === 'dsh-email'
              ? '复用 dsh-email 里已经配好的账号：工作台只调它的读信/标记/写草稿工具，不读授权码。'
              : form.provider === 'imap'
                ? '工作台自己连 IMAP；同步只拉最近 40 封的头部和正文前 2KB，打开时才下载全文。'
                : '现在用的是示例邮件，可以随便点、随便试。'}
          </small>
        </div>

        {form.provider === 'dsh-email' ? (
          <>
            <label className="wd-field">
              <span>复用哪个账号</span>
              <input value={form.account} onChange={e => set('account', e.target.value)} placeholder="留空用 dsh-email 的默认账号" />
              <small>账号名就是 dsh-email 设置里的名字（多个账号时用它区分）。发信按钮会变成「存为草稿」，发送在 DSH 的草稿箱里确认。</small>
            </label>
            <div className="wd-test-row">
              <button type="button" className="wd-btn is-small" disabled={testing} onClick={async () => {
                setTesting(true)
                setTest(null)
                setTest(await testMail({ provider: 'dsh-email' }))
                setTesting(false)
              }}>{testing ? '正在连接…' : '测试连接'}</button>
              {pluginAvailable === false ? <span className="wd-error">没检测到 dsh-email 的邮件工具</span> : null}
              {test ? (
                <span className={test.ok ? 'wd-ok' : 'wd-error'}>
                  {test.ok ? `连上了：账号 ${test.account}，${test.folders?.length ?? 0} 个文件夹` : test.error}
                </span>
              ) : null}
            </div>
            {test?.folders?.length ? <p className="wd-muted">可用文件夹：{test.folders.slice(0, 8).join('、')}</p> : null}
          </>
        ) : null}

        {form.provider === 'imap' ? (
          <>
            <div className="wd-field">
              <span>常用邮箱</span>
              <div className="wd-presets">
                {PRESETS.map(preset => (
                  <button type="button" key={preset.id} className={form.imap.host === preset.imap ? 'is-on' : ''} onClick={() => applyPreset(preset)}>{preset.label}</button>
                ))}
              </div>
              <small>QQ / 163 需要「授权码」，不是登录密码。Gmail 需要应用专用密码。</small>
            </div>
            <label className="wd-field"><span>邮箱地址</span><input value={form.address} onChange={e => set('address', e.target.value)} placeholder="you@company.com" /></label>
            <div className="wd-field-row">
              <label className="wd-field"><span>IMAP 服务器</span><input value={form.imap.host} onChange={e => setNested('imap', 'host', e.target.value)} placeholder="imap.exmail.qq.com" /></label>
              <label className="wd-field is-small"><span>端口</span><input value={form.imap.port} onChange={e => setNested('imap', 'port', e.target.value)} /></label>
            </div>
            <div className="wd-field-row">
              <label className="wd-field"><span>IMAP 账号</span><input value={form.imap.user} onChange={e => setNested('imap', 'user', e.target.value)} placeholder="默认用邮箱地址" /></label>
              <label className="wd-field"><span>授权码{settings.mail.imap.hasPass ? `（已保存 · 末四位 ${settings.mail.imap.passHint}）` : ''}</span><input type="password" autoComplete="off" value={form.imap.pass} onChange={e => setNested('imap', 'pass', e.target.value)} placeholder={settings.mail.imap.hasPass ? '留空表示不修改' : '授权码'} /></label>
            </div>
            <div className="wd-field-row">
              <label className="wd-field"><span>SMTP 服务器</span><input value={form.smtp.host} onChange={e => setNested('smtp', 'host', e.target.value)} placeholder="smtp.exmail.qq.com" /></label>
              <label className="wd-field is-small"><span>端口</span><input value={form.smtp.port} onChange={e => setNested('smtp', 'port', e.target.value)} /></label>
            </div>
            <div className="wd-field-row">
              <label className="wd-field"><span>收件箱文件夹</span><input value={form.folder} onChange={e => set('folder', e.target.value)} placeholder="INBOX" /></label>
              <label className="wd-field is-small"><span>同步间隔（秒）</span><input type="number" min="30" max="3600" value={form.syncSec} onChange={e => set('syncSec', e.target.value)} /></label>
            </div>
            <div className="wd-test-row">
              <button type="button" className="wd-btn is-small" disabled={testing} onClick={async () => {
                setTesting(true)
                setTest(null)
                const result = await testMail({ address: form.address, folder: form.folder, imap: { host: form.imap.host, port: Number(form.imap.port), secure: form.imap.secure, user: form.imap.user || form.address, pass: form.imap.pass } })
                setTest(result)
                setTesting(false)
              }}>{testing ? '正在连接…' : '测试连接'}</button>
              {test ? (
                <span className={test.ok ? 'wd-ok' : 'wd-error'}>
                  {test.ok ? `连上了，${form.folder} 里有 ${test.exists} 封邮件` : test.error}
                </span>
              ) : null}
            </div>
            <p className="wd-muted">授权码只写进本机的 settings.json（权限 600），不会回传给浏览器，也不会进内容数据。</p>
          </>
        ) : null}

        <div className="wd-field">
          <span>行情刷新</span>
          <div className="wd-field-row">
            <label className="wd-field is-small"><span>开关</span>
              <select value={form.quotes.enabled ? 'on' : 'off'} onChange={e => setNested('quotes', 'enabled', e.target.value === 'on')}>
                <option value="on">开</option>
                <option value="off">关</option>
              </select>
            </label>
            <label className="wd-field is-small"><span>间隔（秒）</span><input type="number" min="3" max="300" value={form.quotes.intervalSec} onChange={e => setNested('quotes', 'intervalSec', e.target.value)} /></label>
          </div>
          <small>只在后台按间隔拉一次公开行情；行情页打开时前端也会跟着刷。</small>
        </div>

        <div className="wd-form-foot">
          <span className="wd-muted" style={{ flex: 1 }}>助手用的模型跟随 DeepSeek Harness 当前默认模型。</span>
          <button type="button" className="wd-btn" onClick={close}>取消</button>
          <button type="submit" className="wd-btn is-primary"><Icon name="check" size={14} />保存</button>
        </div>
      </form>
    </Dialog>
  )
}
