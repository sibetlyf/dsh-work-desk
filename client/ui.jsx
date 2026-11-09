// 通用小组件：图标、按钮、对话框、提示。图标是手写的 24×24 path，不引第三方图标库。
import React from 'react'
import { setDesk, undo, useDesk } from './desk.js'

const PATHS = {
  today: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8v4l3 2M12 2v2M12 20v2M2 12h2M20 12h2',
  calendar: 'M5 6h14v14H5zM5 10h14M9 3.5v4M15 3.5v4',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  chart: 'M4 19V5M4 19h16M8 15l3-4 3 2 4-6',
  clock: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8v4l3 2',
  check: 'M5 12.5l4.5 4.5L19 7',
  plus: 'M12 5v14M5 12h14',
  close: 'M6 6l12 12M18 6L6 18',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  gear: 'M12.2 2h-.4a2 2 0 0 0-2 2v.2a2 2 0 0 1-1 1.7l-.4.3a2 2 0 0 1-2 0l-.2-.1a2 2 0 0 0-2.7.7l-.2.4a2 2 0 0 0 .7 2.7l.2.1a2 2 0 0 1 1 1.7v.5a2 2 0 0 1-1 1.7l-.2.1a2 2 0 0 0-.7 2.7l.2.4a2 2 0 0 0 2.7.7l.2-.1a2 2 0 0 1 2 0l.4.3a2 2 0 0 1 1 1.7V20a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2v-.2a2 2 0 0 1 1-1.7l.4-.3a2 2 0 0 1 2 0l.2.1a2 2 0 0 0 2.7-.7l.2-.4a2 2 0 0 0-.7-2.7l-.2-.1a2 2 0 0 1-1-1.7v-.5a2 2 0 0 1 1-1.7l.2-.1a2 2 0 0 0 .7-2.7l-.2-.4a2 2 0 0 0-2.7-.7l-.2.1a2 2 0 0 1-2 0l-.4-.3a2 2 0 0 1-1-1.7V4a2 2 0 0 0-2-2zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  chevL: 'M14.5 5.5L8 12l6.5 6.5',
  chevR: 'M9.5 5.5L16 12l-6.5 6.5',
  chevD: 'M6 9.5l6 6 6-6',
  chevU: 'M6 14.5l6-6 6 6',
  refresh: 'M19 8a8 8 0 0 0-14-1L4 9M5 16a8 8 0 0 0 14 1l1-2M4 4v5h5M20 20v-5h-5',
  star: 'M12 4l2.4 5.2 5.6.7-4.2 3.8 1.1 5.6L12 16.5 7.1 19.3l1.1-5.6L4 9.9l5.6-.7z',
  archive: 'M3 6h18v4H3zM5 10v9h14v-9M9.5 13h5',
  reply: 'M9 7L4 12l5 5M4 12h9a6 6 0 0 1 6 6v1',
  bell: 'M12 4a5 5 0 0 1 5 5v4l2 3H5l2-3V9a5 5 0 0 1 5-5zM10 19a2 2 0 0 0 4 0',
  trash: 'M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13',
  edit: 'M4 20l1-4L16 5l3 3L8 19zM14 7l3 3',
  send: 'M12 19V5M6 11l6-6 6 6',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20c.8-3.4 3.6-5.5 7-5.5s6.2 2.1 7 5.5',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
  external: 'M14 5h5v5M19 5l-7 7M9 5H5v14h14v-4',
  filter: 'M4 6h16l-6 7v5l-4 2v-7z',
  paperclip: 'M8 12l6-6a3 3 0 0 1 4 4l-7 7a5 5 0 0 1-7-7l7-7',
  upRight: 'M7 17L17 7M8 7h9v9',
  downLeft: 'M7 7l10 10M17 8v9H8',
  undo: 'M8 6L4 10l4 4M4 10h10a5 5 0 0 1 0 10h-3',
  doc: 'M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6',
  target: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3',
  menu: 'M4 6h16M4 12h16M4 18h16',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
}

export function Icon({ name, size = 16, fill = false, stroke = 1.6 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name] ?? PATHS.doc} />
    </svg>
  )
}

export function IconButton({ icon, label, onClick, active, size = 16, className = '', ...rest }) {
  return (
    <button type="button" className={`wd-icon-btn ${active ? 'is-active' : ''} ${className}`} aria-label={label} title={label} onClick={onClick} {...rest}>
      <Icon name={icon} size={size} />
    </button>
  )
}

