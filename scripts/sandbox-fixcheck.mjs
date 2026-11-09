// 验证两个修复：面板不再持续刷新；设置里的「测试连接」有返回且不会被刷新冲掉。
import { pathToFileURL } from 'node:url'

const base = process.env.SANDBOX_URL
const playwrightEntry = process.env.PLAYWRIGHT_ENTRY || 'E:/NodeJS/node_global/node_modules/playwright/index.js'
const playwright = await import(pathToFileURL(playwrightEntry).href)
const chromium = playwright.chromium ?? playwright.default?.chromium

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1500, height: 940 }, deviceScaleFactor: 2 })
const errors = []
let stateCalls = 0
page.on('pageerror', error => errors.push(error.message))
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
page.on('request', request => { if (request.url().includes('/work-desk/state')) stateCalls += 1 })

await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60_000 })
await page.waitForTimeout(2500)
for (const name of ['稍后配置', '继续', '知道了']) {
  const button = page.getByRole('button', { name })
  if (await button.count()) { await button.first().click({ timeout: 5_000 }).catch(() => {}); await page.waitForTimeout(700) }
}
await page.locator('[aria-label="办公工作台"]').first().click({ force: true, timeout: 10_000 })
await page.waitForSelector('.wd-hero-line', { timeout: 20_000 })
const startCalls = stateCalls
await page.waitForTimeout(12_000)
console.log(`12 秒内 /work-desk/state 请求数：${stateCalls - startCalls}（正常应为 0～1）`)
console.log('页面错误：', errors.length ? JSON.stringify(errors.slice(0, 4)) : '无')

// 打开设置 → 选 DSH 邮件插件 → 测试连接
await page.locator('.wd-topbar [aria-label="设置"]').first().click({ force: true })
await page.waitForSelector('.wd-dialog', { timeout: 10_000 })
await page.getByRole('radio', { name: 'DSH 邮件插件' }).click().catch(async () => {
  await page.getByRole('button', { name: 'DSH 邮件插件' }).click()
})
await page.waitForTimeout(400)
await page.getByRole('button', { name: '测试连接' }).click()
await page.waitForTimeout(3000)
const first = await page.evaluate(() => document.querySelector('.wd-test-row')?.innerText?.replace(/\n+/g, ' | ') ?? '(空)')
console.log('点完 3 秒：', first)
await page.waitForTimeout(8000)
const second = await page.evaluate(() => document.querySelector('.wd-test-row')?.innerText?.replace(/\n+/g, ' | ') ?? '(空)')
const kept = await page.evaluate(() => {
  const form = document.querySelector('.wd-dialog')
  return { provider: form?.querySelector('[aria-checked="true"]')?.innerText ?? null, hasAccount: Boolean(form?.querySelector('input[placeholder*="默认账号"]')) }
})
console.log('又过 8 秒：', second)
console.log('表单还在：', JSON.stringify(kept))
console.log(first.includes('连上') || first.includes('没有') || first.includes('工具') ? '✅ 有返回' : '⚠️ 仍然没有返回')
await page.screenshot({ path: 'docs/shot-sandbox-settings.png' })
await browser.close()
