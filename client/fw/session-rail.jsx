// 唯一会话面板：创建与继续都绑定在此处，绝不导航走工作台。
import React from 'react'
import { SessionDock } from '../sessiondock.jsx'

export function SessionRail({ onClose, onPreview, onActivity }) {
  return (
    <aside className="fw-rail" aria-label="DSH 会话">
      <SessionDock embedded head={<strong>工作台会话</strong>} onClose={onClose} onPreview={onPreview} onActivity={onActivity} />
    </aside>
  )
}