export function Segmented({ value, options, onChange, label }) {
  return (
    <div className="wd-seg" role="radiogroup" aria-label={label}>
      {options.map(option => (
        <button key={option.value} type="button" role="radio" aria-checked={value === option.value} className={value === option.value ? 'is-on' : ''} onClick={() => onChange(option.value)} title={option.title ?? option.label}>
          {option.icon ? <Icon name={option.icon} size={14} /> : null}
          {option.label ? <span>{option.label}</span> : null}
        </button>
      ))}
    </div>
  )
}

export function Dialog({ title, onClose, children, width = 460, footer = null }) {
  const ref = React.useRef(null)
  const close = React.useRef(onClose)
  close.current = onClose
  React.useEffect(() => {
    const onKey = event => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        close.current()
      }
    }
    window.addEventListener('keydown', onKey, true)
    const body = ref.current
    ;(body?.querySelector('.wd-dialog-head ~ * input, .wd-dialog-head ~ * textarea, .wd-dialog-head ~ * select') ?? body?.querySelector('.wd-dialog-head ~ * button'))?.focus()
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])
  return (
    <div className="wd-dialog-mask" onPointerDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <div className="wd-dialog" role="dialog" aria-modal="true" aria-label={title} style={{ width }} ref={ref}>
        <div className="wd-dialog-head">
          <h2>{title}</h2>
          <IconButton icon="close" label="关闭" onClick={onClose} />
        </div>
        {children}
        {footer}
      </div>
    </div>
  )
}

/** 字段驱动的通用编辑框：日程、待办、提醒、自选都用它。 */
export function FormDialog() {
  const dialog = useDesk(s => s.dialog)
  const [values, setValues] = React.useState({})
  React.useEffect(() => {
    if (dialog) setValues(dialog.initial ?? {})
  }, [dialog])
  if (!dialog) return null
  const close = () => setDesk({ dialog: null })
  const submit = event => {
    event.preventDefault()
    dialog.onSubmit(values)
    close()
  }
  return (
    <Dialog title={dialog.title} onClose={close} width={dialog.width ?? 460}>
      <form className="wd-form" onSubmit={submit}>
        {dialog.fields.map(field => (
          field.type === 'hidden'
            ? <p key={field.name} className="wd-muted">{field.label}</p>
            : (
              <label key={field.name} className="wd-field">
                <span>{field.label}</span>
                {field.type === 'textarea' ? (
                  <textarea rows={field.rows ?? 3} value={values[field.name] ?? ''} placeholder={field.placeholder} required={field.required} onChange={e => setValues(v => ({ ...v, [field.name]: e.target.value }))} />
                ) : field.type === 'select' ? (
                  <select value={values[field.name] ?? ''} required={field.required} onChange={e => setValues(v => ({ ...v, [field.name]: e.target.value }))}>
                    {(field.options ?? []).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                ) : (
                  <input type={field.type ?? 'text'} value={values[field.name] ?? ''} placeholder={field.placeholder} required={field.required} onChange={e => setValues(v => ({ ...v, [field.name]: e.target.value }))} />
                )}
                {field.hint ? <small>{field.hint}</small> : null}
              </label>
            )
        ))}
        <div className="wd-form-foot">
          {dialog.onDelete ? <button type="button" className="wd-btn is-danger" onClick={() => { dialog.onDelete(); close() }}>删除</button> : null}
          <span style={{ flex: 1 }} />
          <button type="button" className="wd-btn" onClick={close}>取消</button>
          <button type="submit" className="wd-btn is-primary">{dialog.submitLabel ?? '保存'}</button>
        </div>
      </form>
    </Dialog>
  )
}

export function Toast() {
  const toast = useDesk(s => s.toast)
  if (!toast) return null
  return (
    <div key={toast.key} className={`wd-toast ${toast.error ? 'is-error' : ''}`} role={toast.error ? 'alert' : 'status'}>
      {toast.undo ? <Icon name="check" size={13} /> : null}
      <span>{toast.text}</span>
      {toast.undo ? <button type="button" onClick={undo}>撤销</button> : null}
    </div>
  )
}

export function Empty({ title, hint, action }) {
  return (
    <div className="wd-empty">
      <p className="wd-empty-title">{title}</p>
      {hint ? <p>{hint}</p> : null}
      {action}
    </div>
  )
}

export function Tag({ tone = '', children }) {
  return <span className={`wd-tag ${tone ? `is-${tone}` : ''}`}>{children}</span>
}
