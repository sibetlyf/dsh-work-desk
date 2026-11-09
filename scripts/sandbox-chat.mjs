// 沙盒里测「通过助手添加」：在真实 DSH 网页版里点开工作台，对助手说一句话，
// 看回执、看 state 里有没有真的多出一条日程。只用于本地验收。
import { mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'docs')
await mkdir(outDir, { recursive: true })

const base = process.env.SANDBOX_URL
if (!base) {
  console.error('缺少 SANDBOX_URL')
  process.exit(2)
}

const playwrightEntry = process.env.PLAYWRIGHT_ENTRY || 'E:/NodeJS/node_global/node_modules/playwright/index.js'
const playwright = await import(pathToFileURL(playwrightEntry).href)
const chromium = playwright.chromium ?? playwright.default?.chromium

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1500, height: 940 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', error => errors.push(`pageerror: ${error.message}`))
page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`) })

const stateOf = () => page.evaluate(async () => {
  const res = await fetch('work-desk/state', { headers: { 'cache-control': 'no-cache' } })
  const data = await res.json()
  return {
    events: data.state.events.map(event => ({ title: event.title, start: event.start, end: event.end })),
    tasks: data.state.tasks.length,
    model: data.model,
    modelOk: data.modelOk,
    provider: data.mail?.provider,
  }
})

await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60_000 })
await page.waitForSelector('[aria-label="办公工作台"]', { timeout: 45_000 })
await page.waitForTimeout(2000)
for (const name of ['稍后配置', '继续', '知道了']) {
  const button = page.getByRole('button', { name })
  if (await button.count()) {
    await button.first().click({ timeout: 5_000 }).catch(() => {})
    await page.waitForTimeout(700)
  }
}
await page.locator('[aria-label="办公工作台"]').first().click({ force: true, timeout: 10_000 })
await page.waitForSelector('.wd-hero-line', { timeout: 20_000 })

const botsBefore = await page.locator('.wd-msg.is-bot p').count()
const before = await stateOf()
console.log(`对话前：${before.events.length} 个日程，模型=${before.model ?? '无'}（modelOk=${before.modelOk}），已完成回复 ${botsBefore} 条`)

const message = process.env.SANDBOX_MESSAGE || '明天下午三点和设计对一下改版，40 分钟'
await page.locator('.wd-composer textarea').fill(message)
await page.locator('.wd-composer textarea').press('Enter')
console.log('已发送：', message)

// 只能等「比之前多一条完整回复」：「正在处理……」本身也是 .wd-msg.is-bot
await page.waitForFunction((target) => {
  const done = [...document.querySelectorAll('.wd-msg.is-bot')]
    .filter(node => node.querySelector('p') && !node.querySelector('.wd-shimmer'))
  return done.length >= target
}, botsBefore + 1, { timeout: 120_000 }).catch(() => console.log('等待新回复超时'))
await page.waitForTimeout(1200)

const reply = await page.evaluate(() => {
  const bots = [...document.querySelectorAll('.wd-msg.is-bot')].filter(node => node.querySelector('p'))
  const last = bots[bots.length - 1]
  return {
    text: last?.querySelector('p')?.innerText ?? '',
    receipts: [...(last?.querySelectorAll('.wd-receipt') ?? [])].map(node => node.innerText.trim()),
    engine: last?.querySelector('footer span')?.innerText ?? '',
    errors: [...(last?.querySelectorAll('.wd-msg-error') ?? [])].map(node => node.innerText.trim()),
    toast: document.querySelector('.wd-toast')?.innerText ?? '',
    thinking: Boolean(document.querySelector('.wd-dock-scroll .wd-shimmer')),
  }
})
console.log('助手回复：', reply.text)
console.log('回执：', JSON.stringify(reply.receipts))
console.log('来源：', reply.engine || '(空)')
if (reply.toast) console.log('提示条：', reply.toast)
if (reply.thinking) console.log('仍在处理中')
if (reply.errors.length) console.log('错误：', JSON.stringify(reply.errors))

await page.screenshot({ path: join(outDir, 'shot-sandbox-chat.png') })

const after = await stateOf()
const added = after.events.filter(event => !before.events.some(old => old.title === event.title && old.start === event.start))
console.log('对话后：', after.events.length, '个日程，新增：', JSON.stringify(added))

// 再看一眼日历里有没有那块
await page.click('.wd-nav button:has-text("日程")')
await page.waitForSelector('.wd-cal-event', { timeout: 10_000 })
await page.waitForTimeout(800)
await page.screenshot({ path: join(outDir, 'shot-sandbox-chat-calendar.png') })

console.log('页面错误：', errors.length ? JSON.stringify(errors.slice(0, 5)) : '无')
await browser.close()
