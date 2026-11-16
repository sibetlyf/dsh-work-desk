// 截图脚本：把真实的 host 挂在本机端口上，用一份最小宿主壳（React + 语义 token）渲染 client 半片，
// 然后用 Playwright 截四张图。只用于文档，不参与打包。
import http from 'node:http'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'docs')
await mkdir(outDir, { recursive: true })

// 截图不碰真实 ~/.dsh：把 HOME/USERPROFILE 指到临时目录，Host 的 state/workbench 都落在那里。
const fakeHome = await mkdtemp(join(tmpdir(), 'wd-shot-'))
process.env.USERPROFILE = fakeHome
process.env.HOME = fakeHome

// 1. 打一个给 harness 用的 React（IIFE，挂到 window）
const reactBundle = join(outDir, '.react.js')
await build({
  stdin: {
    contents: "import * as React from 'react'\nimport * as ReactDOMClient from 'react-dom/client'\nwindow.React = React\nwindow.ReactDOMClient = ReactDOMClient",
    resolveDir: root,
    loader: 'js',
  },
  bundle: true,
  format: 'iife',
  platform: 'browser',
  define: { 'process.env.NODE_ENV': '"production"' },
  minify: true,
  outfile: reactBundle,
  logLevel: 'silent',
})

// 2. 起一个进程内的 host（真行情、真 state，数据放在临时目录）
process.env.DSH_HOME = await mkdtemp(join(tmpdir(), 'work-desk-shot-'))
const { default: plugin } = await import('../src/host.js')
const cleanups = []
const routes = []
plugin.apply({
  effect(fn) { const dispose = fn(); if (typeof dispose === 'function') cleanups.push(dispose); return dispose },
  get(name) { if (name === 'connection') return { requestRejection: () => undefined } },
  webServer: { register(def) { routes.push(def); return () => {} } },
})

const TOKENS = `:root{
  --dsw-alias-label-primary:#1b1d21;
  --dsw-alias-label-secondary:#4b4f57;
  --dsw-alias-label-tertiary:#84888f;
  --dsw-alias-label-caption:#a8abb1;
  --dsw-alias-label-primary-inverted:#ffffff;
  --dsw-alias-button-primary-fill:#1b1d21;
  --dsw-alias-button-primary-hover:#33363c;
  --dsw-alias-border-l2:rgba(20,22,26,.08);
  --dsw-alias-border-l4:rgba(20,22,26,.17);
  --dsw-alias-interactive-bg-hover:rgba(20,22,26,.045);
  --dsw-alias-interactive-bg-active:rgba(20,22,26,.075);
  --dsw-alias-bg-base:#fbfbfa;
  --dsw-alias-bg-layer-2:#ffffff;
  --dsw-alias-link:#2f6fdb;
  --dsw-radius-sm:8px; --dsw-radius-md:12px; --dsw-radius-lg:16px;
  --dsw-elevation-soft:0 1px 2px rgba(20,22,26,.05),0 6px 18px rgba(20,22,26,.05);
  --dsw-elevation-prominent:0 18px 50px rgba(20,22,26,.18);
  --dsw-font-family:-apple-system,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
  --dsh-frame-leading-clearance:0px;
}`

const HTML = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>办公工作台</title>
<style>
html, body, #root { height: 100%; margin: 0; }
body { background: #fbfbfa; }
${TOKENS}
</style></head>
<body><div id="root"></div>
<script src="/react.js"></script>
<script>
window.__modules = {}
window.__ModuleLoader__ = {
  load({ id, factory }) { window.__modules[id] = factory(name => (name === 'react' ? window.React : {})) },
}
</script>
<script src="/client.js"></script>
<script>
const panels = {}
const ctx = {
  slots: {
    inject(_name, fn) { fn() },
    register(def, Comp) { panels[def.name] = Comp; return () => {} },
  },
}
const plugin = window.__modules['dsh-work-desk']
plugin.apply(ctx)
const root = window.ReactDOMClient.createRoot(document.getElementById('root'))
root.render(window.React.createElement(panels['main']))
</script></body></html>`

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://local')
  if (url.pathname === '/') {
    res.setHeader('content-type', 'text/html; charset=utf-8')
    return res.end(HTML)
  }
  if (url.pathname === '/react.js') {
    res.setHeader('content-type', 'text/javascript; charset=utf-8')
    return res.end(await readFile(reactBundle))
  }
  if (url.pathname === '/client.js') {
    res.setHeader('content-type', 'text/javascript; charset=utf-8')
    return res.end(await readFile(join(root, 'dist', 'client.js')))
  }
  if (url.pathname.startsWith('/work-desk/')) return routes[0].handler(req, res)
  res.statusCode = 404
  res.end('not found')
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const base = `http://127.0.0.1:${server.address().port}`
const fwProbe = await fetch(`${base}/work-desk/fw/file?id=airquality&name=index.html`)
console.log('fw 文件探测：', fwProbe.status, (await fwProbe.text()).slice(0, 60).replace(/\n/g, ' '))

// playwright 装在全局，ESM 不认 NODE_PATH，按绝对路径引
const playwrightEntry = process.env.PLAYWRIGHT_ENTRY || 'E:/NodeJS/node_global/node_modules/playwright/index.js'
const playwright = await import(pathToFileURL(playwrightEntry).href)
const chromium = playwright.chromium ?? playwright.default?.chromium
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1500, height: 940 }, deviceScaleFactor: 2 })
page.on('pageerror', err => console.log('页面报错：', err.message))
page.on('console', msg => { if (msg.type() === 'error') console.log('console.error:', msg.text()) })

