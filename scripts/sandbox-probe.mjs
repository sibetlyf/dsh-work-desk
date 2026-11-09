// 探查沙盒里的 DSH 会话界面：输入框、发送按钮、工具卡片长什么样。
import { pathToFileURL } from 'node:url'

const base = process.env.SANDBOX_URL
const playwrightEntry = process.env.PLAYWRIGHT_ENTRY || 'E:/NodeJS/node_global/node_modules/playwright/index.js'
const playwright = await import(pathToFileURL(playwrightEntry).href)
const chromium = playwright.chromium ?? playwright.default?.chromium
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1500, height: 940 }, deviceScaleFactor: 2 })
page.on('pageerror', error => console.log('pageerror:', error.message))
await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60_000 })
await page.waitForTimeout(3000)
for (const name of ['稍后配置', '继续', '知道了']) {
  const button = page.getByRole('button', { name })
  if (await button.count()) { await button.first().click({ timeout: 5_000 }).catch(() => {}); await page.waitForTimeout(700) }
}
await page.waitForTimeout(1000)
const info = await page.evaluate(() => {
  const nodes = [...document.querySelectorAll('textarea, [contenteditable="true"], input[type="text"]')].map(node => ({
    tag: node.tagName,
    role: node.getAttribute('role'),
    label: node.getAttribute('aria-label') || node.getAttribute('placeholder') || '',
    cls: node.className?.toString?.().slice(0, 60) ?? '',
  }))
  const buttons = [...document.querySelectorAll('button')].map(node => (node.innerText || node.getAttribute('aria-label') || '').trim()).filter(Boolean).slice(0, 40)
  return { nodes, buttons, text: document.body.innerText.slice(0, 500) }
})
console.log('输入控件：', JSON.stringify(info.nodes, null, 2))
console.log('按钮：', JSON.stringify(info.buttons))
console.log('正文：', info.text.replace(/\n+/g, ' | '))
await page.screenshot({ path: 'docs/shot-sandbox-conversation.png' })
await browser.close()
