// 沙盒验证：打开隔离环境里的 DSH 网页版，检查「办公工作台」是否挂上、面板能否渲染。
// 只用于本地验收，不参与打包。
import { mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'docs')
await mkdir(outDir, { recursive: true })

const base = process.env.SANDBOX_URL
if (!base) {
  console.error('缺少 SANDBOX_URL（形如 http://127.0.0.1:3099/?token=…）')
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

await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60_000 })
// 这个界面有常驻连接，等不到 networkidle；等侧栏入口出现即可
await page.waitForSelector('[aria-label="办公工作台"]', { timeout: 45_000 }).catch(() => console.log('侧栏入口 45 秒内没出现'))
await page.waitForTimeout(2500)

const labels = await page.evaluate(() => [...document.querySelectorAll('[aria-label]')]
  .map(node => node.getAttribute('aria-label'))
  .filter(label => label && /工作台|插件|面板|panel/i.test(label)))
console.log('可能的入口 aria-label：', JSON.stringify(labels))
const text = await page.evaluate(() => document.body.innerText.slice(0, 600).replace(/\n+/g, ' | '))
console.log('首屏文本：', text)

await page.screenshot({ path: join(outDir, 'shot-sandbox-landing.png') })

// 首次打开会盖两层模态：预览版说明 / 添加 API Key。都关掉，否则点不到侧栏
for (const name of ['稍后配置', '继续', '知道了', '开始使用', '关闭']) {
  const button = page.getByRole('button', { name })
  if (await button.count()) {
    await button.first().click({ timeout: 5_000 }).catch(() => {})
    await page.waitForTimeout(800)
  }
}
await page.keyboard.press('Escape')
await page.waitForTimeout(300)

const entry = page.locator('[aria-label="办公工作台"]').first()
if (await entry.count()) {
  await entry.click({ force: true, timeout: 10_000 })
  await page.waitForSelector('.wd-hero-line', { timeout: 20_000 }).catch(() => console.log('等待 .wd-hero-line 超时'))
  await page.waitForTimeout(1500)
  await page.screenshot({ path: join(outDir, 'shot-sandbox-panel.png') })
  const rendered = await page.locator('.wd-hero-line').count()
  console.log('面板渲染：', rendered ? 'OK' : '失败')
  const nav = await page.evaluate(() => [...document.querySelectorAll('.wd-nav button')].map(node => node.innerText.trim()))
  console.log('导航：', JSON.stringify(nav))
  const cards = await page.evaluate(() => [...document.querySelectorAll('.wd-card-head h2')].map(node => node.innerText.trim()))
  console.log('卡片：', JSON.stringify(cards))
  const state = await page.evaluate(async () => {
    const res = await fetch('work-desk/state', { headers: { 'cache-control': 'no-cache' } })
    if (!res.ok) return { status: res.status }
    const data = await res.json()
    return { status: res.status, events: data.state.events.length, mails: data.state.mails.length, quotes: Object.keys(data.quotes ?? {}).length, provider: data.mail?.provider, plugin: data.mail?.pluginAvailable }
  })
  console.log('接口自检：', JSON.stringify(state))
} else {
  console.log('没有找到 aria-label=办公工作台 的入口')
}

console.log('页面错误：', errors.length ? JSON.stringify(errors.slice(0, 8), null, 2) : '无')
await browser.close()