// 首次打开是空工作台，截图前手动载入示例数据（和真实用户路径一致）
await fetch(`${base}/work-desk/ops`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' },
  body: JSON.stringify({ ops: [{ op: 'load_samples' }], label: '载入示例数据' }),
})

await page.goto(base, { waitUntil: 'networkidle' })
await page.waitForSelector('.wd-hero-line', { timeout: 20_000 })
await page.waitForTimeout(1200)
await page.screenshot({ path: join(outDir, 'shot-today.png') })
console.log('today ok')

await page.click('.wd-nav button:has-text("日程")')
await page.waitForSelector('.wd-cal-event', { timeout: 10_000 })
await page.waitForTimeout(500)
await page.screenshot({ path: join(outDir, 'shot-calendar.png') })
console.log('calendar ok')

await page.click('.wd-nav button:has-text("邮件")')
await page.waitForSelector('.wd-mail-row', { timeout: 10_000 })
await page.click('.wd-mail-row')
await page.waitForTimeout(600)
await page.screenshot({ path: join(outDir, 'shot-mail.png') })
console.log('mail ok')

await page.click('.wd-nav button:has-text("行情")')
await page.waitForSelector('.wd-quote', { timeout: 10_000 })
await page.waitForTimeout(2000)
await page.screenshot({ path: join(outDir, 'shot-market.png') })
console.log('market ok')

// 原子工作台：8 列网格、三档尺寸、FullWidget 三套主题
await page.click('.wd-nav button:has-text("工作台")')
await page.waitForSelector('.fw-grid', { timeout: 10_000 })
// 会话栏默认展开；截图与尺寸断言用满宽网格，先收起（「会话」按钮可随时打开）
await page.click('.fw-bar button:has-text("会话")').catch(() => {})
await page.waitForTimeout(600)
const gridInfo = await page.evaluate(() => {
  const grid = document.querySelector('.fw-grid')
  const slots = [...grid.children]
  const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length
  const sizes = slots.map(slot => {
    const rect = slot.getBoundingClientRect()
    const cell = grid.getBoundingClientRect().width / 8
    return { cls: slot.className, w: Math.round(rect.width / cell), h: Math.round(rect.height) }
  })
  return { cols, count: slots.length, sizes, overflowX: document.documentElement.scrollWidth > innerWidth }
})
console.log('bench 网格：', JSON.stringify(gridInfo))
if (gridInfo.cols !== 8) throw new Error(`工作台应为 8 列，实际 ${gridInfo.cols}`)
await page.screenshot({ path: join(outDir, 'shot-bench.png') })

// 编辑态：同一实例 中→小→大，内容层级必须随之变化
await page.click('.fw-bar button:has-text("编辑布局")')
await page.waitForTimeout(300)
await page.screenshot({ path: join(outDir, 'shot-bench-edit.png') })

const slotOf = name => page.locator('.fw-slot').filter({ has: page.locator(`.fw-head h2:text-is("${name}")`) }).first()
const bodyOf = async name => (await slotOf(name).locator('.fw-body').innerText()).replace(/\s+/g, ' ').trim()

