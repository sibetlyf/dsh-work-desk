// 一个够用的 IMAP 客户端：TLS、LOGIN、SELECT、UID SEARCH/FETCH/STORE。
// 不引入 imapflow：工作台只读最近一批信件的头部 + 按需拉正文，几百行就够，也不会和宿主里
// 已装的邮件插件抢同一套依赖版本。协议按 RFC 3501 的 literal（{n} 后面跟 n 字节）解析。
import { connect as netConnect } from 'node:net'
import { connect as tlsConnect } from 'node:tls'

const CRLF = '\r\n'

function quote(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

/** 把 `{512}` 这种字面量读法和普通行放在一起解析。 */
class Channel {
  constructor(socket) {
    this.socket = socket
    this.buffer = Buffer.alloc(0)
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

  wait() {
    if (this.closed) return Promise.resolve()
    return new Promise(resolve => { this.wake = resolve })
  }

  async readToken() {
    for (;;) {
      const end = this.buffer.indexOf(CRLF)
      if (end >= 0) {
        const line = this.buffer.slice(0, end).toString('utf8')
        const literal = /\{(\d+)\}$/.exec(line)
        if (literal) {
          const size = Number(literal[1])
          if (this.buffer.length >= end + 2 + size) {
            const data = this.buffer.slice(end + 2, end + 2 + size)
            this.buffer = this.buffer.slice(end + 2 + size)
            return { line, data }
          }
        } else {
          this.buffer = this.buffer.slice(end + 2)
          return { line, data: null }
        }
      }
      if (this.closed) {
        if (this.error) throw this.error
        throw new Error('IMAP 连接已关闭')
      }
      await this.wait()
    }
  }
}

export class ImapClient {
  constructor(socket) {
    this.socket = socket
    this.channel = new Channel(socket)
    this.seq = 0
    this.tail = Promise.resolve()
    this.uidValidity = null
    this.exists = 0
  }

  static connect({ host, port = 993, secure = true, timeout = 20_000 }) {
    return new Promise((resolve, reject) => {
      const socket = secure
        ? tlsConnect({ host, port, servername: host, rejectUnauthorized: true })
        : netConnect({ host, port })
      const timer = setTimeout(() => {
        socket.destroy()
        reject(new Error(`连接 ${host}:${port} 超时`))
      }, timeout)
      const ready = () => {
        clearTimeout(timer)
        socket.setTimeout(0)
        resolve(new ImapClient(socket))
      }
      socket.once(secure ? 'secureConnect' : 'connect', ready)
      socket.once('error', err => {
        clearTimeout(timer)
        reject(err)
      })
    })
  }

  async start() {
    const greeting = await this.channel.readToken()
    if (!/^\*\s+(OK|PREAUTH)/i.test(greeting.line)) throw new Error(`IMAP 握手失败：${greeting.line.slice(0, 120)}`)
    return this
  }

  /** 同一个连接上串行跑命令，避免响应交错。 */
  run(task) {
    const next = this.tail.then(task, task)
    this.tail = next.catch(() => {})
    return next
  }

  async command(text) {
    const tag = `A${++this.seq}`
    this.socket.write(`${tag} ${text}${CRLF}`)
    const tokens = []
    for (;;) {
      const token = await this.channel.readToken()
      tokens.push(token)
      if (token.line.startsWith(`${tag} `)) {
        const status = token.line.slice(tag.length + 1)
        if (!/^OK/i.test(status)) throw new Error(`IMAP ${text.split(' ')[0]} 失败：${status.slice(0, 160)}`)
        return tokens
      }
      if (/^\*\s+BYE/i.test(token.line)) throw new Error('IMAP 服务端断开连接')
    }
  }

  login(user, pass) {
    return this.run(async () => {
      try {
        await this.command(`LOGIN ${quote(user)} ${quote(pass)}`)
      } catch (err) {
        if (/LOGIN failed|AUTHENTICATIONFAILED|Invalid credentials/i.test(err.message)) {
          throw new Error('邮箱账号或授权码不对（QQ/163 需要的是「授权码」，不是登录密码）')
        }
        throw err
      }
      return this
    })
  }

  select(mailbox = 'INBOX') {
    return this.run(async () => {
      const tokens = await this.command(`SELECT ${quote(mailbox)}`)
      for (const { line } of tokens) {
        const exists = /^\*\s+(\d+)\s+EXISTS/i.exec(line)
        if (exists) this.exists = Number(exists[1])
        const uidValidity = /\[UIDVALIDITY\s+(\d+)\]/i.exec(line)
        if (uidValidity) this.uidValidity = Number(uidValidity[1])
      }
      return { exists: this.exists, uidValidity: this.uidValidity }
    })
  }

  list() {
    return this.run(async () => {
      const tokens = await this.command('LIST "" "*"')
      const folders = []
      for (const { line } of tokens) {
        const match = /^\*\s+LIST\s+\(([^)]*)\)\s+(?:"([^"]*)"|NIL)\s+(.*)$/i.exec(line)
        if (!match) continue
        const name = match[3].trim().replace(/^"|"$/g, '')
        folders.push({ name, flags: match[1].split(/\s+/).filter(Boolean) })
      }
      return folders
    })
  }

  /** 返回 uid 数组（升序）。 */
  uidSearch(criteria = 'ALL') {
    return this.run(async () => {
      const tokens = await this.command(`UID SEARCH ${criteria}`)
      const uids = []
      for (const { line } of tokens) {
        const match = /^\*\s+SEARCH\s+(.*)$/i.exec(line)
        if (match) uids.push(...match[1].trim().split(/\s+/).filter(Boolean).map(Number).filter(Boolean))
      }
      return uids.sort((a, b) => a - b)
    })
  }

  /**
   * 拉一批邮件的头部 + 正文前 2KB（列表要一句摘要）。返回 [{uid, flags, internalDate, headers, preview}]
   * 全文不下载，只有打开某一封时才拉。
   */
  fetchHeaders(uids) {
    if (!uids.length) return Promise.resolve([])
    return this.run(async () => {
      const fields = 'FROM TO CC SUBJECT DATE MESSAGE-ID IN-REPLY-TO REFERENCES CONTENT-TYPE'
      const range = uids.join(',')
      const tokens = await this.command(`UID FETCH ${range} (UID FLAGS INTERNALDATE BODY.PEEK[HEADER.FIELDS (${fields})] BODY.PEEK[TEXT]<0.2048>)`)
      const rows = []
      let row = null
      for (const { line, data } of tokens) {
        const match = /^\*\s+\d+\s+FETCH/i.exec(line)
        if (match) {
          const uid = Number(/UID\s+(\d+)/i.exec(line)?.[1] ?? 0)
          if (!uid) continue
          row = {
            uid,
            flags: /FLAGS\s+\(([^)]*)\)/i.exec(line)?.[1] ?? '',
            internalDate: /INTERNALDATE\s+"([^"]*)"/i.exec(line)?.[1] ?? null,
            headers: '',
            preview: '',
          }
          rows.push(row)
        }
        if (!row || !data) continue
        if (/BODY\[TEXT\]/i.test(line)) row.preview = data.toString('utf8')
        else if (/HEADER/i.test(line)) row.headers = data.toString('utf8')
      }
      return rows
    })
  }

  /** 整封邮件原文（含头部），用于按需打开正文。 */
  fetchRaw(uid) {
    return this.run(async () => {
      const tokens = await this.command(`UID FETCH ${uid} (BODY.PEEK[])`)
      for (const { data } of tokens) if (data) return data.toString('utf8')
      return ''
    })
  }

  /** action: add | remove。flags 例如 ['\\Seen']。 */
  storeFlags(uid, action, flags) {
    return this.run(() => this.command(`UID STORE ${uid} ${action === 'remove' ? '-' : '+'}FLAGS (${flags.join(' ')})`))
  }

  /** 归档：复制到目标文件夹再打删除标记。服务器不支持的 COPY 会抛错，由上层降级。 */
  async moveTo(uid, folder) {
    await this.run(() => this.command(`UID COPY ${uid} ${quote(folder)}`))
    await this.run(() => this.command(`UID STORE ${uid} +FLAGS (\\Deleted)`))
    await this.run(() => this.command('EXPUNGE'))
  }

  async logout() {
    try {
      await this.command('LOGOUT')
    } catch {
      // 断开时的错误不用管
    }
    this.socket.destroy()
  }
}

/**
 * 建立一个已登录、已 SELECT 的连接。调用方负责 logout。
 * @param {{host: string, port: number, secure: boolean, user: string, pass: string, mailbox?: string}} config - 连接参数。
 */
export async function openImap(config) {
  const client = await ImapClient.connect(config)
  await client.start()
  await client.login(config.user, config.pass)
  await client.select(config.mailbox ?? 'INBOX')
  return client
}
