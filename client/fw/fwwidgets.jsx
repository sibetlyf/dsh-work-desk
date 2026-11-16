// FullWidget 组件宿主：直接运行随包的 38 个原生组件（HTML/CSS/JS），
// 只补一个浏览器侧的 widget.* 桥，不重写组件内容。
// 这些组件是 GPL-3.0 的独立目录（vendor/fullwidget-widgets），本插件代码不派生自它们。
import React from 'react'

const BASE = 'work-desk/'
const themes = {
  instrument: { bg: 'rgba(16,18,22,.74)', solid: '#101216', fg: '#e9ecef', accent: '#7de2c4', onAccent: '#0b1512', radius: 22, padding: 18, shadow: true },
  paper: { bg: '#f3eee3', solid: '#f3eee3', fg: '#1f1c18', accent: '#c23b2b', onAccent: '#fff8ef', radius: 6, padding: 18, shadow: true },
  type: { bg: 'rgba(10,15,36,0)', solid: '#0a0f24', fg: '#ffffff', accent: '#9ccfff', onAccent: '#04131c', radius: 18, padding: 12, shadow: false },
}

let listPromise = null
const fileCache = new Map()

/** 随包组件的清单，只请求一次。 */
export function useFwWidgets() {
  const [state, setState] = React.useState({ ready: false, widgets: [], error: null })
  React.useEffect(() => {
    if (!listPromise) {
      listPromise = fetch(BASE + 'fw/widgets')
        .then(res => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
        .then(data => data.widgets ?? [])
        .catch(err => { listPromise = null; throw err })
    }
    let live = true
    listPromise.then(widgets => live && setState({ ready: true, widgets, error: null }))
      .catch(err => live && setState({ ready: true, widgets: [], error: err.message }))
    return () => { live = false }
  }, [])
  return state
}

async function file(id, name) {
  const key = `${id}/${name}`
  if (!fileCache.has(key)) {
    fileCache.set(key, fetch(`${BASE}fw/file?id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`).then(res => (res.ok ? res.text() : '')))
  }
  return fileCache.get(key)
}

async function sdk(name) {
  const key = `sdk/${name}`
  if (!fileCache.has(key)) {
    fileCache.set(key, fetch(`${BASE}fw/sdk?name=${encodeURIComponent(name)}`).then(res => (res.ok ? res.text() : '')))
  }
  return fileCache.get(key)
}

/** 把清单里的尺寸映射成三档；组件自己的 minWidth/minHeight 也参与判断。 */
export function sizeOfWidget(widget) {
  const { width = 260, height = 160, minWidth = 160, minHeight = 100 } = widget.size ?? {}
  if (minHeight >= 220 || height >= 260) return 'l'
  if (minWidth <= 150 && width <= 200) return 's'
  return 'm'
}

function shim(id, instanceId, theme, settings, storage) {
  const vars = []
  return `<script>
(function(){
const listeners={};const local=v=>v&&typeof v==='object'&&!Array.isArray(v)?(v['zh-CN']??v.zh??v.en??Object.values(v)[0]):v;
const values=${JSON.stringify(settings)};
const store=${JSON.stringify(storage)};
const persist=()=>{try{localStorage.setItem(${JSON.stringify('fw-atom-' + instanceId)},JSON.stringify(store))}catch{}};
const t=local;
const noop=()=>{};
const notify=()=>Promise.reject(new Error('workbench: 预览环境不支持系统通知'));
notify.cancel=async()=>{};
window.widget={
  apiVersion:1,hostVersion:'workbench',id:${JSON.stringify(id)},instanceId:${JSON.stringify(instanceId)},
  locale:'zh-CN',developer:false,permissions:[],locked:false,layer:'normal',theme:${JSON.stringify(theme)},
  t,
  settings:{get:k=>k?values[k]:values,set:async(k,v)=>{values[k]=v;(listeners.settings||[]).forEach(f=>f(values))},onChange:f=>{(listeners.settings??=[]).push(f);return()=>{}}},
  storage:{get:async k=>store[k]??null,set:async(k,v)=>{store[k]=v;persist()},remove:async k=>{delete store[k];persist()},keys:async()=>Object.keys(store)},
  appearance:{get:()=>({theme:${JSON.stringify(theme)}}),onChange:f=>()=>{}},
  on:(n,f)=>{(listeners[n]??=[]).push(f);return()=>{}},
  log:(...a)=>console.log(...a),
  notify,
  window:{startDrag:noop,setSize:async()=>({width:innerWidth,height:innerHeight})},
  fetch:(url,init)=>fetch(url,init),
  shell:{open:async url=>{window.open(url,'_blank','noopener');return true},launch:async()=>{throw new Error('workbench: 不支持启动本机程序')},pick:async()=>null,info:async()=>null,paths:async()=>[]},
  system:{subscribe:()=>noop,history:async()=>({now:Date.now(),points:[]}),info:async()=>{throw new Error('workbench: 无系统信息权限')},adapters:async()=>[],ping:async()=>null},
  media:{onChange:()=>noop,lyrics:async()=>null},
  audio:{onChange:()=>noop,set:async()=>{}},
  notifyNote:noop
};
})();
</script>`
}

/** 组件文档：原版 HTML/CSS/JS + 主题变量 + 桥。 */
async function buildDoc(widget, instanceId, themeName, config) {
  const [html, css, js, base, themeCss] = await Promise.all([
    file(widget.id, 'index.html'), file(widget.id, 'style.css'), file(widget.id, 'main.js'),
    sdk('base.css'), sdk(`themes/${themeName}/theme.css`),
  ])
  const theme = themes[themeName] ?? themes.instrument
  const settings = {}
  for (const item of widget.settings ?? []) {
    const value = config?.[item.key]
    settings[item.key] = value !== undefined ? value : localDefault(item.default)
  }
  const storage = {}
  const rootVars = `:root{--w-bg:${theme.bg};--w-bg-solid:${theme.solid};--w-fg:${theme.fg};--w-accent:${theme.accent};--w-on-accent:${theme.onAccent};--w-radius:${theme.radius}px;--w-padding:${theme.padding}px;--w-margin:8px;--w-size-scale:1${theme.shadow ? '' : ';--w-shadow:none'}}`
  return `<html lang="zh-CN" data-theme="${themeName}" data-style="transparent"><style>${base}</style><style>${themeCss}</style><style>${rootVars}</style><style>${css}</style><style>html,body{background:transparent}body{margin:0}</style>${html.replace(/^[\s\S]*?<body[^>]*>/i, '<body>').replace(/<\/body>[\s\S]*$/i, '').replace(/<script[^>]*src=[^>]*>\s*<\/script>/gi, '')}${shim(widget.id, instanceId, themeName, settings, storage)}<script>${js}</script></body></html>`
}

function localDefault(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value['zh-CN'] ?? value.zh ?? value.en ?? Object.values(value)[0])
    : value
}

/** 一个 FullWidget 原生组件实例。 */
export function FwWidget({ widget, instanceId, theme, config }) {
  const [doc, setDoc] = React.useState('')
  const [error, setError] = React.useState('')
  React.useEffect(() => {
    let live = true
    buildDoc(widget, instanceId, theme, config ?? {})
      .then(html => live && setDoc(html))
      .catch(err => live && setError(err.message))
    return () => { live = false }
  }, [widget.id, instanceId, theme, JSON.stringify(config ?? {})])

  if (error) return <p className="fw-empty">组件加载失败：{error}</p>
  if (!doc) return <p className="fw-empty">正在加载 {localDefault(widget.name)}…</p>
  return (
    <iframe
      className="fw-frame"
      title={localDefault(widget.name)}
      srcDoc={doc}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      loading="lazy"
    />
  )
}

/** 组件自带的 icon.svg（也是 FullWidget 原版资源）。 */
export function fwIconUrl(id) {
  return `${BASE}fw/file?id=${encodeURIComponent(id)}&name=icon.svg`
}
