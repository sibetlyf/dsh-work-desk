// dsh-email 结合的单元测试：用一个假的 tools 执行器喂固定返回值，验证映射和调用参数。
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { draftVia, emailTool, foldersVia, listMail, markMailVia, probe, readMailVia, rowOf } from '../src/mail/dshmail.js'

const NAMES = ['email_list', 'email_read', 'email_mark', 'email_folders', 'email_draft']

function fakeCtx({ values = {}, missing = [], ptc = false } = {}) {
  const calls = []
  const definitions = Object.fromEntries(NAMES.map(name => [name, { name, parameters: { type: 'object', properties: {} }, output: { schema: { type: 'object' } } }]))
  return {
    calls,
    get(name) {
      if (name !== 'tools') return undefined
      return {
        executable: toolName => (missing.includes(toolName) ? undefined : definitions[toolName]),
        selectExecutor: () => ({ describe: defs => ({ schemas: ptc ? [] : defs.map(definition => ({ name: definition.name })) }) }),
        execute: async ({ calls: batch }) => ({
          results: batch.map(call => {
            calls.push({ name: call.name, args: JSON.parse(call.arguments) })
            const value = values[call.name]
            if (value && value.__error) return { callId: call.id, result: { isError: true, error: { message: value.__error } } }
            return { callId: call.id, result: { isError: false, value: value ?? {} } }
          }),
        }),
      }
    },
  }
}

const LIST = {
  account: 'work',
  folder: 'INBOX',
  count: 2,
  messages: [
    { uid: 201, date: '2026-11-09T01:00:00Z', from: [{ name: '王强', address: 'wangqiang@company.com' }], subject: '插件里的信', seen: false, flagged: false, size: 1000, hasAttachments: false },
    { uid: 'agentmail-abc', date: '2026-11-08T01:00:00Z', from: [{ name: '周舟', address: 'zhouzhou@company.com' }], subject: '上一封', seen: true, flagged: true, size: 2000, hasAttachments: true },
  ],
}

test('检测：缺工具、PTC 执行器、没有 tools 服务都判为不可用', () => {
  assert.equal(emailTool({ get: () => undefined }), null)
  assert.equal(emailTool(fakeCtx({ ptc: true })), null)
  assert.equal(emailTool(fakeCtx({ missing: ['email_read'] })), null)
  const ok = emailTool(fakeCtx())
  assert.ok(ok)
  assert.ok(ok.names.email_draft)
})

test('列表映射：未读/星标/附件/字符串 uid 都保留', async () => {
  const ctx = fakeCtx({ values: { email_list: LIST } })
  const { messages, account } = await listMail({ ctx, settings: { mail: { account: 'work' } } }, { limit: 20 })
  assert.equal(account, 'work')
  assert.equal(messages.length, 2)
  assert.equal(messages[0].id, 'work:INBOX:201')
  assert.equal(messages[0].unread, true)
  assert.equal(messages[0].from.name, '王强')
  assert.equal(messages[1].id, 'work:INBOX:agentmail-abc')
  assert.equal(messages[1].starred, true)
  assert.equal(messages[1].hasAttachments, true)
  assert.equal(messages[1].unread, false)
  assert.equal(ctx.calls[0].name, 'email_list')
  assert.deepEqual(ctx.calls[0].args, { account: 'work', limit: 20, unreadOnly: false })
})

test('读信：正文、附件清单、回执字段', async () => {
  const ctx = fakeCtx({ values: { email_read: { uid: 201, subject: '插件里的信', text: '周三晚上可以。', from: [{ name: '王强', address: 'a@b.com' }], to: [{ address: 'me@b.com' }], date: '2026-11-09T01:00:00Z', attachments: [{ filename: 'a.pdf', contentType: 'application/pdf', size: 10 }] } } })
  const mail = await readMailVia(ctx, { uid: 201, folder: 'INBOX', account: 'work' })
  assert.equal(mail.text, '周三晚上可以。')
  assert.equal(mail.attachments[0].filename, 'a.pdf')
  assert.deepEqual(ctx.calls[0].args, { uid: 201, folder: 'INBOX', account: 'work' })
})

test('标记：动作原样转发', async () => {
  const ctx = fakeCtx({ values: { email_mark: { seen: true } } })
  await markMailVia(ctx, { uid: 201, folder: 'INBOX', action: 'read' })
  assert.equal(ctx.calls[0].name, 'email_mark')
  assert.equal(ctx.calls[0].args.action, 'read')
})

test('写草稿：回复模式带 uid 和文件夹，不触发发送', async () => {
  const ctx = fakeCtx({ values: { email_draft: { id: 'd1', state: 'draft', subject: 'Re: 插件里的信' } } })
  const draft = await draftVia(ctx, { to: 'wangqiang@company.com', subject: 'Re: 插件里的信', text: '好的', replyTo: { uid: 201, folder: 'INBOX' } })
  assert.equal(draft.id, 'd1')
  assert.deepEqual(ctx.calls[0].args.reply, { uid: 201, folder: 'INBOX', mode: 'reply' })
  assert.ok(!ctx.calls.some(call => call.name === 'email_send'))
})

test('错误信息原样带出，不吞成「调用失败」', async () => {
  const ctx = fakeCtx({ values: { email_list: { __error: '还没配置邮箱，请先在设置里添加账户' } } })
  await assert.rejects(() => listMail({ ctx, settings: { mail: {} } }), /还没配置邮箱/)
})

test('测试连接返回账号与文件夹', async () => {
  const ctx = fakeCtx({ values: { email_folders: { account: 'work', folders: [{ name: 'INBOX', path: 'INBOX' }, { name: 'Sent', path: 'Sent' }] } } })
  const result = await probe(ctx)
  assert.equal(result.ok, true)
  assert.equal(result.account, 'work')
  assert.deepEqual(result.folders, ['INBOX', 'Sent'])
  const folders = await foldersVia(ctx, { account: 'work' })
  assert.equal(folders.folders[1].name, 'Sent')
})

test('rowOf 丢掉没有 uid 的行', () => {
  assert.equal(rowOf({ subject: 'x' }), null)
})
