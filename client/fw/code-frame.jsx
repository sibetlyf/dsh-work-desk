// 代码组件的渲染：沙箱 iframe（无网络、无同源、无父访问），只接收数据与主题。
import React from 'react'
import { frameDoc } from './code-widget.js'

export function CodeFrame({ code, data, theme = 'instrument', title = '代码组件' }) {
  const doc = React.useMemo(() => frameDoc(code, data, theme), [code, data, theme])
  return (
    <iframe
      className="fw-code-frame"
      title={title}
      srcDoc={doc}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      loading="lazy"
    />
  )
}
