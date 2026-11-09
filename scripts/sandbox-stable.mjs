// 快检：面板是否稳定（DOM 变更次数）、停靠栏是不是仍然是会话镜像。
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
await page.waitForTimeout(2500)

const dock = await page.evaluate(() => {
  const aside = document.querySelector('.wd-dock')
  return {
    label: aside?.getAttribute('aria-label'),
    head: aside?.querySelector('.wd-dock-head h2')?.innerText,
    messages: aside?.querySelectorAll('.wd-msg').length ?? 0,
    picker: Boolean(aside?.querySelector('.wd-session-pick')),
  }
})
console.log('停靠栏：', JSON.stringify(dock))

const mutations = await page.evaluate(() => new Promise(resolve => {
  let count = 0
  const observer = new MutationObserver(records => { count += records.length })
  observer.observe(document.querySelector('.wd-root') ?? document.body, { subtree: true, childList: true, characterData: true, attributes: true })
  setTimeout(() => { observer.disconnect(); resolve(count) }, 4000)
}))
console.log('4 秒内 DOM 变更：', mutations, mutations < 200 ? '（稳定）' : '（在狂刷）')
console.log('页面错误：', errors.length ? JSON.stringify(errors.slice(0, 3)) : '无')
await page.screenshot({ path: 'docs/shot-sandbox-stable.png' })
await browser.close()