const tasksM = await bodyOf('待办')
const cycleSize = slotOf('待办').locator('.fw-edit .fw-size')
const samples = [{ size: (await cycleSize.textContent()).trim(), body: tasksM }]
for (let i = 0; i < 2; i++) {
  await cycleSize.click()
  await page.waitForTimeout(350)
  samples.push({ size: (await cycleSize.textContent()).trim(), body: await bodyOf('待办') })
}
const bySize = Object.fromEntries(samples.map(sample => [sample.size, sample.body]))
const tasksL = bySize['大'] ?? ''
const tasksS = bySize['小'] ?? ''
const tasksM2 = bySize['中'] ?? tasksM
console.log('待办 中：', tasksM2.slice(0, 40))
console.log('待办 大：', tasksL.slice(0, 60))
console.log('待办 小：', tasksS.slice(0, 40))
if (!(tasksL.length > tasksS.length)) throw new Error('大卡信息量应大于小卡')
if (!(tasksS.length < tasksM2.length)) throw new Error('小卡应比中卡精简')
// 回到「中」再退出编辑
for (let i = 0; i < 3 && (await cycleSize.textContent()).trim() !== '中'; i++) {
  await cycleSize.click()
  await page.waitForTimeout(300)
}
await page.click('.fw-bar button:has-text("完成编辑")')
await page.waitForTimeout(300)

// 主题切换
await page.click('.fw-bar button:has-text("书桌上的纸")')
await page.waitForTimeout(400)
await page.screenshot({ path: join(outDir, 'shot-bench-paper.png') })
await page.click('.fw-bar button:has-text("量被画出来")')
await page.waitForTimeout(300)

// FullWidget 全部组件：清单、icon 资源、加入工作台后真实渲染
await page.click('.fw-bar button:has-text("添加组件")')
await page.waitForSelector('.fw-widgetgrid', { timeout: 15_000 })
await page.waitForTimeout(700)
const fwInfo = await page.evaluate(() => {
  const chips = [...document.querySelectorAll('.fw-widgetchip')]
  const icons = [...document.querySelectorAll('.fw-widgetchip img')]
  return {
    chips: chips.length,
    iconsLoaded: icons.filter(img => img.complete && img.naturalWidth > 0).length,
    first: chips[0]?.textContent ?? '',
  }
})
console.log('FullWidget 组件清单：', JSON.stringify(fwInfo))
if (fwInfo.chips < 30) throw new Error(`FullWidget 组件应全部可用，实际 ${fwInfo.chips}`)

await page.locator('.fw-widgetchip').filter({ hasText: '日历' }).first().click()
await page.waitForFunction(() => {
  const frames = [...document.querySelectorAll('.fw-card.is-widget iframe')]
  const last = frames.at(-1)
  return Boolean(last?.contentDocument?.body?.textContent?.trim())
}, { timeout: 20_000 })
await page.waitForTimeout(600)
await page.screenshot({ path: join(outDir, 'shot-bench-fullwidget.png') })

// 生成式卡片：先验扁平规格，再验三档 views 随尺寸切换内容
await page.click('.fw-bar button:has-text("添加组件")')
await page.locator('.fw-panel-section').filter({ hasText: '生成式卡片' }).locator('button:has-text("加入工作台")').click()
await page.waitForSelector('.fw-genui', { timeout: 10_000 })
await page.waitForTimeout(300)
const genui = await page.evaluate(() => {
  const node = document.querySelector('.fw-genui')
  return { title: node?.querySelector('h3')?.textContent ?? '', hasChart: !!node?.querySelector('.fw-gchart') }
})
console.log('生成式卡片：', JSON.stringify(genui))
await page.screenshot({ path: join(outDir, 'shot-bench-genui.png') })

const viewsSpec = JSON.stringify({
  title: '三档规格',
  views: {
    s: { title: '6 个会', items: [{ type: 'stat', label: '今天', value: '6' }] },
    m: { title: '本周概览', items: [{ type: 'progress', label: '待办完成', value: 60 }] },
    l: { title: '本周工作概览', items: [{ type: 'chart', data: [{ label: '周一', value: 2 }, { label: '周二', value: 1 }, { label: '周三', value: 3 }] }] },
  },
})
await page.click('.fw-bar button:has-text("添加组件")')
await page.locator('.fw-panel-section').filter({ hasText: '生成式卡片' }).locator('textarea').fill(viewsSpec)
await page.locator('.fw-panel-section').filter({ hasText: '生成式卡片' }).locator('button:has-text("加入工作台")').click()
await page.waitForTimeout(500)

const genuiSlot = page.locator('.fw-slot').filter({ has: page.locator('.fw-card.is-genui') }).last()
const titleOf = async () => (await genuiSlot.locator('.fw-genui h3').textContent().catch(() => '')) ?? ''
const medium = await titleOf()

