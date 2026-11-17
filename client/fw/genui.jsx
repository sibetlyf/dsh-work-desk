// 生成式组件：白名单结构，无 HTML、无脚本、无 eval。
// 规格来自布局（本机浏览器），后续由工作台工具写入 Host；这里先保证渲染与校验是同一套。
import React from 'react'
import { GENUI_NODE_TYPES, genuiSpecUsable, specDepthOk } from './layout.js'
import { interpolate } from './sources.js'

const MAX_NODES = 40
const MAX_TEXT = 400
const TONES = ['accent', 'success', 'warning', 'danger', 'muted']

function text(value) {
  return typeof value === 'string' ? value.slice(0, MAX_TEXT) : ''
}

/** 按当前尺寸取对应规格：views 里没有这一档时退回扁平规格或中档。 */
export function pickSpec(spec, size) {
  if (!spec || typeof spec !== 'object') return null
  const views = spec.views
  if (views && typeof views === 'object') {
    const chosen = views[size] ?? views.m ?? Object.values(views)[0]
    if (chosen && typeof chosen === 'object') return chosen
  }
  return spec
}

/** 能否加入工作台：扁平规格或有任意一档 views 里含白名单节点。 */
export function specUsable(raw) {
  return genuiSpecUsable(raw)
}

/** 校验结构，非法节点直接丢弃，不整块失败；超深/超大规格整份拒绝。 */
export function sanitizeSpec(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  if (!specDepthOk(raw)) return null
  const items = Array.isArray(raw.items) ? raw.items.slice(0, MAX_NODES) : []
  const nodes = items.filter(node => node && typeof node === 'object' && typeof node.type === 'string').filter(node => GENUI_NODE_TYPES.has(node.type))
  if (!nodes.length) return null
  return { title: text(raw.title), items: nodes }
}

function Badge({ label, tone }) {
  const klass = TONES.includes(tone) ? tone : 'accent'
  return <span className={`fw-badge is-${klass}`}>{text(label)}</span>
}

function Node({ node }) {
  switch (node.type) {
    case 'text':
      return <p className={`fw-gtext is-${text(node.size) || 'body'}`}>{text(node.content)}</p>
    case 'stat':
      return (
        <div className="fw-gstat">
          <span className="fw-gstat-value fw-display">{text(node.value)}</span>
          <span className="fw-label">{text(node.label)}</span>
          {node.delta ? <span className={`fw-gdelta ${String(node.delta).startsWith('-') ? 'is-down' : 'is-up'}`}>{text(node.delta)}</span> : null}
        </div>
      )
    case 'badge':
      return <Badge label={node.label} tone={node.tone} />
    case 'progress': {
      const value = Math.max(0, Math.min(100, Number(node.value) || 0))
      return (
        <div className="fw-gprogress">
          <div className="fw-grow">
            <span className="fw-label">{text(node.label)}</span>
            <div className="fw-track"><i style={{ width: `${value}%` }} /></div>
          </div>
          <span className="fw-num">{value}%</span>
        </div>
      )
    }
    case 'list':
      return (
        <ul className="fw-glist">
          {(Array.isArray(node.items) ? node.items : []).slice(0, 8).map((item, index) => (
            <li key={index}>
              <b>{text(typeof item === 'string' ? item : item?.title)}</b>
              {typeof item === 'object' && item?.desc ? <small>{text(item.desc)}</small> : null}
            </li>
          ))}
        </ul>
      )
    case 'keyvalue':
      return (
        <dl className="fw-gkv">
          {(Array.isArray(node.pairs) ? node.pairs : []).slice(0, 8).map((pair, index) => (
            <React.Fragment key={index}>
              <dt>{text(pair?.key)}</dt>
              <dd>{text(pair?.value)}</dd>
            </React.Fragment>
          ))}
        </dl>
      )
    case 'steps': {
      const current = Math.max(0, Math.min(6, Number(node.current) || 0))
      return (
        <ol className="fw-gsteps">
          {(Array.isArray(node.steps) ? node.steps : []).slice(0, 6).map((step, index) => (
            <li key={index} className={index <= current ? 'is-on' : ''}>{text(typeof step === 'string' ? step : step?.title)}</li>
          ))}
        </ol>
      )
    }
    case 'callout':
      return <div className={`fw-gcallout is-${TONES.includes(node.tone) ? node.tone : 'accent'}`}><b>{text(node.title)}</b><p>{text(node.content)}</p></div>
    case 'chart': {
      const data = (Array.isArray(node.data) ? node.data : []).slice(0, 8)
      const max = Math.max(1, ...data.map(row => Number(row?.value) || 0))
      return (
        <div className="fw-gchart">
          {data.map((row, index) => (
            <div key={index} className="fw-gbar" title={`${text(row?.label)} ${Number(row?.value) || 0}`}>
              <i style={{ height: `${Math.round(((Number(row?.value) || 0) / max) * 100)}%` }} />
              <span>{text(row?.label)}</span>
            </div>
          ))}
        </div>
      )
    }
    case 'divider':
      return <hr className="fw-rule" />
    default:
      return null
  }
}

/** 渲染一张生成式卡片；返回 null 时由调用方显示“规格不合法”。 */
export function GenuiAtom({ spec, size, data }) {
  const view = pickSpec(spec, size ?? 'm')
  // 规格里的 {{meeting.running}} 这类占位符在渲染时才解析成实时值。
  const filled = data ? interpolate(view, data) : view
  const clean = sanitizeSpec(filled)
  if (!clean) return <p className="fw-empty">这张生成式卡片没有适合当前尺寸的规格。</p>
  return (
    <div className="fw-genui">
      {clean.title ? <h3>{clean.title}</h3> : null}
      {clean.items.map((node, index) => <Node key={index} node={node} />)}
    </div>
  )
}
