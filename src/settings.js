// 工作台设置。邮箱授权码只存在本机 settings.json（600），不回传给浏览器，也不进内容数据。
import { chmod, readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const DEFAULTS = {
  language: 'zh',
  mail: {
    provider: 'demo',
    account: '',
    address: '',
    folder: 'INBOX',
    imap: { host: '', port: 993, secure: true, user: '', pass: '' },
    smtp: { host: '', port: 465, secure: true, user: '', pass: '' },
    syncSec: 180,
  },
  quotes: { enabled: true, intervalSec: 8 },
  workHours: { start: '09:30', end: '18:30' },
  brief: { auto: true, at: '08:30' },
}

function clamp(value, min, max, fallback) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback
}

function mergeEndpoints(base, patch) {
  const next = { ...base }
  if (!patch || typeof patch !== 'object') return next
  for (const key of ['host', 'user']) if (typeof patch[key] === 'string') next[key] = patch[key].trim().slice(0, 200)
  // 密码空字符串表示「不修改」，删除要走 clear*Pass
  if (typeof patch.pass === 'string' && patch.pass.trim()) next.pass = patch.pass.trim()
  if (patch.port !== undefined) next.port = clamp(patch.port, 1, 65535, base.port)
  if (patch.secure !== undefined) next.secure = Boolean(patch.secure)
  return next
}

export class Settings {
  constructor(root) {
    this.file = join(root, 'settings.json')
    this.value = null
  }

  async read() {
    try {
      // 有人会用带 BOM 的编辑器改这个文件，JSON.parse 不认 BOM
      const saved = JSON.parse((await readFile(this.file, 'utf8')).replace(/^\uFEFF/, ''))
      this.value = {
        ...DEFAULTS, ...saved,
        mail: {
          ...DEFAULTS.mail, ...(saved.mail ?? {}),
          imap: { ...DEFAULTS.mail.imap, ...(saved.mail?.imap ?? {}) },
          smtp: { ...DEFAULTS.mail.smtp, ...(saved.mail?.smtp ?? {}) },
        },
        quotes: { ...DEFAULTS.quotes, ...(saved.quotes ?? {}) },
        workHours: { ...DEFAULTS.workHours, ...(saved.workHours ?? {}) },
        brief: { ...DEFAULTS.brief, ...(saved.brief ?? {}) },
      }
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
      this.value = structuredClone(DEFAULTS)
    }
    return this.value
  }

  /** 空的密码字段表示不修改；clearImapPass 才删除。 */
  async update(patch) {
    const current = await this.read()
    const next = structuredClone(current)
    if (patch.mail && typeof patch.mail === 'object') {
      const mail = patch.mail
      if (mail.provider !== undefined) {
        if (!['demo', 'imap', 'dsh-email'].includes(mail.provider)) throw Object.assign(new Error('邮件来源无效'), { status: 400 })
        next.mail.provider = mail.provider
      }
      if (typeof mail.account === 'string') next.mail.account = mail.account.trim().slice(0, 120)
      if (typeof mail.address === 'string') next.mail.address = mail.address.trim().slice(0, 200)
      if (typeof mail.folder === 'string') next.mail.folder = mail.folder.trim().slice(0, 120) || 'INBOX'
      if (mail.imap) next.mail.imap = mergeEndpoints(next.mail.imap, mail.imap)
      if (mail.smtp) next.mail.smtp = mergeEndpoints(next.mail.smtp, mail.smtp)
      if (mail.clearImapPass === true) next.mail.imap.pass = ''
      if (mail.clearSmtpPass === true) next.mail.smtp.pass = ''
      if (mail.syncSec !== undefined) next.mail.syncSec = clamp(mail.syncSec, 30, 3600, next.mail.syncSec)
      // 填了 host 却没填端口时，给常见默认值兜底
      if (next.mail.imap.host && next.mail.imap.port === 993 && /^smtp\./i.test(next.mail.imap.host)) next.mail.imap.port = 993
    }
    if (patch.quotes && typeof patch.quotes === 'object') {
      if (patch.quotes.enabled !== undefined) next.quotes.enabled = Boolean(patch.quotes.enabled)
      if (patch.quotes.intervalSec !== undefined) next.quotes.intervalSec = clamp(patch.quotes.intervalSec, 3, 300, next.quotes.intervalSec)
    }
    if (patch.workHours && typeof patch.workHours === 'object') {
      for (const key of ['start', 'end']) {
        if (typeof patch.workHours[key] === 'string' && /^\d{2}:\d{2}$/.test(patch.workHours[key])) next.workHours[key] = patch.workHours[key]
      }
    }
    if (patch.brief && typeof patch.brief === 'object') {
      if (patch.brief.auto !== undefined) next.brief.auto = Boolean(patch.brief.auto)
      if (typeof patch.brief.at === 'string' && /^\d{2}:\d{2}$/.test(patch.brief.at)) next.brief.at = patch.brief.at
    }
    if (['zh', 'en'].includes(patch.language)) next.language = patch.language
    const tmp = `${this.file}.${process.pid}.tmp`
    await writeFile(tmp, JSON.stringify(next, null, 2), { mode: 0o600 })
    await chmod(tmp, 0o600)
    await rename(tmp, this.file)
    this.value = next
    return next
  }
}

/** 发给浏览器的版本：只说有没有密码、末四位是什么。 */
export function publicSettings(settings) {
  const imap = { ...settings.mail.imap }
  const smtp = { ...settings.mail.smtp }
  const imapKey = imap.pass ?? ''
  const smtpKey = smtp.pass ?? ''
  delete imap.pass
  delete smtp.pass
  return {
    ...settings,
    mail: {
      ...settings.mail,
      imap: { ...imap, hasPass: Boolean(imapKey), passHint: imapKey.slice(-4) },
      smtp: { ...smtp, hasPass: Boolean(smtpKey), passHint: smtpKey.slice(-4) },
    },
  }
}

export function mailConfigured(settings) {
  if (settings.mail?.provider === 'dsh-email') return true
  const imap = settings.mail?.imap ?? {}
  return Boolean(settings.mail?.provider === 'imap' && imap.host && imap.user && imap.pass)
}

/** dsh-email 是否真的可用，由 host 用工具探测后传进来。 */
export function mailReady(settings, pluginAvailable = false) {
  if (settings.mail?.provider === 'dsh-email') return pluginAvailable
  return mailConfigured(settings)
}
