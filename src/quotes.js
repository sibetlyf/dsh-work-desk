// 行情：腾讯公开行情接口。A 股 / 港股 / 美股 / 指数共用一个文本协议，GBK 编码。
// 这里只做三件事：把代码规整成带市场前缀的 symbol、解析文本、按需刷新并缓存。

const QUOTE_ENDPOINT = 'https://qt.gtimg.cn/q='
const MINUTE_ENDPOINT = 'https://web.ifzq.gtimg.cn/appstock/app/minute/query?code='
const MAX_CODES = 60
const TTL_MS = 3000
const MINUTE_TTL_MS = 45_000
// 腾讯偶尔不认默认 UA，带上更稳
const HEADERS = { 'user-agent': 'Mozilla/5.0 (compatible; dsh-work-desk/0.1)', referer: 'https://gu.qq.com/' }

const num = value => {
  const n = Number(String(value ?? '').trim())
  return Number.isFinite(n) ? n : null
}

export function marketOf(symbol) {
  const head = String(symbol).slice(0, 2).toLowerCase()
  if (head === 'sh' || head === 'sz') return head
  if (head === 'hk') return 'hk'
  if (head === 'us') return 'us'
  return null
}

/**
 * 把用户输入的代码规整成 symbol。规则保守：带前缀就用前缀，纯 6 位按沪深规则猜，
 * 5 位当港股，字母当美股 —— 猜错时用户显式写前缀即可。
 * @param {string} input - 600519 / sh600519 / 00700 / AAPL。
 * @returns {string|null} symbol 或 null。
 */
export function normalizeCode(input) {
  const raw = String(input ?? '').trim()
  if (!raw) return null
  const prefixed = /^(sh|sz|hk|us)([0-9a-z.]+)$/i.exec(raw)
  if (prefixed) {
    const market = prefixed[1].toLowerCase()
    const body = market === 'us' ? prefixed[2].toUpperCase() : prefixed[2]
    return `${market}${body}`
  }
  if (/^\d{6}$/.test(raw)) return `${/^[69]/.test(raw) ? 'sh' : 'sz'}${raw}`
  if (/^\d{5}$/.test(raw)) return `hk${raw}`
  if (/^[A-Za-z][A-Za-z.-]{0,9}$/.test(raw)) return `us${raw.toUpperCase()}`
  return null
}

export function displaySymbol(symbol) {
  // 各家习惯都是只写代码本身：600519 / 00700 / AAPL
  return String(symbol).slice(2)
}

