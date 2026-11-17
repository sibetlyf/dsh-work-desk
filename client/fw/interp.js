/** 占位符 {{meeting.running}} → 实时值。纯函数，渲染前调用，不参与规格校验。 */
export function interpolate(value, data) {
  if (typeof value === 'string') {
    return value.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (whole, path) => {
      const parts = path.split('.')
      let current = data?.[parts[0]]?.value
      for (const part of parts.slice(1)) {
        if (current == null || typeof current !== 'object') return whole
        current = current[part]
      }
      if (current == null) return whole
      return typeof current === 'object' ? JSON.stringify(current) : String(current)
    })
  }
  if (Array.isArray(value)) return value.map(item => interpolate(item, data))
  if (value && typeof value === 'object') {
    const out = {}
    for (const [key, item] of Object.entries(value)) out[key] = interpolate(item, data)
    return out
  }
  return value
}
