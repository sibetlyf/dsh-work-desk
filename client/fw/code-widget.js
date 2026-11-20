// 代码组件：Agent 生成的 widget 代码，先在沙箱画布里预览，确认后才进工作台。
// 协议：```workbench-widget { "manifest": {...}, "code": "(props) => '<div>…'" } ```
const MAX_CODE = 4000
const ID = /^[a-z0-9-]{1,32}$/
const FENCE = /```workbench-widget\s*\n([\s\S]*?)(?:```|$)/g

/** 从会话文本里找出最后一个完整的代码组件规格。 */
export function parseCodeWidget(text) {
  const blocks = [...String(text ?? '').matchAll(FENCE)]
  if (!blocks.length) return null
  const raw = blocks[blocks.length - 1][1].trim()
  let data
  try { data = JSON.parse(raw) } catch { return null }
  const manifest = data?.manifest ?? {}
  const code = typeof data?.code === 'string' ? data.code : typeof data?.render === 'string' ? data.render : ''
  if (!code.trim() || code.length > MAX_CODE) return null
  if (typeof manifest.id !== 'string' || !ID.test(manifest.id)) return null
  // 只接受函数体字符串，禁止 require/import/fetch 这类越权写法
  if (/\b(require|import|fetch|XMLHttpRequest|WebSocket|document\.cookie|eval)\b/.test(code)) return null
  const size = ['s', 'm', 'l'].includes(manifest.size) ? manifest.size : 'm'
  return {
    manifest: {
      id: manifest.id,
      title: typeof manifest.title === 'string' ? manifest.title.slice(0, 18) : manifest.id,
      size,
      sources: Array.isArray(manifest.sources) ? manifest.sources.filter(name => ['desk', 'quotes', 'meeting'].includes(name)).slice(0, 3) : [],
    },
    code,
    complete: true,
  }
}

/** 生成沙箱文档：没有网络、没有同源、没有父窗口访问。 */
export function frameDoc(code, data, theme = 'instrument') {
  const payload = JSON.stringify({ data: data ?? {}, theme })
  const bg = theme === 'paper' ? '#f3eee3' : theme === 'type' ? 'transparent' : 'rgba(16,18,22,.74)'
  const fg = theme === 'paper' ? '#1f1c18' : '#e9ecef'
  return `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;height:100%;background:${bg};color:${fg};font-family:"Segoe UI","Microsoft YaHei UI",sans-serif}</style>
</head><body><div id="out"></div>
<script>
const props = ${payload};
try {
  const render = ${code};
  const html = typeof render === 'function' ? render(props) : '';
  document.getElementById('out').innerHTML = String(html ?? '').slice(0, 20000);
} catch (err) {
  document.getElementById('out').innerHTML = '<p style="font-size:11px;opacity:.7">组件出错：' + String(err && err.message || err) + '</p>';
}
</script></body></html>`
}