function normalizeTime(raw, market) {
  const text = String(raw ?? '').trim()
  if (!text) return null
  if (market === 'sh' || market === 'sz') {
    // 20261109095934
    if (/^\d{14}$/.test(text)) return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}T${text.slice(8, 10)}:${text.slice(10, 12)}:${text.slice(12, 14)}`
    return text
  }
  return text.replace(/\//g, '-')
}

/**
 * 解析一行 `v_sh600519="1~贵州茅台~600519~1444.21~...";` 里的 payload。
 * 字段位在 A 股 / 港股 / 美股上是一致的（3 现价、4 昨收、5 今开、31 涨跌、32 涨跌幅、33 高、34 低、30 时间）。
 * @param {string} symbol - 规整后的 symbol。
 * @param {string} payload - 引号里的内容。
 * @returns {object|null} 行情快照。
 */
export function parseQuote(symbol, payload) {
  const f = String(payload).split('~')
  if (f.length < 35) return null
  const market = marketOf(symbol)
  const price = num(f[3])
  const prevClose = num(f[4])
  if (price === null) return null
  const change = num(f[31]) ?? (prevClose ? price - prevClose : null)
  const changePct = num(f[32]) ?? (prevClose ? ((price - prevClose) / prevClose) * 100 : null)
  return {
    symbol,
    market,
    name: f[1] || displaySymbol(symbol),
    code: f[2] || displaySymbol(symbol),
    price,
    prevClose,
    open: num(f[5]),
    high: num(f[33]),
    low: num(f[34]),
    change,
    changePct,
    volume: num(f[6]),
    quotedAt: normalizeTime(f[30], market),
    currency: market === 'us' ? 'USD' : market === 'hk' ? 'HKD' : 'CNY',
  }
}

/**
 * 解析整个响应体（多行）。
 * @param {string} text - 解码后的文本。
 * @returns {{quotes: object[], errors: string[]}} 行情与失败的 symbol。
 */
export function parseQuoteResponse(text) {
  const quotes = []
  const errors = []
  for (const line of String(text).split(';')) {
    const match = /v_([a-z]{2}[0-9A-Za-z.]+)="([^"]*)"/.exec(line)
    if (!match) continue
    const quote = parseQuote(match[1], match[2])
    if (quote) quotes.push(quote)
    else errors.push(match[1])
  }
  return { quotes, errors }
}

async function readGbk(res) {
  const buffer = Buffer.from(await res.arrayBuffer())
  // Node 自带 full-icu，gbk 解码不用第三方依赖
  return new TextDecoder('gbk').decode(buffer)
}

export async function fetchQuotes(codes, { fetchImpl = fetch } = {}) {
  const symbols = [...new Set(codes.map(normalizeCode).filter(Boolean))].slice(0, MAX_CODES)
  if (!symbols.length) return { quotes: [], errors: [], fetchedAt: new Date().toISOString() }
  const res = await fetchImpl(`${QUOTE_ENDPOINT}${symbols.join(',')}`, { headers: HEADERS })
  if (!res.ok) throw new Error(`行情接口返回 ${res.status}`)
  const { quotes, errors } = parseQuoteResponse(await readGbk(res))
  return { quotes, errors, fetchedAt: new Date().toISOString() }
}

/**
 * 分时：接口给的是 `0930 1440.06 186 26785115.56` 这种空格分隔的串。
 * @param {string} symbol - 规整后的 symbol。
 * @returns {Promise<{points: {t: string, price: number, volume: number}[], prevClose: number|null}>} 分时点。
 */
export async function fetchMinute(symbol, { fetchImpl = fetch } = {}) {
  const res = await fetchImpl(`${MINUTE_ENDPOINT}${symbol}`, { headers: HEADERS })
  if (!res.ok) throw new Error(`分时接口返回 ${res.status}`)
  const data = await res.json()
  const node = data?.data?.[symbol]
  const rows = node?.data?.data
  if (!Array.isArray(rows)) return { points: [], prevClose: null }
  const points = []
  for (const row of rows) {
    const [t, price, volume] = String(row).split(' ')
    const p = num(price)
    if (!t || p === null) continue
    points.push({ t: `${t.slice(0, 2)}:${t.slice(2)}`, price: p, volume: num(volume) ?? 0 })
  }
  const qt = node?.qt?.[symbol]
  return { points, prevClose: Array.isArray(qt) ? num(qt[4]) : null }
}

/** 交易时段：只用于决定要不要主动轮询，判错最多多刷几次。 */
export function isTradingHours(date = new Date()) {
  const day = date.getDay()
  if (day === 0 || day === 6) return false
  // 美股按北京时间 21:30–04:00，跨零点
  const minutes = date.getHours() * 60 + date.getMinutes()
  return (minutes >= 570 && minutes <= 690) || (minutes >= 780 && minutes <= 900) || minutes >= 1290 || minutes <= 240
}

/**
 * 行情看板：带 TTL 的缓存，刷新失败时保留上一次的值并记下错误。
 */
export class QuoteBoard {
  constructor({ fetchImpl = fetch } = {}) {
    this.fetchImpl = fetchImpl
    this.cache = new Map()
    this.minutes = new Map()
    this.error = null
    this.fetchedAt = null
    this.inflight = null
  }

  snapshot(codes) {
    const quotes = {}
    const missing = []
    for (const code of codes) {
      const symbol = normalizeCode(code)
      if (!symbol) continue
      const hit = this.cache.get(symbol)
      if (hit) quotes[symbol] = hit
      else missing.push(symbol)
    }
    return { quotes, missing, error: this.error, fetchedAt: this.fetchedAt }
  }

  /** 并发调用只发一次请求。 */
  async refresh(codes, { force = false } = {}) {
    const symbols = [...new Set(codes.map(normalizeCode).filter(Boolean))]
    const now = Date.now()
    const stale = symbols.filter(symbol => {
      const hit = this.cache.get(symbol)
      return force || !hit || now - Date.parse(hit._at) > TTL_MS
    })
    if (!stale.length) return this.snapshot(codes)
    if (this.inflight) await this.inflight.catch(() => {})
    this.inflight = (async () => {
      const fresh = []
      for (let i = 0; i < stale.length; i += MAX_CODES) {
        const page = await fetchQuotes(stale.slice(i, i + MAX_CODES), { fetchImpl: this.fetchImpl })
        fresh.push(...page.quotes)
      }
      const at = new Date().toISOString()
      for (const quote of fresh) this.cache.set(quote.symbol, { ...quote, _at: at })
      this.error = null
      this.fetchedAt = at
    })()
    try {
      await this.inflight
    } catch (err) {
      this.error = err.message
    } finally {
      this.inflight = null
    }
    return this.snapshot(codes)
  }

  async minute(symbol, { force = false } = {}) {
    const key = normalizeCode(symbol)
    if (!key) return { points: [], prevClose: null }
    const hit = this.minutes.get(key)
    if (!force && hit && Date.now() - hit.at < MINUTE_TTL_MS) return hit.value
    try {
      const value = await fetchMinute(key, { fetchImpl: this.fetchImpl })
      this.minutes.set(key, { at: Date.now(), value })
      return value
    } catch {
      return hit?.value ?? { points: [], prevClose: null }
    }
  }
}
