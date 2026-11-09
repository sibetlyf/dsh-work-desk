// 端到端：在 DSH 的对话里说一句话，看 Agent 会不会调工作台的工具把日程加进去。
import { pathToFileURL } from 'node:url'

const base = process.env.SANDBOX_URL
const message = process.env.SANDBOX_MESSAGE || '明天下午三点和设计对一下改版，40 分钟，加进工作台日程'
const playwrightEntry = process.env.PLAYWRIGHT_ENTRY || 'E:/NodeJS/node_global/node_modules/playwright/index.js'
const playwright = await import(pathToFileURL(playwrightEntry).href)
const chromium = playwright.chromium ?? playwright.default?.chromium

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1500, height: 940 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', error => errors.push(error.message))
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })

await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60_000 })
await page.waitForTimeout(2500)
for (const name of ['稍后配置', '继续', '知道了']) {
  const button = page.getByRole('button', { name })
  if (await button.count()) { await button.first().click({ timeout: 5_000 }).catch(() => {}); await page.waitForTimeout(700) }
}

const state = () => page.evaluate(async () => {
  const res = await fetch('work-desk/state', { headers: { 'cache-control': 'no-cache' } })
  const data = await res.json()
  return { events: data.state.events.map(event => ({ title: event.title, start: event.start, end: event.end })), tasks: data.state.tasks.length }
})

const before = await state()
console.log(`发送前：${before.events.length} 个日程`)

const box = page.locator('div[role="textbox"]').first()
await box.click()
await box.type(message, { delay: 12 })
await page.keyboard.press('Enter')
console.log('已发送：', message)

// 等 Agent 跑完：工具卡片出现，或工作台里多出日程
let hit = null
for (let i = 0; i < 60; i += 1) {
  await page.waitForTimeout(2000)
  const now = await state()
  const added = now.events.find(event => !before.events.some(old => old.title === event.title && old.start === event.start))
  if (added) { hit = added; break }
}
await page.screenshot({ path: 'docs/shot-sandbox-conversation.png' })

if (hit) {
  console.log('✅ 对话里加进来了：', JSON.stringify(hit))
} else {
  console.log('❌ 两分钟内没看到新日程')
}

const text = await page.evaluate(() => document.body.innerText.slice(0, 1200).replace(/\n{2,}/g, '\n'))
console.log('--- 会话内容 ---')
console.log(text)
console.log('页面错误：', errors.length ? JSON.stringify(errors.slice(0, 4)) : '无')
await browser.close()
