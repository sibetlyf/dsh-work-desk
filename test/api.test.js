// 冒烟测试：把 host 的路由挂到一个真 http 服务上，按浏览器的方式调一遍。
// 不发真实行情请求（fetch 被打桩），也不碰用户的 ~/.dsh（DSH_HOME 指到临时目录）。
import { test } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const realFetch = globalThis.fetch
const offline = async () => ({ ok: true, status: 200, arrayBuffer: async () => Buffer.from(''), json: async () => ({ data: {} }) })
globalThis.fetch = offline

// 假的 dsh-email 工具：接口形状照着其 lib/tools.js 的 public 定义，返回固定邮件
const TOOL_NAMES = ['email_list', 'email_read', 'email_mark', 'email_folders', 'email_draft']
const TOOL_VALUES = {
  email_list: {
    account: 'work', folder: 'INBOX', count: 2,
    messages: [
      { uid: 201, date: '2026-11-09T01:00:00Z', from: [{ name: '王强', address: 'wangqiang@company.com' }], subject: '插件里的信', seen: false, flagged: false, size: 1024, hasAttachments: false },
      { uid: 202, date: '2026-11-08T01:00:00Z', from: [{ name: '周舟', address: 'zhouzhou@company.com' }], subject: '上一封', seen: true, flagged: true, size: 2048, hasAttachments: true },
    ],
  },
  email_read: { uid: 201, subject: '插件里的信', text: '周三晚上可以。\n\n王强', from: [{ name: '王强', address: 'wangqiang@company.com' }], to: [{ address: 'me@company.com' }], date: '2026-11-09T01:00:00Z', attachments: [] },
  email_mark: { uid: 201, action: 'read', seen: true },
  email_folders: { account: 'work', folders: [{ name: 'INBOX', path: 'INBOX' }, { name: 'Sent', path: 'Sent' }] },
  email_draft: { id: 'draft_1', state: 'draft', subject: 'Re: 插件里的信' },
}
const toolCalls = []

function fakeTools() {
  const definitions = Object.fromEntries(TOOL_NAMES.map(name => [name, { name, parameters: { type: 'object', properties: {} }, output: { schema: { type: 'object' } } }]))
  return {
    executable: name => definitions[name],
    selectExecutor: () => ({ describe: defs => ({ schemas: defs.map(row => ({ name: row.name })) }) }),
    execute: async ({ calls }) => ({
      results: calls.map(call => {
        toolCalls.push({ name: call.name, args: JSON.parse(call.arguments) })
        return { callId: call.id, result: { isError: false, value: TOOL_VALUES[call.name] ?? {} } }
      }),
    }),
  }
}

const home = await mkdtemp(join(tmpdir(), 'work-desk-'))
process.env.DSH_HOME = home

const { default: plugin } = await import('../src/host.js')

function start() {
  const cleanups = []
  const routes = []
  const ctx = {
    effect(fn) {
      const dispose = fn()
      if (typeof dispose === 'function') cleanups.push(dispose)
      return dispose
    },
    get(name) {
      if (name === 'connection') return { requestRejection: () => undefined }
      if (name === 'tools') return fakeTools()
      return undefined
    },
    webServer: {
      register(def) {
        routes.push(def)
        return () => {}
      },
    },
  }
  plugin.apply(ctx)
  const handler = routes[0].handler
  const server = http.createServer((req, res) => handler(req, res))
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => {
      const base = `http://127.0.0.1:${server.address().port}/work-desk`
      resolve({
        base,
        close: () => new Promise(done => {
          for (const dispose of cleanups.reverse()) { try { dispose() } catch {} }
          server.close(() => done())
        }),
      })
    })
  })
}

const get = async (base, path) => {
  const res = await realFetch(`${base}/${path}`)
  return { status: res.status, body: await res.json().catch(() => null) }
}
const post = async (base, path, body, headers = {}) => {
  const res = await realFetch(`${base}/${path}`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) })
  return { status: res.status, body: await res.json().catch(() => null) }
}

