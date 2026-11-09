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

// playwright 装在全局，ESM 不认 NODE_PATH，按绝对路径引
const playwrightEntry = process.env.PLAYWRIGHT_ENTRY || 'E:/NodeJS/node_global/node_modules/playwright/index.js'
const playwright = await import(pathToFileURL(playwrightEntry).href)
const chromium = playwright.chromium ?? playwright.default?.chromium
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1500, height: 940 }, deviceScaleFactor: 2 })
page.on('pageerror', err => console.log('页面报错：', err.message))
page.on('console', msg => { if (msg.type() === 'error') console.log('console.error:', msg.text()) })

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

await browser.close()
server.close()
for (const dispose of cleanups.reverse()) { try { dispose() } catch {} }
