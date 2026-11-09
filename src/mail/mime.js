// 邮件解析：只做工作台需要的部分 —— 头部、正文、附件清单。
// 不引入 mailparser：一个办公台不需要渲染 HTML，正文一律转纯文本更安全（也不会加载追踪像素）。

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'", '#34': '"', '#38': '&' }

export function decodeEntities(text) {
  return String(text).replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, key) => {
    if (ENTITIES[key]) return ENTITIES[key]
    if (/^#x/i.test(key)) return String.fromCodePoint(parseInt(key.slice(2), 16))
    if (/^#/.test(key)) return String.fromCodePoint(Number(key.slice(1)))
    return match
  })
}

/** RFC 2047：=?UTF-8?B?...?= / =?GBK?Q?...?= */
export function decodeWords(value) {
  return String(value ?? '').replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (match, charset, encoding, body) => {
    try {
      if (encoding.toUpperCase() === 'B') {
        const bytes = Buffer.from(body, 'base64')
        return new TextDecoder(normalizeCharset(charset)).decode(bytes)
      }
      const bytes = Buffer.from(body.replace(/_/g, ' ').replace(/=([0-9A-F]{2})/gi, (m, hex) => String.fromCharCode(parseInt(hex, 16))), 'latin1')
      return new TextDecoder(normalizeCharset(charset)).decode(bytes)
    } catch {
      return match
    }
  })
}

function normalizeCharset(value) {
  const tag = String(value ?? '').trim().toLowerCase()
  if (!tag) return 'utf-8'
  if (tag === 'gb2312' || tag === 'gbk' || tag === 'gb18030') return 'gbk'
  return tag
}

function decodeBuffer(buffer, charset, encoding) {
  const enc = String(encoding ?? '').toLowerCase()
  let bytes = buffer
  if (enc === 'base64') bytes = Buffer.from(buffer.toString('latin1').replace(/\s+/g, ''), 'base64')
  else if (enc === 'quoted-printable') bytes = decodeQuotedPrintable(buffer)
  try {
    return new TextDecoder(normalizeCharset(charset)).decode(bytes)
  } catch {
    return bytes.toString('utf8')
  }
}

export function decodeQuotedPrintable(buffer) {
  const text = buffer.toString('latin1').replace(/=\r?\n/g, '')
  const bytes = []
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    if (ch === '=' && /^[0-9A-F]{2}$/i.test(text.slice(i + 1, i + 3))) {
      bytes.push(parseInt(text.slice(i + 1, i + 3), 16))
      i += 2
    } else {
      bytes.push(text.charCodeAt(i) & 0xff)
    }
  }
  return Buffer.from(bytes)
}

/** 头部字段：同名重复的合并成数组（Received、References 之类）。 */
export function parseHeaders(block) {
  const map = {}
  const lines = String(block).replace(/\r\n/g, '\n').split('\n')
  let current = null
  for (const line of lines) {
    if (/^[ \t]/.test(line) && current) {
      map[current] += ` ${line.trim()}`
      continue
    }
    const colon = line.indexOf(':')
    if (colon < 1) continue
    const name = line.slice(0, colon).trim().toLowerCase()
    const value = line.slice(colon + 1).trim()
    if (map[name] === undefined) map[name] = value
    else map[name] = `${map[name]}, ${value}`
    current = name
  }
  return map
}

export function splitMessage(raw) {
  const text = String(raw).replace(/\r\n/g, '\n')
  const at = text.indexOf('\n\n')
  if (at < 0) return { head: text, body: '' }
  return { head: text.slice(0, at), body: text.slice(at + 2) }
}

function paramsOf(value) {
  const out = {}
  for (const part of String(value ?? '').split(';').slice(1)) {
    const eq = part.indexOf('=')
    if (eq < 0) continue
    out[part.slice(0, eq).trim().toLowerCase()] = part.slice(eq + 1).trim().replace(/^"|"$/g, '')
  }
  return out
}

