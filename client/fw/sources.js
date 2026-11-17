// 数据源订阅：组件声明要哪几路数据，这里统一取、统一刷新。
// 只读 Host 的 /work-desk/source，不在这里发邮件、行情或会议请求。
import React from 'react'
import { interpolate } from './interp.js'

export { interpolate }

const BASE = 'work-desk/'
const EMPTY = { data: {}, at: null, error: '', loading: true }

/** 每路数据的刷新节奏（毫秒），取订阅里最快的那个。 */
export const REFRESH = { meeting: 2000, quotes: 8000, desk: 15000 }

export function useSources(names) {
  const key = (names ?? []).slice().sort().join(',')
  const [state, setState] = React.useState(EMPTY)
  const mounted = React.useRef(true)

  const load = React.useCallback(async () => {
    if (!key) { setState({ ...EMPTY, loading: false }); return }
    try {
      const res = await fetch(`${BASE}source?names=${encodeURIComponent(key)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = await res.json()
      if (mounted.current) setState({ data: body.data ?? {}, at: body.at ?? null, error: '', loading: false })
    } catch (err) {
      if (mounted.current) setState(prev => ({ ...prev, error: err.message, loading: false }))
    }
  }, [key])

  React.useEffect(() => {
    mounted.current = true
    if (!key) return undefined
    const every = Math.min(...key.split(',').map(name => REFRESH[name] ?? 15000))
    load()
    const timer = setInterval(() => {
      // 页面不可见时不拉：回来时立刻补一次
      if (document.visibilityState !== 'visible') return
      load()
    }, every)
    const onVisible = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      mounted.current = false
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [key, load])

  return { ...state, refresh: load }
}


