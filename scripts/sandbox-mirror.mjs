// 验证「插件里的助手就是 DSH 会话」：面板右侧显示同一条会话，输入直接投进会话。
import { pathToFileURL } from 'node:url'

const base = process.env.SANDBOX_URL
const message = process.env.SANDBOX_MESSAGE || '记一下：回周舟的改版意见，今晚八点前'
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

const dock = await page.evaluate(() => {
  const aside = document.querySelector('.wd-dock')
  return {
    label: aside?.getAttribute('aria-label') ?? null,
    head: aside?.querySelector('.wd-dock-head h2')?.innerText ?? null,
    picker: Boolean(aside?.querySelector('.wd-session-pick')),
    messages: [...(aside?.querySelectorAll('.wd-msg') ?? [])].map(node => node.innerText.trim().slice(0, 60)),
    error: aside?.querySelector('.wd-msg-error')?.innerText ?? null,
  }
})
console.log('停靠栏：', JSON.stringify(dock, null, 2))
await page.screenshot({ path: 'docs/shot-sandbox-mirror.png' })

const tasksBefore = await page.evaluate(async () => {
  const res = await fetch('work-desk/state', { headers: { 'cache-control': 'no-cache' } })
  return (await res.json()).state.tasks.length
})

const box = page.locator('.wd-dock .wd-composer textarea')
await box.click()
await box.type(message, { delay: 10 })
await box.press('Enter')
console.log('已从工作台发出：', message)

let tasksAfter = tasksBefore
for (let i = 0; i < 45; i += 1) {
  await page.waitForTimeout(2000)
  tasksAfter = await page.evaluate(async () => {
    const res = await fetch('work-desk/state', { headers: { 'cache-control': 'no-cache' } })
    return (await res.json()).state.tasks.length
  })
  if (tasksAfter > tasksBefore) break
}
await page.waitForTimeout(1500)
await page.screenshot({ path: 'docs/shot-sandbox-mirror-after.png' })

const after = await page.evaluate(() => {
  const aside = document.querySelector('.wd-dock')
  return [...(aside?.querySelectorAll('.wd-msg') ?? [])].map(node => node.innerText.trim().slice(0, 80))
})
console.log('待办：', tasksBefore, '→', tasksAfter, tasksAfter > tasksBefore ? '✅ 会话里加进去了' : '❌ 没加进去')
console.log('会话里的消息：', JSON.stringify(after.slice(-4), null, 2))
console.log('页面错误：', errors.length ? JSON.stringify(errors.slice(0, 4)) : '无')
await browser.close()
