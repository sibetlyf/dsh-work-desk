// 最小 SMTP 发信：465 隐式 TLS，或 587 STARTTLS。只发纯文本（正文 base64 编码），附件 v0.1 不支持。
// 发信是显式动作：界面上必须点「确认发送」，助手只能写草稿。
import { connect as netConnect } from 'node:net'
import { connect as tlsConnect } from 'node:tls'
import { randomUUID } from 'node:crypto'

const CRLF = '\r\n'

class LineReader {
  constructor(socket) {
    this.buffer = Buffer.alloc(0)
    this.lines = []
    this.closed = false
    this.error = null
    this.wake = null
    socket.on('data', chunk => {
      this.buffer = Buffer.concat([this.buffer, chunk])
      this.wake?.()
      this.wake = null
    })
    socket.on('error', err => {
      this.error = err
      this.closed = true
      this.wake?.()
      this.wake = null
    })
    socket.on('close', () => {
      this.closed = true
      this.wake?.()
      this.wake = null
    })
  }

  async line() {
    for (;;) {
      const end = this.buffer.indexOf(CRLF)
      if (end >= 0) {
        const line = this.buffer.slice(0, end).toString('utf8')
        this.buffer = this.buffer.slice(end + 2)
        return line
      }
      if (this.closed) {
        if (this.error) throw this.error
        throw new Error('SMTP 连接已关闭')
      }
      await new Promise(resolve => { this.wake = resolve })
    }
  }
}

function base64(text) {
  return Buffer.from(String(text), 'utf8').toString('base64')
}

function encodeHeader(value) {
  const text = String(value ?? '')
  if (/^[\x20-\x7e]*$/.test(text)) return text
  return `=?UTF-8?B?${base64(text)}?=`
}

class Session {
  constructor(socket) {
    this.socket = socket
    this.reader = new LineReader(socket)
  }

  async expect(codes) {
    const wanted = new Set([].concat(codes).map(Number))
    let last = ''
    for (;;) {
      const line = await this.reader.line()
      last = line
      const match = /^(\d{3})([ -])/.exec(line)
      if (!match) continue
      if (match[2] === '-') continue
      const code = Number(match[1])
      if (!wanted.has(code)) throw new Error(`SMTP 返回 ${line.slice(0, 160)}`)
      return last
    }
  }

  write(text) {
    this.socket.write(`${text}${CRLF}`)
  }

  async cmd(text, codes) {
    this.write(text)
    return this.expect(codes)
  }

  async auth(user, pass) {
    const mechanisms = await this.cmd('EHLO work-desk', 250)
    if (/\bAUTH\b/i.test(mechanisms)) {
      this.write('AUTH LOGIN')
      await this.expect(334)
      this.write(base64(user))
      await this.expect(334)
      this.write(base64(pass))
      await this.expect(235)
      return
    }
    // 老服务器只认 AUTH PLAIN
    this.write(`AUTH PLAIN ${base64(`\0${user}\0${pass}`)}`)
    await this.expect(235)
  }

  async upgrade(host) {
    const plain = this.socket
    this.write('STARTTLS')
    await this.expect(220)
    this.socket = await new Promise((resolve, reject) => {
      const secure = tlsConnect({ socket: plain, servername: host, rejectUnauthorized: true }, () => resolve(secure))
      secure.once('error', reject)
    })
    this.reader = new LineReader(this.socket)
    await this.cmd('EHLO work-desk', 250)
  }
}

/**
 * 发一封信。所有参数都来自用户在界面上的确认。
 * @param {object} options - 连接与内容。
 * @returns {Promise<{messageId: string}>} 发出去的消息 id。
 */
export async function sendMail({ host, port = 465, secure = true, user, pass, from, to, cc = '', subject, text, inReplyTo = '', references = '' }) {
  if (!host || !user || !pass) throw new Error('还没配置发信服务器')
  const recipients = [to, cc].join(',').split(/[,;]/).map(row => row.trim()).filter(Boolean)
  if (!recipients.length) throw new Error('没有收件人')

  const socket = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`连接 ${host}:${port} 超时`)), 20_000)
    const conn = secure ? tlsConnect({ host, port, servername: host, rejectUnauthorized: true }) : netConnect({ host, port })
    conn.once(secure ? 'secureConnect' : 'connect', () => {
      clearTimeout(timer)
      resolve(conn)
    })
    conn.once('error', err => {
      clearTimeout(timer)
      reject(err)
    })
  })

  const session = new Session(socket)
  const messageId = `<${randomUUID()}@work-desk>`
  try {
    await session.expect(220)
    await session.cmd('EHLO work-desk', 250)
    if (!secure) await session.upgrade(host)
    await session.auth(user, pass)
    await session.cmd(`MAIL FROM:<${from || user}>`, 250)
    for (const rcpt of recipients) await session.cmd(`RCPT TO:<${rcpt}>`, [250, 251])

    const headers = [
      `From: ${encodeHeader(from || user)} <${from || user}>`,
      `To: ${recipients.map(addr => `<${addr}>`).join(', ')}`,
      `Subject: ${encodeHeader(subject)}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: ${messageId}`,
      inReplyTo ? `In-Reply-To: ${inReplyTo}` : '',
      references ? `References: ${references}` : '',
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: base64',
    ].filter(Boolean)
    const body = base64(text).replace(/(.{76})/g, `$1${CRLF}`)
    // 行首的点要转义，否则会被当成结束标记
    const payload = `${headers.join(CRLF)}${CRLF}${CRLF}${body}`.replace(/^\./gm, '..')
    await session.cmd('DATA', 354)
    session.write(payload)
    session.write('.')
    await session.expect(250)
    try {
      await session.cmd('QUIT', 221)
    } catch {
      // QUIT 之后断开是常态
    }
    return { messageId }
  } finally {
    socket.destroy()
  }
}
