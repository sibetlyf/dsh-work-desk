// 图片组件：引用 Host 资产库里的图（assetId/url），和文字卡片共用同一份布局。
// 尺寸语义：小=方形缩略、中=缩略+说明、大=大图+说明+来源。
import React from 'react'

function image(atom, ctx) {
  const { size, openToday } = ctx
  const config = atom.config ?? {}
  const url = config.url || (config.assetId ? `work-desk/asset?id=${config.assetId}` : '')
  const caption = config.caption || config.name || ''
  if (!url) return <p className="fw-empty">这张图还没有内容：先在「添加组件 → 图片」上传一张。</p>

  if (size === 's') {
    return (
      <div className="fw-image is-s">
        <img src={url} alt={caption || '图片'} loading="lazy" />
      </div>
    )
  }
  if (size === 'm') {
    return (
      <div className="fw-image is-m">
        <img src={url} alt={caption || '图片'} loading="lazy" />
        {caption ? <span className="fw-label">{caption}</span> : null}
      </div>
    )
  }
  return (
    <div className="fw-image is-l">
      <div className="fw-image-frame"><img src={url} alt={caption || '图片'} loading="lazy" /></div>
      {caption ? <p className="fw-image-caption">{caption}</p> : null}
      <footer className="fw-foot">
        <span>{config.source === 'generated' ? '生成图片' : '本地图片'}{config.bytes ? ` · ${Math.round(config.bytes / 1024)} KB` : ''}</span>
        <button type="button" onClick={openToday}>在工作台里用 ↗</button>
      </footer>
    </div>
  )
}

export default image
