// 验证：首次打开不塞假邮件，邮件页直接引导接真实邮箱。
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
await page.waitForTimeout(1500)

const state = await page.evaluate(async () => {
  const res = await fetch('work-desk/state', { headers: { 'cache-control': 'no-cache' } })
  const data = await res.json()
  return { mails: data.state.mails.length, sampleMails: data.state.mails.filter(row => row.sample).length, events: data.state.events.length, provider: data.mail.provider }
})
console.log('state：', JSON.stringify(state))
await page.screenshot({ path: 'docs/shot-empty-today.png' })

await page.locator('button').filter({ hasText: /^邮件$/ }).first().click()
await page.waitForTimeout(1200)
const connect = await page.evaluate(() => {
  const node = document.querySelector('.wd-connect')
  return node ? node.innerText.replace(/\n+/g, ' | ').slice(0, 200) : null
})
console.log('邮件页引导：', connect ?? '(没有)')
await page.screenshot({ path: 'docs/shot-empty-mail.png' })
console.log('页面错误：', errors.length ? JSON.stringify(errors.slice(0, 3)) : '无')
await browser.close()
