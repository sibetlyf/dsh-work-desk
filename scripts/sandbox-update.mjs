// 回归：先说一句加待办，再说「把它的截止时间改到…」，看 Agent 是改原条还是又加一条。
import { pathToFileURL } from 'node:url'

const base = process.env.SANDBOX_URL
const playwrightEntry = process.env.PLAYWRIGHT_ENTRY || 'E:/NodeJS/node_global/node_modules/playwright/index.js'
const playwright = await import(pathToFileURL(playwrightEntry).href)
const chromium = playwright.chromium ?? playwright.default?.chromium

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1500, height: 940 }, deviceScaleFactor: 2 })
await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60_000 })
await page.waitForTimeout(2500)
for (const name of ['稍后配置', '继续', '知道了']) {
  const button = page.getByRole('button', { name })
  if (await button.count()) { await button.first().click({ timeout: 5_000 }).catch(() => {}); await page.waitForTimeout(700) }
}
await page.locator('[aria-label="办公工作台"]').first().click({ force: true, timeout: 10_000 })
await page.waitForSelector('.wd-hero-line', { timeout: 20_000 })
await page.waitForTimeout(1500)

const snapshot = () => page.evaluate(async () => {
  const res = await fetch('work-desk/state', { headers: { 'cache-control': 'no-cache' } })
  const data = await res.json()
  return data.state.tasks.map(task => ({ id: task.id, title: task.title, due: task.due }))
})

const say = async text => {
  const box = page.locator('.wd-dock .wd-composer textarea')
  await box.click()
  await box.type(text, { delay: 8 })
  await box.press('Enter')
}

const waitFor = async (predicate, seconds) => {
  for (let i = 0; i < seconds / 2; i += 1) {
    await page.waitForTimeout(2000)
    const rows = await snapshot()
    if (predicate(rows)) return rows
  }
  return snapshot()
}

const before = await snapshot()
console.log('初始待办：', before.length)

await say('记一下：把灰度方案发给王强，周三前')
const afterAdd = await waitFor(rows => rows.some(row => row.title.includes('灰度方案')), 60)
const added = afterAdd.find(row => row.title.includes('灰度方案'))
console.log('加了：', JSON.stringify(added), '总数', afterAdd.length)

await say('把「把灰度方案发给王强」这条待办的截止时间改到 11 月 10 日 18:00')
const afterUpdate = await waitFor(rows => {
  const hit = rows.find(row => row.id === added?.id)
  return hit?.due && new Date(hit.due).getHours() === 18 && new Date(hit.due).getDate() === 10
}, 90)

const same = afterUpdate.filter(row => row.title.includes('灰度方案'))
const target = afterUpdate.find(row => row.id === added?.id)
console.log('改完：总数', afterUpdate.length, '同名条数', same.length)
console.log('目标条：', JSON.stringify(target))
const ok = afterUpdate.length === afterAdd.length && same.length === 1 && target?.due && new Date(target.due).getHours() === 18
console.log(ok ? '✅ 改的是原条，没有重复' : '⚠️ 行为不符合预期')
await page.screenshot({ path: 'docs/shot-sandbox-update.png' })
await browser.close()