export function htmlToText(html) {
  const text = String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, '\n')
    .replace(/<li[^>]*>/gi, '· ')
    .replace(/<[^>]+>/g, '')
  return decodeEntities(text)
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** "张三 <a@b.com>, c@d.com" → [{name, address}] */
export function parseAddresses(value) {
  const text = decodeWords(String(value ?? ''))
  const out = []
  for (const chunk of text.split(/,(?![^<]*>)/)) {
    const part = chunk.trim()
    if (!part) continue
    const match = /^(.*?)<([^>]+)>/.exec(part)
    if (match) {
      out.push({ name: match[1].trim().replace(/^"|"$/g, ''), address: match[2].trim() })
    } else if (/@/.test(part)) {
      out.push({ name: '', address: part.replace(/^"|"$/g, '') })
    }
  }
  return out
}

function walk(headers, body, depth, out) {
  if (depth > 5) return
  const ctype = headers['content-type'] ?? 'text/plain; charset=utf-8'
  const params = paramsOf(ctype)
  const type = String(ctype).split(';')[0].trim().toLowerCase()
  const dispositionHeader = headers['content-disposition'] ?? ''
  const disposition = String(dispositionHeader).split(';')[0].trim().toLowerCase()
  const dispositionParams = paramsOf(dispositionHeader)
  const filename = dispositionParams.filename ?? params.name ?? ''
  const needsDecode = type !== 'text/plain' && type !== 'text/html'
  const isAttachment = disposition === 'attachment' || (filename && needsDecode)
  if (isAttachment) {
    out.attachments.push({ filename: decodeWords(filename || '未命名'), contentType: type, size: Buffer.byteLength(body) })
    return
  }
  if (type.startsWith('multipart/')) {
    const boundary = params.boundary
    if (!boundary) return
    const parts = `\n${body}`.split(`--${boundary}`)
    for (const part of parts.slice(1)) {
      if (/^--/.test(part.trim())) break
      const raw = part.replace(/^\r?\n/, '')
      const split = splitMessage(raw)
      walk(parseHeaders(split.head), split.body, depth + 1, out)
    }
    return
  }
  const encoding = String(headers['content-transfer-encoding'] ?? '8bit')
  const decoded = decodeBuffer(Buffer.from(body, 'utf8'), params.charset, encoding)
  if (type === 'text/plain') out.texts.push(decoded)
  else if (type === 'text/html') out.htmls.push(decoded)
}

/**
 * 解析一封邮件。
 * @param {string} raw - 原始 RFC822 文本。
 * @returns {{headers: object, from: object[], to: object[], cc: object[], subject: string, text: string, html: string, attachments: object[], messageId: string, inReplyTo: string, references: string, date: string|null}} 解析结果。
 */
export function parseMessage(raw) {
  const { head, body } = splitMessage(raw)
  const headers = parseHeaders(head)
  const out = { texts: [], htmls: [], attachments: [] }
  walk(headers, body, 0, out)
  const text = out.texts.length ? out.texts.join('\n\n') : htmlToText(out.htmls.join('\n'))
  const date = headers.date ? new Date(headers.date) : null
  return {
    headers,
    from: parseAddresses(headers.from),
    to: parseAddresses(headers.to),
    cc: parseAddresses(headers.cc),
    subject: decodeWords(headers.subject ?? '(无主题)'),
    text: text.replace(/\n{3,}/g, '\n\n').trim().slice(0, 200_000),
    html: out.htmls.join('\n').slice(0, 400_000),
    attachments: out.attachments,
    messageId: headers['message-id'] ?? '',
    inReplyTo: headers['in-reply-to'] ?? '',
    references: headers.references ?? '',
    date: date && !Number.isNaN(date.getTime()) ? date.toISOString() : null,
  }
}

/** 取列表用的短摘要：去掉引用块和签名，最多 160 字。 */
export function snippetOf(text, limit = 160) {
  const cleaned = String(text ?? '')
    .split('\n')
    .filter(line => !/^\s*>/.test(line) && !/^--\s*$/.test(line))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned.length > limit ? `${cleaned.slice(0, limit)}…` : cleaned
}