// 三档切换走 Host 的 resize 操作再重载：验证的是渲染，不依赖卡片在网格里的可见位置
const genuiId = (await (await fetch(`${base}/work-desk/workbench`)).json()).atoms.filter(atom => atom.type === 'genui').at(-1).id
const resize = async size => {
  const current = await (await fetch(`${base}/work-desk/workbench`)).json()
  await fetch(`${base}/work-desk/workbench`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' },
    body: JSON.stringify({ baseRevision: current.revision, requestId: `shot-resize-${size}-${Date.now()}`, ops: [{ op: 'resize', id: genuiId, size }], source: 'agent' }),
  })
  await page.reload({ waitUntil: 'networkidle' })
  await page.click('.wd-nav button:has-text("工作台")')
  await page.waitForTimeout(500)
  return titleOf()
}
const small = await resize('s')
const large = await resize('l')
await resize('m')
console.log('三档规格：', JSON.stringify({ medium, small, large }))
if (!(medium === '本周概览' && small === '6 个会' && large === '本周工作概览')) throw new Error('生成式卡片三档没有各自的内容')
await page.click('.fw-bar button:has-text("编辑布局")')
await page.waitForTimeout(400)
await page.screenshot({ path: join(outDir, 'shot-bench-genui-views.png') })

// FullWidget 组件设置：打开 ⚙ 面板（先确保在编辑态）
if (!(await page.locator('.fw-bar button:has-text("完成编辑")').count())) {
  await page.click('.fw-bar button:has-text("编辑布局")')
  await page.waitForTimeout(300)
}
const fwSlot = page.locator('.fw-slot').filter({ has: page.locator('.fw-card.is-widget') }).first()
if (await fwSlot.count()) {
  await fwSlot.locator('.fw-edit button:has-text("⚙")').click().catch(() => {})
  await page.waitForTimeout(300)
  const modal = await page.evaluate(() => ({ open: !!document.querySelector('.fw-modal'), fields: document.querySelectorAll('.fw-field').length }))
  console.log('组件设置面板：', JSON.stringify(modal))
  await page.screenshot({ path: join(outDir, 'shot-bench-settings.png') })
  await page.locator('.fw-modal button:has-text("取消")').click().catch(() => {})
}
await page.click('.fw-bar button:has-text("完成编辑")')
await page.waitForTimeout(200)

// 编辑态：格子可见
await page.click('.fw-bar button:has-text("编辑布局")')
await page.waitForTimeout(300)
const cells = await page.evaluate(() => {
  const layer = document.querySelector('.fw-cells')
  const grid = document.querySelector('.fw-grid')
  if (!layer) return { cells: 0 }
  const styles = getComputedStyle(grid)
  return {
    cells: layer.children.length,
    cols: styles.gridTemplateColumns.split(' ').length,
    firstCellBorder: getComputedStyle(layer.children[0]).borderTopStyle,
  }
})
console.log('编辑态格子：', JSON.stringify(cells))
if (!cells.cells || cells.firstCellBorder !== 'dashed') throw new Error('编辑态应显示虚线格子')
await page.screenshot({ path: join(outDir, 'shot-bench-edit.png') })

// Host 权威布局：读 revision，Agent 侧写入后刷新应出现
const hostLayout = await (await fetch(`${base}/work-desk/workbench`)).json()
console.log('Host 布局：', JSON.stringify({ revision: hostLayout.revision, atoms: hostLayout.atoms.length, theme: hostLayout.theme }))
const applied = await (await fetch(`${base}/work-desk/workbench`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' },
  body: JSON.stringify({ baseRevision: hostLayout.revision, requestId: 'shot-agent-1', ops: [{ op: 'add', type: 'clock', id: 'agent-clock', size: 'm' }], source: 'agent' }),
})).json()
console.log('Agent 写入：', JSON.stringify({ ok: applied.ok, revision: applied.revision, applied: applied.applied }))
if (!applied.ok) throw new Error(`Agent 写入失败：${JSON.stringify(applied.errors)}`)
await page.reload({ waitUntil: 'networkidle' })
await page.click('.wd-nav button:has-text("工作台")')
await page.waitForSelector('.fw-grid')
await page.waitForTimeout(500)
const afterAgent = await page.evaluate(() => ({
  slots: document.querySelectorAll('.fw-slot').length,
  hint: document.querySelector('.fw-hint')?.textContent ?? '',
}))
console.log('刷新后：', JSON.stringify(afterAgent))
if (!afterAgent.hint.includes('Host 保存')) throw new Error(`界面未切到 Host 权威存储：${afterAgent.hint}`)
await page.screenshot({ path: join(outDir, 'shot-bench-agent.png') })
console.log('bench ok')

await browser.close()
server.close()
for (const dispose of cleanups.reverse()) { try { dispose() } catch {} }
