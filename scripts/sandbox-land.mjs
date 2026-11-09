// 验证「不管在会话里怎么聊，都能一键落到工作台」：点消息下面的按钮，让同一条会话去调工具。
import { pathToFileURL } from 'node:url'

const base = process.env.SANDBOX_URL
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
await page.locator('[aria-label="办公工作台"]').first().click({ force: true, timeout: 10_000 })
await page.waitForSelector('.wd-hero-line', { timeout: 20_000 })
await page.waitForTimeout(2000)

const before = await page.evaluate(async () => {
  const res = await fetch('work-desk/state', { headers: { 'cache-control': 'no-cache' } })
  const data = await res.json()
  return { events: data.state.events.length, tasks: data.state.tasks.length, dock: [...document.querySelectorAll('.wd-dock .wd-msg')].map(n => n.innerText.slice(0, 40)) }
})
console.log('按钮数：', await page.locator('.wd-msg-action').count())
console.log('会话条数：', before.dock.length)

const button = page.locator('.wd-msg-action').first()
if (!(await button.count())) {
  console.log('没有可落地的消息，先发一句带时间的安排')
  const box = page.locator('.wd-dock .wd-composer textarea')
  await box.click()
  await box.type('明天下午四点半和运营过一下双十一方案，30 分钟', { delay: 8 })
  await box.press('Enter')
  await page.waitForTimeout(12_000)
}
const actions = await page.locator('.wd-msg-action').count()
console.log('可点按钮：', actions)
if (actions) {
  await page.locator('.wd-msg-action').first().click()
  console.log('已点「落到工作台」')
  for (let i = 0; i < 40; i += 1) {
    await page.waitForTimeout(2000)
    const now = await page.evaluate(async () => {
      const res = await fetch('work-desk/state', { headers: { 'cache-control': 'no-cache' } })
      const data = await res.json()
      return { events: data.state.events.length, tasks: data.state.tasks.length }
    })
    if (now.events > before.events || now.tasks > before.tasks) {
      console.log('✅ 工作台变了：', JSON.stringify(now))
      break
    }
    if (i === 39) console.log('❌ 没看到变化')
  }
}
await page.screenshot({ path: 'docs/shot-sandbox-land.png' })
console.log('页面错误：', errors.length ? JSON.stringify(errors.slice(0, 3)) : '无')
await browser.close()