test('工作台接口冒烟', async t => {
  const app = await start()
  t.after(() => app.close())

  await t.test('GET state 返回示例数据、没有行情也不报错', async () => {
    const { status, body } = await get(app.base, 'state')
    assert.equal(status, 200)
    assert.ok(body.state.events.length >= 4)
    assert.ok(body.state.mails.length >= 5)
    assert.equal(body.mail.provider, 'demo')
    assert.ok(Array.isArray(body.alerts))
    assert.equal(body.canUndo, false)
  })

  await t.test('POST ops 写一条日程并返回回执', async () => {
    const { status, body } = await post(app.base, 'ops', { ops: [{ op: 'add_event', title: '接口测试会', start: '2026-11-12T10:00:00+08:00' }], label: '测试' })
    assert.equal(status, 200)
    assert.equal(body.receipts.length, 1)
    assert.ok(body.state.events.some(event => event.title === '接口测试会'))
  })

  await t.test('撤销回滚上一步', async () => {
    const { body } = await post(app.base, 'undo', {})
    assert.ok(body.label)
    assert.ok(!body.state.events.some(event => event.title === '接口测试会'))
  })

  await t.test('没有模型时对话退回本地规则', async () => {
    const { status, body } = await post(app.base, 'chat', { message: '记一下：把周会纪要发到群里' })
    assert.equal(status, 200)
    assert.equal(body.answer.engine, 'local')
    assert.match(body.answer.text, /待办/)
    assert.ok(body.state.tasks.some(task => task.title.includes('周会纪要')))
  })

  await t.test('晨报在无模型时仍然生成', async () => {
    const { body } = await post(app.base, 'brief/generate', {})
    assert.ok(body.brief.text.length > 20)
    assert.equal(body.brief.engine, 'local')
    assert.ok(body.brief.counts.events >= 0)
  })

  await t.test('导出 ICS 是 text/calendar', async () => {
    const res = await realFetch(`${app.base}/ics?range=all`)
    assert.equal(res.status, 200)
    assert.match(res.headers.get('content-type'), /text\/calendar/)
    const text = await res.text()
    assert.match(text, /BEGIN:VCALENDAR/)
  })

  await t.test('跨站 POST 被拒绝', async () => {
    const { status } = await post(app.base, 'ops', { ops: [] }, { 'sec-fetch-site': 'cross-site' })
    assert.equal(status, 403)
  })

  await t.test('不存在的接口返回 404', async () => {
    const { status } = await get(app.base, 'nope')
    assert.equal(status, 404)
  })

  await t.test('接入 dsh-email：同步、读信、标记、写草稿都走插件工具', async () => {
    const saved = await post(app.base, 'settings', { mail: { provider: 'dsh-email', account: 'work' } })
    assert.equal(saved.status, 200)
    assert.equal(saved.body.mail.provider, 'dsh-email')

    const synced = await post(app.base, 'mail/sync', {})
    assert.equal(synced.body.added, 2)
    assert.equal(synced.body.account, 'work')

    const state = await get(app.base, 'state')
    assert.equal(state.body.mail.provider, 'dsh-email')
    assert.equal(state.body.mail.pluginAvailable, true)
    const target = state.body.state.mails.find(mail => mail.subject === '插件里的信')
    assert.ok(target, '插件返回的邮件应该进到 state.mails')
    assert.equal(target.unread, true)

    const read = await post(app.base, 'mail/read', { id: target.id })
    assert.match(read.body.mail.body, /周三晚上可以/)
    assert.equal(read.body.mail.unread, false)
    assert.ok(toolCalls.some(call => call.name === 'email_read' && call.args.uid === 201))

    const marked = await post(app.base, 'mail/mark', { id: target.id, action: 'star' })
    assert.equal(marked.body.state.mails.find(mail => mail.id === target.id).starred, true)
    assert.ok(toolCalls.some(call => call.name === 'email_mark' && call.args.action === 'star'))

    const draft = await post(app.base, 'mail/draft', { to: 'wangqiang@company.com', subject: 'Re: 插件里的信', text: '好的', replyToId: target.id })
    assert.equal(draft.body.ok, true)
    assert.equal(draft.body.id, 'draft_1')
    const reply = toolCalls.find(call => call.name === 'email_draft')
    assert.equal(reply.args.reply.mode, 'reply')

    // 插件模式下不允许从工作台直接发信
    const send = await post(app.base, 'mail/send', { to: 'a@b.com', subject: 'x', text: 'y' })
    assert.equal(send.status, 400)
  })
})
