import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decodeWords, decodeQuotedPrintable, htmlToText, parseAddresses, parseHeaders, parseMessage, snippetOf } from '../src/mail/mime.js'

const b64 = text => Buffer.from(text, 'utf8').toString('base64')

test('RFC 2047 头部解码：B 和 Q 两种', () => {
  assert.equal(decodeWords(`=?UTF-8?B?${b64('发布窗口确认一下')}?=`), '发布窗口确认一下')
  assert.equal(decodeWords('=?UTF-8?Q?=E5=91=A8=E4=B8=89?='), '周三')
  assert.equal(decodeWords('Re: =?UTF-8?B?5L2g5aW9?= 和 mix'), 'Re: 你好 和 mix')
})

test('quoted-printable 解码保留中文', () => {
  const buffer = Buffer.from('=E5=91=A8=E4=B8=89=E6=99=9A=E4=B8=8A=E5=8F=AF=E4=BB=A5', 'latin1')
  assert.equal(decodeQuotedPrintable(buffer).toString('utf8'), '周三晚上可以')
})

test('头部折行合并、同名重复保留', () => {
  const headers = parseHeaders('Subject: 第一行\n 第二行\nReceived: a\nReceived: b\n')
  assert.equal(headers.subject, '第一行 第二行')
  assert.equal(headers.received, 'a, b')
})

test('地址解析：带名字、不带名字、多个收件人', () => {
  const list = parseAddresses('王强 <wangqiang@company.com>, chen@x.com')
  assert.deepEqual(list, [
    { name: '王强', address: 'wangqiang@company.com' },
    { name: '', address: 'chen@x.com' },
  ])
})

test('HTML 转纯文本：去掉标签、保留段落、解实体', () => {
  const text = htmlToText('<style>p{}</style><p>第一段</p><div>第二段 &amp; 更多</div><br><script>alert(1)</script>')
  assert.equal(text, '第一段\n第二段 & 更多')
})

test('多部分邮件：纯文本 + HTML 备用 + 附件清单', () => {
  const html = '<p>周三晚上可以。</p>'
  const pdf = '%PDF-1.4\n'
  const raw = [
    'From: 王强 <wangqiang@company.com>',
    `Subject: =?UTF-8?B?${b64('Re: 发布窗口')}?=`,
    'To: demo@company.com',
    'Date: Mon, 09 Nov 2026 09:30:00 +0800',
    'Message-ID: <abc@company.com>',
    'Content-Type: multipart/mixed; boundary="B1"',
    '',
    '--B1',
    'Content-Type: multipart/alternative; boundary="B2"',
    '',
    '--B2',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: quoted-printable',
    '',
    '=E5=91=A8=E4=B8=89=E6=99=9A=E4=B8=8A=E5=8F=AF=E4=BB=A5=E3=80=82',
    '--B2',
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    b64(html),
    '--B2--',
    '--B1',
    'Content-Type: application/pdf; name="a.pdf"',
    'Content-Disposition: attachment; filename="a.pdf"',
    'Content-Transfer-Encoding: base64',
    '',
    b64(pdf),
    '--B1--',
    '',
  ].join('\n')

  const message = parseMessage(raw)
  assert.equal(message.subject, 'Re: 发布窗口')
  assert.equal(message.from[0].name, '王强')
  assert.match(message.text, /周三晚上可以/)
  assert.equal(message.attachments.length, 1)
  assert.equal(message.attachments[0].filename, 'a.pdf')
  assert.equal(message.attachments[0].contentType, 'application/pdf')
  assert.equal(message.messageId, '<abc@company.com>')
  assert.ok(message.date.startsWith('2026-11-09'))
})

test('摘要去掉引用块和多余空白', () => {
  const text = '第一行\n> 引用\n\n第二行  多余空格'
  assert.equal(snippetOf(text), '第一行 第二行 多余空格')
  assert.equal(snippetOf('x'.repeat(200), 10), `${'x'.repeat(10)}…`)
})
