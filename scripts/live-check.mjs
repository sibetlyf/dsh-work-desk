// 联调脚本：用真网络跑一遍 host 的接口，验证行情能拿到、ops 能写、晨报能生成。
// 只读公开行情，不碰用户的 ~/.dsh（DSH_HOME 指到临时目录）。
import http from 'node:http'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

process.env.DSH_HOME = await mkdtemp(join(tmpdir(), 'work-desk-live-'))
const { default: plugin } = await import('../src/host.js')

const cleanups = []
const routes = []
const ctx = {
  effect(fn) { const d = fn(); if (typeof d === 'function') cleanups.push(d); return d },
  get(name) { if (name === 'connection') return { requestRejection: () => undefined } },
  webServer: { register(def) { routes.push(def); return () => {} } },
}
plugin.apply(ctx)
const server = http.createServer((req, res) => routes[0].handler(req, res))
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const base = `http://127.0.0.1:${server.address().port}/work-desk`

const call = async (path, body) => {
  const res = await fetch(`${base}/${path}`, body === undefined ? {} : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  return { status: res.status, data: await res.json().catch(() => null) }
}

const state = await call('state')
console.log('state:', state.status, '事件', state.data.state.events.length, '邮件', state.data.state.mails.length)
const quotes = Object.values(state.data.quotes ?? {})
for (const quote of quotes) {
  console.log(`  ${quote.symbol.padEnd(9)} ${String(quote.name).padEnd(6)} ${String(quote.price).padStart(9)}  ${(quote.changePct ?? 0).toFixed(2)}%  ${quote.quotedAt}`)
}
if (!quotes.length) console.log('  (没拿到行情，检查网络)')

const added = await call('ops', { ops: [{ op: 'add_watch', code: '600036' }, { op: 'add_position', code: '600036', shares: 500, cost: 40 }], label: '联调' })
console.log('ops:', added.status, added.data.receipts.map(row => row.text).join(' / '))

const after = await call('state')
console.log('新自选行情:', JSON.stringify(after.data.quotes.sh600036 ?? null))

const minute = await call('quote/minute?code=sh600519')
console.log('分时点数:', minute.data?.points?.length ?? 0, '昨收:', minute.data?.prevClose ?? '—')

const brief = await call('brief/generate', {})
console.log('晨报来源:', brief.data.brief.engine, '字数:', brief.data.brief.text.length)
console.log('--- 晨报 ---')
console.log(brief.data.brief.text.split('\n').slice(0, 12).join('\n'))

for (const dispose of cleanups.reverse()) { try { dispose() } catch {} }
server.close()
process.exit(0)
