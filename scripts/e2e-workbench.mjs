// 工作台黑盒验收：真实 host 路由 + 真实 dist/client.js + Playwright。
// 覆盖 8 列网格与响应式、三档尺寸语义、拖放写回、生成式卡片三档/非法 spec、
// Host 权威（409 / requestId 幂等）、编辑格子、移动端、无障碍、主题、组件设置。
import http from 'node:http'
import { mkdtemp, readFile, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { clickEditorControl, scrollGeometry } from './workbench-scroll.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// 不碰真实 ~/.dsh：HOME/USERPROFILE 与 DSH_HOME 都指到临时目录
const fakeHome = await mkdtemp(join(tmpdir(), 'wd-e2e-home-'))
process.env.USERPROFILE = fakeHome
process.env.HOME = fakeHome
process.env.DSH_HOME = await mkdtemp(join(tmpdir(), 'wd-e2e-dsh-'))

// esbuild 的写入会被沙箱拦在系统临时目录，构建产物放在工作区内（跑完删除）
const reactBundle = join(root, 'docs', '.e2e-react.js')
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
  --dsw-alias-bg-layer-1:#f6f6f4;
  --dsw-alias-bg-layer-2:#ffffff;
  --dsw-alias-link:#2f6fdb;
  --dsw-alias-state-error-primary:#c0392b;
  --dsw-alias-brand-primary:#1b1d21;
  --dsw-radius-sm:8px; --dsw-radius-md:12px; --dsw-radius-lg:16px;
  --dsw-elevation-soft:0 1px 2px rgba(20,22,26,.05),0 6px 18px rgba(20,22,26,.05);
  --dsw-elevation-prominent:0 18px 50px rgba(20,22,26,.18);
  --dsw-font-family:-apple-system,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
  --dsh-frame-leading-clearance:0px;
}`

const HTML = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>办公工作台</title>
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
    register(def, Comp) { panels[def.key ?? def.name] = Comp; return () => {} },
  },
}
const plugin = window.__modules['dsh-work-desk']
plugin.apply(ctx)
const root = window.ReactDOMClient.createRoot(document.getElementById('root'))
root.render(window.React.createElement(panels['work-desk'] ?? panels['main']))
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

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
async function until(fn, timeout = 6000, label = '条件') {
  const at = Date.now() + timeout
  let last
  while (Date.now() < at) {
    try { last = await fn(); if (last) return last } catch { /* 继续等 */ }
    await sleep(120)
  }
  throw new Error(`等待超时：${label}${last ? `（最后值 ${JSON.stringify(last)}）` : ''}`)
}
async function hostLayout() {
  const res = await fetch(`${base}/work-desk/workbench`)
  assert.equal(res.status, 200)
  return res.json()
}
async function hostPost(body) {
  const res = await fetch(`${base}/work-desk/workbench`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' },
    body: JSON.stringify(body),
  })
  return { status: res.status, body: await res.json() }
}

/** 等 Host 布局写入稳定（两个 1s 窗口 revision 不变），避免上一个用例的防抖写入干扰断言。 */
async function settleHost(timeout = 12_000) {
  const at = Date.now() + timeout
  let last = (await hostLayout()).revision
  while (Date.now() < at) {
    await sleep(1000)
    const current = (await hostLayout()).revision
    if (current === last) return current
    last = current
  }
  throw new Error('Host 布局 revision 一直在变化')
}

const results = []
const failures = []
async function step(name, fn) {
  try {
    const detail = await fn()
    results.push({ name, ok: true })
    console.log(`PASS  ${name}${detail ? ` · ${detail}` : ''}`)
  } catch (err) {
    failures.push({ name, error: err.message })
    results.push({ name, ok: false })
    console.log(`FAIL  ${name} · ${err.message}`)
  }
}

// 首次进入前先载入示例数据（和真实用户路径一致）
await fetch(`${base}/work-desk/ops`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' },
  body: JSON.stringify({ ops: [{ op: 'load_samples' }], label: '载入示例数据' }),
})

const playwrightEntry = process.env.PLAYWRIGHT_ENTRY || 'E:/NodeJS/node_global/node_modules/playwright/index.js'
const playwright = await import(pathToFileURL(playwrightEntry).href)
const chromium = playwright.chromium ?? playwright.default?.chromium
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1500, height: 940 } })
const pageErrors = []
const httpErrors = []
page.on('response', r => { if (r.status() >= 400) httpErrors.push(`${r.status()} ${r.url()}`) })
page.on('pageerror', err => pageErrors.push(err.message))
page.on('console', msg => { if (msg.type() === 'error') pageErrors.push(`console: ${msg.text()}`) })

async function openBench(target = page) {
  await target.goto(base, { waitUntil: 'networkidle' })
  await target.waitForSelector('.wd-hero-line', { timeout: 20_000 })
  await target.click('.wd-nav button:has-text("工作台")')
  await target.waitForSelector('.fw-grid', { timeout: 15_000 })
  await target.waitForTimeout(600)
}

try {
  // ── 0. 进入工作台不应产生写入 ────────────────────────────────────
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.waitForSelector('.wd-hero-line', { timeout: 20_000 })
  await step('进入工作台不产生多余写入（revision 稳定）', async () => {
    const before = (await hostLayout()).revision
    await page.click('.wd-nav button:has-text("工作台")')
    await page.waitForSelector('.fw-grid', { timeout: 15_000 })
    await sleep(1600)
    // 桌面默认会话栏展开会让网格变窄；布局/尺寸断言用满宽网格，先收起会话栏
    const railBtn = page.locator('.fw-bar button:has-text("会话")')
    if (await railBtn.count()) {
      const pressed = await railBtn.getAttribute('aria-pressed')
      if (pressed === 'true') await railBtn.click()
      await sleep(300)
    }
    const after = (await hostLayout()).revision
    assert.equal(after, before, `进入工作台后 revision 从 ${before} 涨到 ${after}`)
    return `revision ${after}`
  })

  await step('创造工作台是工作台内部模式，不是第二个入口', async () => {
    assert.equal(await page.locator('.super-page').count(), 0, '默认不应处在创造模式')
    await page.locator('.fw-bar button:has-text("创造工作台")').click()
    await page.waitForSelector('.super-page', { timeout: 10000 })
    assert.equal(await page.locator('.wd-nav button:has-text("工作台")').count(), 1, '导航里应只有一个工作台入口')
    assert.equal(await page.locator('.fw-root-super, .wd-nav button:has-text("超级创")').count(), 0, '不应再有超级创入口')
    await page.locator('.super-topbar button:has-text("回到工作台")').click()
    await page.waitForSelector('.fw-grid', { timeout: 10000 })
    return '创造模式在内部打开并能返回'
  })

  await step('会话栏结构：展开/收起都不写布局且网格不越界', async () => {
    const toggle = page.locator('.fw-bar button:has-text("会话")')
    assert.equal(await toggle.count(), 1, '工作台顶栏缺少会话栏开关')
    await toggle.click()
    await sleep(700)
    const rail = page.locator('.fw-rail')
    assert.equal(await rail.count(), 1, '展开后应有会话栏')
    assert.ok(await rail.locator('button').count() >= 1, '会话栏应有可交互入口')
    const before = await hostLayout()
    await toggle.click()
    await sleep(700)
    assert.equal(await rail.count(), 0, '再点一次应收起会话栏')
    const shape = await page.evaluate(() => ({
      grid: document.querySelector('.fw-grid').clientWidth,
      wf: Math.round(document.querySelector('.wd-fw').getBoundingClientRect().width),
    }))
    assert.ok(shape.grid <= shape.wf + 1, `网格不应超过工作台宽度：${JSON.stringify(shape)}`)
    assert.equal((await hostLayout()).revision, before.revision, '开关会话栏不应写布局')
    return `网格 ${shape.grid}/${shape.wf}px`
  })

  // ── 数据源：目录、工作台自身数据、缺插件时的诚实降级 ─────────────
  await step('数据源：目录齐全，工作台数据可用，缺插件时给原因', async () => {
    const catalog = await (await fetch(`${base}/work-desk/sources`)).json()
    for (const name of ['desk', 'quotes', 'meeting']) {
      assert.ok(catalog.sources?.[name], `数据源目录缺少 ${name}`)
      assert.ok(String(catalog.sources[name].description ?? '').length > 8, `${name} 缺少说明`)
    }
    const one = await (await fetch(`${base}/work-desk/source?names=desk,nope`)).json()
    assert.equal(one.data.desk.available, true, '工作台自身数据应可用')
    assert.equal(typeof one.data.desk.value.openTasks, 'number')
    assert.equal(one.data.nope.available, false, '未知数据源必须不可用')
    assert.match(one.data.nope.reason, /未知数据源/)
    const meeting = await (await fetch(`${base}/work-desk/source?names=meeting`)).json()
    assert.equal(typeof meeting.data.meeting.available, 'boolean')
    if (!meeting.data.meeting.available) assert.match(meeting.data.meeting.reason, /meeting_agent_status|工具/, '降级原因要说清楚')
    return `desk 可用（${one.data.desk.value.openTasks} 条待办），meeting ${meeting.data.meeting.available ? '可用' : '按原因降级'}`
  })

  // ── 1. 8 列网格：桌面 8，容器 <880 → 4，<560 → 2 ────────────────
  const gridShape = () => page.evaluate(() => {
    const grid = document.querySelector('.fw-grid')
    const wf = document.querySelector('.wd-fw')
    const explicit = Number(getComputedStyle(grid).getPropertyValue('--fw-cols'))
    const tracks = getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length
    const slots = [...document.querySelectorAll('.fw-slot')]
    const fits = slots.every(slot => {
      const style = getComputedStyle(slot)
      const start = Number(style.gridColumnStart)
      const span = Number((style.gridColumnEnd.match(/\d+/) || [0])[0])
      return start >= 1 && start + span - 1 <= explicit
    })
    return { cols: explicit, tracks, fits, gridScroll: grid.scrollWidth, gridClient: grid.clientWidth, wfWidth: Math.round(wf.getBoundingClientRect().width) }
  })
  const setContainerWidth = async px => {
    // 宽度由外壳决定：.wd-fw 是 flex 子项，直接设 width 会被 flex 覆盖
    await page.evaluate(width => {
      const shell = document.querySelector('.fw-shell')
      const host = document.querySelector('.wd-fw')
      if (shell) shell.style.width = width ? `${width}px` : ''
      if (host) host.style.flex = width ? '1 1 auto' : ''
    }, px)
    await page.waitForTimeout(300)
  }

  await step('桌面容器：8 列且所有卡片不越界', async () => {
    const info = await gridShape()
    assert.equal(info.cols, 8, '桌面应为 8 列')
    assert.equal(info.tracks, 8, `显式列数应为 8，实际渲染出 ${info.tracks} 个轨道`)
    assert.equal(info.fits, true, '有卡片排在 8 列之外')
    assert.ok(info.gridScroll <= info.gridClient + 1, `网格横向溢出 ${info.gridScroll}/${info.gridClient}`)
    return `cols=8, 网格宽 ${info.gridClient}`
  })

  await step('容器 820px：4 列且所有卡片不越界', async () => {
    await setContainerWidth(820)
    const info = await gridShape()
    assert.equal(info.cols, 4, `820px 容器应为 4 列，实际 ${JSON.stringify(info)}`)
    assert.equal(info.tracks, 4, `820px 容器渲染出 ${info.tracks} 个轨道（存在越界产生的隐式列）`)
    assert.equal(info.fits, true, '有卡片排在 4 列之外（仍按 8 列放置）')
    assert.ok(info.gridScroll <= info.gridClient + 1, `网格横向溢出 ${info.gridScroll}/${info.gridClient}`)
    return 'cols=4, 无隐式列'
  })

  await step('容器 520px：2 列且所有卡片不越界、大卡满宽', async () => {
    await setContainerWidth(520)
    const info = await gridShape()
    assert.equal(info.cols, 2, `520px 容器应为 2 列，实际 ${JSON.stringify(info)}`)
    assert.equal(info.tracks, 2, `520px 容器渲染出 ${info.tracks} 个轨道（存在越界产生的隐式列）`)
    assert.equal(info.fits, true, '有卡片排在 2 列之外')
    assert.ok(info.gridScroll <= info.gridClient + 1, `网格横向溢出 ${info.gridScroll}/${info.gridClient}`)
    const large = await page.evaluate(() => {
      const grid = document.querySelector('.fw-grid')
      const slot = document.querySelector('.fw-slot.is-l')
      if (!slot) return null
      return { slot: slot.getBoundingClientRect().width, grid: grid.clientWidth }
    })
    assert.ok(large && Math.abs(large.slot - large.grid) <= 1, `2 列时大卡应满宽：${JSON.stringify(large)}`)
    return 'cols=2, 大卡满宽'
  })
  await setContainerWidth(0)

  await step('高度链：短视口与窄容器仍由内部网格滚动', async () => {
    try {
      for (const [width, height] of [[0, 620], [520, 620], [0, 940]]) {
        await page.setViewportSize({ width: 1500, height })
        await setContainerWidth(width)
        const chain = await scrollGeometry(page)
        const root = chain.find(row => row.selector === '.wd-root')
        const pageBox = chain.find(row => row.selector === '.wd-bench-page')
        const grid = chain.find(row => row.selector === '.fw-grid')
        assert.ok(pageBox.bottom <= root.bottom + 1, `工作台页被内容撑出根节点：${JSON.stringify(chain)}`)
        assert.ok(grid.clientHeight > 0 && grid.bottom < pageBox.bottom, `网格缺少可用高度或越界：${JSON.stringify(chain)}`)
        assert.ok(root.scrollHeight <= root.clientHeight + 1, `根节点不应裁剪超高工作台：${JSON.stringify(chain)}`)
        if (width === 520) assert.ok(grid.scrollHeight > grid.clientHeight, `窄屏应产生真实内部滚动范围：${JSON.stringify(chain)}`)
      }
      return '620/940px 视口、520px 容器，页面有界且窄屏网格 scrollHeight > clientHeight'
    } finally {
      await page.setViewportSize({ width: 1500, height: 940 })
      await setContainerWidth(0)
    }
  })

  // ── 5. Host 权威：过期 revision 409、requestId 幂等 ───────────────
  await step('Host：过期 baseRevision 返回 409 且布局不变', async () => {
    await settleHost()
    const before = await hostLayout()
    const stale = await hostPost({
      baseRevision: before.revision - 1,
      requestId: 'e2e-stale-1',
      ops: [{ op: 'replace', layout: { theme: 'paper', atoms: [{ id: 'solo', type: 'clock', size: 's' }] } }],
      source: 'e2e',
    })
    assert.equal(stale.status, 409, `应返回 409，实际 ${stale.status}`)
    assert.equal(stale.body.ok, false)
    assert.equal(stale.body.conflict, true)
    const after = await hostLayout()
    assert.equal(after.revision, before.revision, '过期写入不应改变 revision')
    assert.equal(after.theme, before.theme)
    assert.deepEqual(after.atoms, before.atoms, '过期写入不应改变布局')
    return `status 409, revision ${after.revision}`
  })

  await step('Host：相同 requestId 不重复应用', async () => {
    await settleHost()
    const before = await hostLayout()
    const first = await hostPost({
      baseRevision: before.revision,
      requestId: 'e2e-idem-1',
      ops: [{ op: 'add', id: 'e2e-clock', type: 'clock', size: 'm' }],
      source: 'e2e',
    })
    assert.equal(first.status, 200)
    assert.equal(first.body.ok, true)
    assert.equal(first.body.revision, before.revision + 1)
    const snapshot = first.body.layout.atoms.map(atom => atom.id)
    // 同一 requestId 再提交一个相反的操作：必须回放上一次结果，不能真的移除
    const replay = await hostPost({
      baseRevision: first.body.revision,
      requestId: 'e2e-idem-1',
      ops: [{ op: 'remove', id: 'e2e-clock' }],
      source: 'e2e',
    })
    assert.equal(replay.body.ok, true)
    assert.equal(replay.body.replayed, true, '重复 requestId 应返回 replayed')
    assert.equal(replay.body.revision, first.body.revision, '重复提交不应再改 revision')
    const after = await hostLayout()
    assert.deepEqual(after.atoms.map(atom => atom.id), snapshot, '重复提交不应执行第二次操作')
    return `revision ${after.revision}，requestId 只应用一次`
  })

  // 界面拿到 409 时必须回读 Host，而不是用旧布局覆盖
  await step('界面遇到 409：提示并重新读取 Host 布局', async () => {
    await settleHost()
    const before = await hostLayout()
    const remote = await hostPost({
      baseRevision: before.revision,
      requestId: 'e2e-ext-1',
      ops: [{ op: 'add', id: 'e2e-ext-clock', type: 'clock', size: 'm' }],
      source: 'agent',
    })
    assert.equal(remote.body.ok, true, '模拟 Agent 写入应成功')
    assert.equal(remote.body.revision, before.revision + 1)
    // 界面还拿着旧 revision：切主题触发一次写入，应得到 409 后合并重提（不丢这次改动、也不吃掉 Agent 刚加的组件）
    await page.click('.fw-bar button:has-text("书桌上的纸")')
    await page.waitForSelector('.wd-toast', { timeout: 4000 })
    const message = (await page.locator('.wd-toast').innerText()).trim()
    assert.match(message, /别处改过/, `冲突提示应说明布局被别处改过，实际「${message}」`)
    const after = await settleHost()
    const hostNow = await hostLayout()
    assert.equal(hostNow.atoms.some(atom => atom.id === 'e2e-ext-clock'), true, '冲突合并不能吃掉 Agent 新加的组件')
    assert.equal(after, hostNow.revision, '冲突后界面应停在 Host 的新 revision')
    assert.equal(hostNow.theme, 'paper', '冲突后应保留用户这次的主题改动（合并而非丢弃）')
    // 回读后界面必须与 Host 完全一致（含 Agent 新加的卡片）
    const slotsAfter = await page.locator('.fw-slot').count()
    assert.equal(slotsAfter, hostNow.atoms.length, `冲突回读后界面 ${slotsAfter} 个组件，Host ${hostNow.atoms.length} 个`)
    return `revision ${after}，界面回读后 ${slotsAfter} 个组件`
  })

  // 清掉 Host 测试加的卡片，并重新打开界面（让客户端同步到新 revision）
  const cleanupLayout = await hostLayout()
  await hostPost({
    baseRevision: cleanupLayout.revision,
    requestId: 'e2e-cleanup-1',
    ops: [{ op: 'remove', id: 'e2e-clock' }, { op: 'remove', id: 'e2e-ext-clock' }],
    source: 'e2e',
  })
  await openBench()

  // 进入编辑态，后续尺寸/拖放/格子用例都在编辑态
  await page.click('.fw-bar button:has-text("编辑布局")')
  await page.waitForSelector('.fw-slot.is-editing', { timeout: 5000 })
  await page.waitForTimeout(300)

  // ── 6. 编辑态格子：行数×列，虚线边框 ─────────────────────────────
  await step('编辑态格子：数量 = 行数×实际列数，边框 dashed', async () => {
    const info = await page.evaluate(() => {
      const layer = document.querySelector('.fw-cells')
      const grid = document.querySelector('.fw-grid')
      if (!layer) return null
      const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length
      let rows = 0
      for (const slot of document.querySelectorAll('.fw-slot')) {
        const style = getComputedStyle(slot)
        const start = Number(style.gridRowStart)
        const span = Number((style.gridRowEnd.match(/\d+/) || [0])[0])
        rows = Math.max(rows, start + span - 1)
      }
      const first = layer.children[0]
      return {
        cells: layer.children.length, cols, rows,
        border: first ? getComputedStyle(first).borderTopStyle : '',
      }
    })
    assert.ok(info, '编辑态没有 .fw-cells 层')
    assert.ok([2, 4, 8].includes(info.cols), `列数必须为响应式档位：${info.cols}`)
    assert.equal(info.rows >= 1, true)
    assert.equal(info.cells, info.rows * info.cols, `格子数应为 ${info.rows}×${info.cols}=${info.rows * info.cols}，实际 ${info.cells}`)
    assert.equal(info.border, 'dashed', '格子边框应为虚线')
    return `${info.cells} 格 = ${info.rows} 行 × ${info.cols} 列`
  })

  // ── 2. 三档尺寸语义：同一「待办」实例 s/m/l 内容不同 ─────────────
  await step('三档尺寸：同一「待办」实例 s/m/l 信息层级不同', async () => {
    const tasks = page.locator('.fw-slot').filter({ has: page.locator('.fw-head h2:text-is("待办")') }).first()
    assert.equal(await tasks.count(), 1, '找不到待办卡片')
    const cycle = tasks.locator('.fw-edit .fw-size')
    const sizeOf = async () => (await cycle.textContent()).trim()
    const bodyOf = async () => (await tasks.locator('.fw-body').innerText()).replace(/\s+/g, ' ').trim()
    const rowsOf = async () => tasks.locator('.fw-body .fw-row').count()
    const shot = {}
    for (let i = 0; i < 3; i++) {
      shot[await sizeOf()] = { body: await bodyOf(), rows: await rowsOf(), foot: await tasks.locator('.fw-foot button').count() }
      await clickEditorControl(page, cycle)
      await page.waitForTimeout(320)
    }
    const small = shot['小']
    const medium = shot['中']
    const large = shot['大']
    assert.ok(small && medium && large, `三种尺寸都要采到：${Object.keys(shot)}`)
    assert.equal(small.rows, 0, '小卡不应有列表行')
    assert.match(small.body, /^\d+ 条待办/, `小卡应是计数：${small.body}`)
    assert.equal(medium.rows, 2, `中卡应正好两条：${medium.rows}`)
    assert.equal(large.rows >= 3, true, `大卡应比中卡更多：${large.rows}`)
    assert.equal(large.foot >= 1, true, '大卡底部应有链接')
    assert.notEqual(small.body, medium.body)
    assert.notEqual(medium.body, large.body)
    for (let i = 0; i < 3 && (await sizeOf()) !== '中'; i++) { await cycle.click(); await page.waitForTimeout(300) }
    return `小=${small.body.slice(0, 12)}… 中=${medium.rows} 行 大=${large.rows} 行+底部链接`
  })

  // ── 3. 拖放：手动构造 DataTransfer，两卡顺序交换并写回 Host ──────
  await step('拖放：两卡顺序交换并写回 Host（revision 增加）', async () => {
    await settleHost()
    const before = await hostLayout()
    const revBefore = before.revision
    const titlesBefore = await page.evaluate(() => [...document.querySelectorAll('.fw-slot .fw-head h2')].map(h => h.textContent))
    const from = 3
    const to = 4
    const fired = await page.evaluate(({ from, to }) => {
      const slots = [...document.querySelectorAll('.fw-slot')]
      const a = slots[from]
      const b = slots[to]
      if (!a || !b) return false
      const dt = new DataTransfer()
      const dispatch = (node, type) => node.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt }))
      dispatch(a, 'dragstart')
      dispatch(b, 'dragenter')
      dispatch(b, 'dragover')
      dispatch(b, 'drop')
      dispatch(a, 'dragend')
      return true
    }, { from, to })
    assert.equal(fired, true, '没找到可拖的两个卡片')
    await until(async () => {
      const list = await page.evaluate(() => [...document.querySelectorAll('.fw-slot .fw-head h2')].map(h => h.textContent))
      return list[from] === titlesBefore[to] && list[to] === titlesBefore[from]
    }, 3000, 'DOM 顺序交换')
    const after = await until(async () => {
      const layout = await hostLayout()
      return layout.revision > revBefore ? layout : false
    }, 8000, 'Host revision 增加')
    const idFrom = before.atoms[from].id
    const idTo = before.atoms[to].id
    assert.equal(after.atoms.findIndex(atom => atom.id === idFrom), to, `原第 ${from} 张卡应到 ${to}`)
    assert.equal(after.atoms.findIndex(atom => atom.id === idTo), from, `原第 ${to} 张卡应到 ${from}`)
    assert.equal(after.atoms.length, before.atoms.length)
    return `「${titlesBefore[to]}」「${titlesBefore[from]}」交换，revision ${revBefore}→${after.revision}`
  })

  // ── 4. 生成式卡片：views 三档 + 非法 spec 拒绝且不写入 ───────────
  await step('生成式卡片：s/m/l 三档标题不同', async () => {
    const viewsSpec = JSON.stringify({
      title: '三档规格',
      views: {
        s: { title: '6 个会', items: [{ type: 'stat', label: '今天', value: '6' }] },
        m: { title: '本周概览', items: [{ type: 'progress', label: '待办完成', value: 60 }] },
        l: { title: '本周工作概览', items: [{ type: 'chart', data: [{ label: '周一', value: 2 }, { label: '周三', value: 3 }] }] },
      },
    })
    await page.click('.fw-bar button:has-text("添加组件")')
    await page.waitForSelector('.fw-widgetgrid', { timeout: 15_000 })
    const panel = page.locator('.fw-panel-section').filter({ hasText: '生成式卡片' })
    await panel.locator('textarea').fill(viewsSpec)
    await panel.locator('button:has-text("加入工作台")').click()
    await page.waitForTimeout(400)
    const slot = page.locator('.fw-slot').filter({ has: page.locator('.fw-card.is-genui') }).last()
    await slot.waitFor({ timeout: 5000 })
    const titleOf = async () => (await slot.locator('.fw-genui h3').textContent()) ?? ''
    const cycle = slot.locator('.fw-edit .fw-size')
    const medium = await titleOf()
    assert.equal(medium, '本周概览', `加入后中档标题应为「本周概览」，实际「${medium}」`)
    const sizes = { 中: medium }
    for (let i = 0; i < 2; i++) {
      await clickEditorControl(page, cycle)
      await page.waitForTimeout(320)
      const label = (await cycle.textContent()).trim()
      sizes[label] = await titleOf()
    }
    const small = sizes['小']
    const large = sizes['大']
    assert.ok(small && large, `未采到 s/l：${JSON.stringify(sizes)}`)
    assert.equal(small, '6 个会', `小档标题应为「6 个会」，实际「${small}」`)
    assert.equal(large, '本周工作概览', `大档标题应为「本周工作概览」，实际「${large}」`)
    assert.equal(new Set([small, medium, large]).size, 3, '三档标题必须各不相同')
    for (let i = 0; i < 3 && (await cycle.textContent()).trim() !== '中'; i++) { await cycle.click(); await page.waitForTimeout(280) }
    return `${small} / ${medium} / ${large}`
  })

  await step('生成式卡片：非法 spec 被拒绝且不写入', async () => {
    await settleHost()
    const bad = [
      ['空 items', { title: '空的', items: [] }],
      ['超深数组', { title: '深', items: [{ type: 'list', items: [[[[[[{ title: 'x' }]]]]]] }] }],
      ['未知 type', { title: '未知', items: [{ type: 'script', content: '<img src=x onerror=alert(1)>' }] }],
    ]
    for (const [label, spec] of bad) {
      const before = await hostLayout()
      const slotsBefore = await page.locator('.fw-slot').count()
      if (!(await page.locator('.fw-panel').count())) await page.click('.fw-bar button:has-text("添加组件")')
      const panel = page.locator('.fw-panel-section').filter({ hasText: '生成式卡片' })
      await panel.locator('textarea').fill(JSON.stringify(spec))
      await panel.locator('button:has-text("加入工作台")').click()
      await page.waitForTimeout(450)
      const toast = (await page.locator('.wd-toast').innerText().catch(() => '')) || ''
      assert.match(toast, /规格不合法|JSON 解析失败/, `${label} 应报错，实际提示「${toast}」`)
      const after = await hostLayout()
      const slotsAfter = await page.locator('.fw-slot').count()
      assert.equal(slotsAfter, slotsBefore, `${label}：界面不应新增卡片`)
      assert.equal(after.atoms.length, before.atoms.length, `${label}：Host 不应写入`)
      assert.equal(after.revision, before.revision, `${label}：Host revision 不应变化`)
      if (await page.locator('.fw-panel').count()) await page.click('.fw-bar button:has-text("添加组件")')
      await page.waitForTimeout(250)
    }
    return '空 items / 超深数组 / 未知 type 全部被拒，未写入 Host'
  })

  // ── 8. 无障碍基线（桌面编辑态） ─────────────────────────────────
  await step('无障碍：编辑按钮有 aria-label，方向键可移动卡片并写回', async () => {
    await settleHost()
    const editBtn = page.locator('.fw-bar .fw-btn').filter({ hasText: /编辑布局|完成编辑/ }).first()
    const label = await editBtn.getAttribute('aria-label')
    assert.ok(label && label.trim(), '编辑布局按钮缺少 aria-label')
    const sizeLabel = await page.locator('.fw-edit .fw-size').first().getAttribute('aria-label')
    assert.ok(sizeLabel && sizeLabel.trim(), '尺寸按钮缺少 aria-label')

    const before = await hostLayout()
    const titlesBefore = await page.evaluate(() => [...document.querySelectorAll('.fw-slot .fw-head h2')].map(h => h.textContent))
    const index = 2
    const slot = page.locator('.fw-slot').nth(index)
    const tabindex = await slot.evaluate(el => el.tabIndex)
    assert.equal(tabindex >= 0, true, '编辑态卡片应可聚焦（tabIndex >= 0）')
    await slot.focus()
    const focused = await page.evaluate(() => document.activeElement?.classList.contains('fw-slot'))
    assert.equal(focused, true, '键盘焦点没有落到卡片上')
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(300)
    const titlesAfter = await page.evaluate(() => [...document.querySelectorAll('.fw-slot .fw-head h2')].map(h => h.textContent))
    assert.equal(titlesAfter[index], titlesBefore[index + 1], '按 → 后卡片没有后移一位')
    assert.equal(titlesAfter[index + 1], titlesBefore[index], '相邻卡片没有前移')
    const after = await until(async () => {
      const layout = await hostLayout()
      return layout.revision > before.revision ? layout : false
    }, 6000, '键盘移动写回 Host')
    assert.equal(after.atoms.findIndex(atom => atom.id === before.atoms[index].id), index + 1, '键盘移动没有写回 Host')
    return `aria-label=${label}，卡片 ${index}→${index + 1}`
  })

  await step('无障碍：小卡里没有不可见的可聚焦控件', async () => {
    const bad = await page.evaluate(() => {
      const rows = []
      for (const slot of document.querySelectorAll('.fw-slot.is-s')) {
        for (const el of slot.querySelectorAll('button, a[href], input, select, textarea, [tabindex]')) {
          const rect = el.getBoundingClientRect()
          const style = getComputedStyle(el)
          if (style.display === 'none' || style.visibility === 'hidden' || rect.width === 0 || rect.height === 0) {
            rows.push(`${el.tagName.toLowerCase()}.${el.className} ${Math.round(rect.width)}×${Math.round(rect.height)}`)
          }
        }
      }
      return rows
    })
    assert.deepEqual(bad, [], `小卡存在不可见但仍可聚焦的控件：${JSON.stringify(bad)}`)
    return '小卡可聚焦控件全部有可见盒'
  })

  // ── 9. 主题：三套主题下卡片背景/字体确实变化 ─────────────────────
  await step('主题：instrument / paper / type 的卡片背景与字体不同', async () => {
    const snap = () => page.evaluate(() => {
      const card = document.querySelector('.fw-card')
      const style = getComputedStyle(card)
      return { theme: document.querySelector('.wd-fw').dataset.fwTheme, bg: style.backgroundColor, font: style.fontFamily }
    })
    const shots = []
    for (const label of ['量被画出来', '书桌上的纸', '玻璃上的字']) {
      await page.click(`.fw-bar button:has-text("${label}")`)
      await page.waitForTimeout(350)
      shots.push(await snap())
    }
    const themes = new Set(shots.map(shot => shot.theme))
    assert.equal(themes.size, 3, `三套主题都要切换：${[...themes]}`)
    assert.equal(new Set(shots.map(shot => shot.bg)).size, 3, `三套主题背景色应都不同：${JSON.stringify(shots.map(shot => shot.bg))}`)
    assert.equal(new Set(shots.map(shot => shot.font)).size, 3, `三套主题字体应都不同：${JSON.stringify(shots.map(shot => shot.font))}`)
    await page.click('.fw-bar button:has-text("量被画出来")')
    await page.waitForTimeout(300)
    return shots.map(shot => `${shot.theme}:${shot.bg}`).join(' | ')
  })

  // ── 10. FullWidget 组件设置：表单能打开、保存后 atom.config 生效 ──
  await step('组件设置：表单可打开，保存后 atom.config 写进 Host 并重渲染 iframe', async () => {
    if (!(await page.locator('.fw-panel').count())) await page.click('.fw-bar button:has-text("添加组件")')
    await page.waitForSelector('.fw-widgetgrid', { timeout: 15_000 })
    await page.locator('.fw-widgetchip').filter({ hasText: '日历' }).first().click()
    await until(async () => page.locator('.fw-card.is-widget').count(), 8000, 'FullWidget 卡片出现')
    await page.waitForTimeout(400)
    const widget = page.locator('.fw-slot').filter({ has: page.locator('.fw-card.is-widget') }).first()
    await clickEditorControl(page, widget.locator('.fw-edit button[aria-label="组件设置"]'))
    await page.waitForSelector('.fw-modal', { timeout: 5000 })
    const fields = await page.locator('.fw-field').count()
    assert.ok(fields >= 1, '设置表单应有字段')
    await page.locator('.fw-modal select').first().selectOption('sunday')
    await page.locator('.fw-modal button:has-text("保存")').click()
    await page.waitForSelector('.fw-modal', { state: 'detached', timeout: 5000 })
    await until(async () => {
      const data = await hostLayout()
      return data.atoms.some(atom => atom.type === 'fw:calendar' && atom.config?.weekStart === 'sunday')
    }, 8000, 'Host 保存 atom.config')
    const srcDoc = await page.evaluate(() => {
      const frame = [...document.querySelectorAll('.fw-card.is-widget iframe')].at(-1)
      return frame?.getAttribute('srcdoc') ?? ''
    })
    assert.match(srcDoc, /"weekStart":"sunday"/, 'iframe 没有按新 config 重渲染')
    return `字段 ${fields} 个，weekStart=sunday 已写回 Host 且 iframe 重载`
  })

  // ── 7. 移动端 390×844（isMobile + hasTouch） ─────────────────────
  await step('移动端：无横向溢出、编辑按钮 ≥44px、大卡满宽', async () => {
    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
    mobile.on('response', r => { if (r.status() >= 400) response404.push(r.status() + ' ' + r.url()) })
page.on('pageerror', err => pageErrors.push(`mobile: ${err.message}`))
    await openBench(mobile)
    const info = await mobile.evaluate(() => {
      const grid = document.querySelector('.fw-grid')
      return {
        docScroll: document.documentElement.scrollWidth, innerWidth,
        gridScroll: grid.scrollWidth, gridClient: grid.clientWidth,
        cols: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
        barButtons: [...document.querySelectorAll('.fw-bar .fw-btn')].map(btn => btn.getBoundingClientRect().height),
      }
    })
    assert.equal(info.cols, 2, `390px 宽应落 2 列，实际 ${info.cols}`)
    assert.ok(info.docScroll <= info.innerWidth + 1, `页面横向溢出 ${info.docScroll}/${info.innerWidth}`)
    assert.ok(info.gridScroll <= info.gridClient + 1, `网格横向溢出 ${info.gridScroll}/${info.gridClient}`)
    // 壳层顶栏：导航只留图标，右侧按钮（提醒/撤销/设置/助手）都必须在 390px 可视区内
    const bar = await mobile.evaluate(() => {
      const boxes = [...document.querySelectorAll('.wd-topbar button')].map(el => {
        const rect = el.getBoundingClientRect()
        return { label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 8), left: rect.left, right: rect.right }
      })
      return { boxes, width: window.innerWidth }
    })
    const outside = bar.boxes.filter(box => box.left < 0 || box.right > bar.width + 1)
    assert.deepEqual(outside, [], `顶栏按钮被挤出可视区：${JSON.stringify(outside)}`)
    assert.ok(bar.boxes.length >= 5, `顶栏按钮数量异常：${bar.boxes.length}`)
    const editBtn = mobile.locator('.fw-bar button:has-text("编辑布局")').first()
    assert.equal(await editBtn.count(), 1, '移动端找不到编辑按钮')
    const editHeight = await editBtn.evaluate(el => el.getBoundingClientRect().height)
    // 逐像素取整会受设备像素比影响（43.99 仍是 44px 档），按半像素容差判定
    assert.ok(editHeight >= 43.5, `编辑按钮高度 ${editHeight.toFixed(2)}px < 44px`)
    await editBtn.click()
    await mobile.waitForTimeout(400)
    const sizes = await mobile.evaluate(() => {
      const grid = document.querySelector('.fw-grid').clientWidth
      const large = document.querySelector('.fw-slot.is-l')
      const buttons = [...document.querySelectorAll('.fw-edit button')].map(btn => btn.getBoundingClientRect().height)
      return { grid, large: large?.getBoundingClientRect().width ?? null, buttons }
    })
    assert.ok(sizes.large !== null && Math.abs(sizes.large - sizes.grid) <= 1, `移动端大卡应满宽：${JSON.stringify(sizes)}`)
    assert.equal(sizes.buttons.every(height => height >= 43.5), true, `编辑控件高度应 ≥44px：${JSON.stringify(sizes.buttons)}`)
    const hidden = await mobile.evaluate(() => {
      const rows = []
      for (const slot of document.querySelectorAll('.fw-slot.is-s')) {
        for (const el of slot.querySelectorAll('button, a[href], input, select, textarea, [tabindex]')) {
          const rect = el.getBoundingClientRect()
          const style = getComputedStyle(el)
          if (style.display === 'none' || style.visibility === 'hidden' || rect.width === 0 || rect.height === 0) {
            rows.push(`${el.tagName.toLowerCase()} ${Math.round(rect.width)}×${Math.round(rect.height)}`)
          }
        }
      }
      return rows
    })
    assert.deepEqual(hidden, [], `移动端小卡存在不可见可聚焦控件：${JSON.stringify(hidden)}`)
    const bottomGenui = mobile.locator('.fw-slot').filter({ has: mobile.locator('.fw-card.is-genui') }).last()
    const cycle = bottomGenui.locator('.fw-edit .fw-size')
    const beforeSize = await cycle.textContent()
    await clickEditorControl(mobile, cycle)
    assert.notEqual(await cycle.textContent(), beforeSize, '移动端底部卡片应能真实 UI 换档')
    const bottomWidget = mobile.locator('.fw-slot').filter({ has: mobile.locator('.fw-card.is-widget') }).last()
    await clickEditorControl(mobile, bottomWidget.locator('.fw-edit button[aria-label="组件设置"]'))
    await mobile.waitForSelector('.fw-modal')
    assert.ok(await mobile.locator('.fw-field').count() > 0, '移动端底部设置必须打开真实表单')
    await mobile.locator('.fw-modal button:has-text("取消")').click()
    await mobile.waitForSelector('.fw-modal', { state: 'detached' })
    if (process.env.E2E_SHOT) await mobile.screenshot({ path: join(root, 'docs', 'shot-bench-mobile.png') })
    await mobile.close()
    return `cols=2, 页面宽 ${info.docScroll}/${info.innerWidth}, 编辑按钮 ${Math.round(editHeight)}px, 大卡 ${Math.round(sizes.large)}/${sizes.grid}`
  })

  if (pageErrors.length) console.log(`页面错误：${JSON.stringify(pageErrors.slice(0, 5))}`)
  if (httpErrors.length) console.log(`HTTP 非 2xx：${JSON.stringify(httpErrors.slice(0, 5))}`)
  // 冲突用例按设计返回 409；favicon 之类静态探测会 404。二者都只是浏览器资源日志，
  // 真正的运行时错误（JS 异常或其它 console.error）仍算失败。
  const realErrors = pageErrors.filter(message => !/console: Failed to load resource/.test(message))
  assert.equal(realErrors.length, 0, '页面存在运行时错误')
} finally {
  await browser.close().catch(() => {})
  server.close()
  await unlink(reactBundle).catch(() => {})
  for (const dispose of cleanups.reverse()) { try { dispose() } catch { /* 忽略 */ } }
}

console.log(`\n验收：${results.filter(row => row.ok).length}/${results.length} 通过`)
if (failures.length) {
  for (const failure of failures) console.log(`  - FAIL ${failure.name}：${failure.error}`)
  process.exitCode = 1
} else {
  console.log('工作台黑盒验收全部通过')
}
