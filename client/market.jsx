// 行情：自选 + 持仓。涨跌用同一套颜色规则（红涨绿跌以外的方案见 CSS 变量），分时图是手写 SVG。
import React from 'react'
import { dispatchOps, loadMinute, refreshQuotes, setDesk, useDesk } from './desk.js'
import { Empty, Icon, IconButton, Segmented } from './ui.jsx'
import { compactNum, fmtMoney, fmtPct, fmtTime, toneOf } from './util.js'

function Sparkline({ quote, points, width = 84, height = 26 }) {
  // 有分时数据才画线；只有开/现两个点的「折线」会假装出一个趋势，不如画一条幅度条
  if (points && points.length >= 3) {
    const values = points.map(row => row.price)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const span = max - min || 1
    const path = values.map((value, index) => `${index ? 'L' : 'M'} ${(index / (values.length - 1)) * width} ${height - ((value - min) / span) * (height - 2) - 1}`).join(' ')
    const up = values[values.length - 1] >= values[0]
    return (
      <svg className={`wd-spark ${up ? 'is-up' : 'is-down'}`} width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <path d={path} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    )
  }
  if (!quote) return <span className="wd-spark is-empty" />
  const pct = quote.changePct ?? 0
  return (
    <span className={`wd-spark-bar ${pct >= 0 ? 'is-up' : 'is-down'}`} title={`${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`} aria-hidden="true">
      <i style={{ width: `${Math.min(100, Math.abs(pct) * 14 + 10)}%` }} />
    </span>
  )
}

function MinuteChart({ data, quote }) {
  const points = data?.points ?? []
  const prevClose = data?.prevClose ?? quote?.prevClose ?? null
  if (points.length < 2) {
    return <div className="wd-chart-empty">还没有分时数据{prevClose ? '' : '，行情源没返回'}。交易时段内刷新一下试试。</div>
  }
  const values = points.map(row => row.price)
  if (prevClose) values.push(prevClose)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const W = 600
  const H = 200
  const x = index => (index / (points.length - 1)) * W
  const y = value => H - ((value - min) / span) * (H - 16) - 8
  const line = points.map((row, index) => `${index ? 'L' : 'M'} ${x(index).toFixed(1)} ${y(row.price).toFixed(1)}`).join(' ')
  const area = `${line} L ${W} ${H} L 0 ${H} Z`
  const last = points[points.length - 1]
  const up = prevClose ? last.price >= prevClose : true
  return (
    <div className={`wd-minute ${up ? 'is-up' : 'is-down'}`}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="分时走势">
        {prevClose ? (
          <>
            <line x1="0" x2={W} y1={y(prevClose)} y2={y(prevClose)} className="wd-minute-base" />
            <text x="6" y={y(prevClose) - 5} className="wd-minute-label">{prevClose}</text>
          </>
        ) : null}
        <path d={area} className="wd-minute-area" />
        <path d={line} className="wd-minute-line" />
      </svg>
      <div className="wd-minute-axis">
        <span>09:30</span>
        <span>11:30 / 13:00</span>
        <span>15:00</span>
      </div>
    </div>
  )
}

function addWatch(code) {
  const clean = String(code ?? '').trim()
  if (!clean) return
  dispatchOps([{ op: 'add_watch', code: clean }], { label: `添加自选 ${clean}` })
}

function addAlert(quote) {
  setDesk({
    dialog: {
      title: `给 ${quote?.name ?? '这只'} 加提醒`,
      submitLabel: '加提醒',
      initial: { code: quote?.symbol ?? '', threshold: '3', direction: 'up' },
      fields: [
        { name: 'code', label: '代码', required: true },
        { name: 'threshold', label: '涨跌幅阈值（%）', type: 'number', required: true },
        { name: 'direction', label: '方向', type: 'select', options: [{ value: 'up', label: '涨超过' }, { value: 'down', label: '跌超过' }] },
      ],
      onSubmit: values => dispatchOps([{
        op: 'add_alert', kind: 'price', code: values.code,
        threshold: Number(values.threshold) || 3, direction: values.direction,
      }], { label: '添加股价提醒' }),
    },
  })
}

function addPosition() {
  setDesk({
    dialog: {
      title: '记一笔持仓',
      submitLabel: '保存',
      initial: { code: '', shares: '100', cost: '' },
      fields: [
        { name: 'code', label: '代码', required: true, placeholder: '600519 / hk00700 / AAPL' },
        { name: 'shares', label: '股数', type: 'number', required: true },
        { name: 'cost', label: '成本价', type: 'number', required: true },
      ],
      onSubmit: values => dispatchOps([{ op: 'add_position', code: values.code, shares: Number(values.shares), cost: Number(values.cost) }], { label: '记一笔持仓' }),
    },
  })
}

function Detail({ code, quotes, minute, positions, alerts }) {
  const quote = quotes[code]
  const position = positions.find(row => row.code === code)
  const alert = alerts.find(row => row.code === code)
  if (!code) return <Empty title="选一只看详情" hint="左边点一行，右边出分时和持仓。" />
  const pnl = position && quote ? (quote.price - position.cost) * position.shares : null
  const pnlPct = position && quote && position.cost ? ((quote.price - position.cost) / position.cost) * 100 : null
  return (
    <section className="wd-card wd-quote">
      <header className="wd-quote-head">
        <div>
          <h2>{quote?.name ?? code}</h2>
          <p className="wd-muted">{code.toUpperCase()} · {(quote?.quotedAt ?? '等待行情').replace('T', ' ')}</p>
        </div>
        <span style={{ flex: 1 }} />
        <div className={`wd-quote-price ${toneOf(quote?.changePct)}`}>
          <b>{quote?.price ?? '—'}</b>
          <small>{fmtPct(quote?.changePct)}</small>
        </div>
        <IconButton icon="bell" label="加提醒" onClick={() => addAlert(quote ?? { symbol: code })} />
        <IconButton icon="refresh" label="刷新分时" onClick={() => loadMinute(code)} />
      </header>
      <dl className="wd-quote-grid">
        <div><dt>今开</dt><dd>{quote?.open ?? '—'}</dd></div>
        <div><dt>昨收</dt><dd>{quote?.prevClose ?? '—'}</dd></div>
        <div><dt>最高</dt><dd className="is-up">{quote?.high ?? '—'}</dd></div>
        <div><dt>最低</dt><dd className="is-down">{quote?.low ?? '—'}</dd></div>
        <div><dt>成交量</dt><dd>{compactNum(quote?.volume)}</dd></div>
        <div><dt>币种</dt><dd>{quote?.currency ?? '—'}</dd></div>
      </dl>
      <MinuteChart data={minute} quote={quote} />
      {position ? (
        <div className="wd-position-mini">
          <span>持仓 {position.shares} 股 · 成本 {position.cost}</span>
          <b className={toneOf(pnl)}>{pnl >= 0 ? '+' : ''}{fmtMoney(pnl)}（{fmtPct(pnlPct)}）</b>
        </div>
      ) : (
        <button type="button" className="wd-btn is-small" onClick={addPosition}><Icon name="plus" size={12} />记一笔持仓</button>
      )}
      {alert ? <p className="wd-muted">提醒：{alert.direction === 'down' ? '跌' : '涨'}超过 {alert.threshold}% 时提示</p> : null}
    </section>
  )
}

export function MarketView() {
  const state = useDesk(s => s.state)
  const quotes = useDesk(s => s.quotes)
  const quotesAt = useDesk(s => s.quotesAt)
  const quoteError = useDesk(s => s.quoteError)
  const minute = useDesk(s => s.minute)
  const minuteCode = useDesk(s => s.minuteCode)
  const [tab, setTab] = React.useState('watch')
  const [code, setCode] = React.useState('')
  const selected = minuteCode ?? state.watchlist[0]?.code ?? null

  React.useEffect(() => {
    if (!selected) return undefined
    if (!minute || minuteCode !== selected) loadMinute(selected)
    const timer = setInterval(() => refreshQuotes(false), 8000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  const rows = state.watchlist
  const positions = state.positions
  const totalValue = positions.reduce((sum, row) => sum + (quotes[row.code]?.price ?? 0) * row.shares, 0)
  const totalCost = positions.reduce((sum, row) => sum + row.cost * row.shares, 0)
  const totalPnl = totalValue - totalCost

  return (
    <div className="wd-page wd-market-page">
      <header className="wd-page-head">
        <div>
          <h1>行情</h1>
          <p className="wd-page-sub">
            {quotesAt ? `行情时间 ${fmtTime(quotesAt)}` : '等待第一次刷新'}
            {quoteError ? ` · 最近一次失败：${quoteError}` : ''}
            {' · 数据来自腾讯公开行情，仅供参考，不构成投资建议。'}
          </p>
        </div>
        <span style={{ flex: 1 }} />
        <form className="wd-add-watch" onSubmit={event => { event.preventDefault(); addWatch(code); setCode('') }}>
          <Icon name="plus" size={14} />
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="600519 / 00700 / AAPL" aria-label="添加自选" />
          <button type="submit" className="wd-btn is-small">加自选</button>
        </form>
        <button type="button" className="wd-btn is-small" onClick={() => refreshQuotes(true)}><Icon name="refresh" size={13} />刷新</button>
        <Segmented label="列表" value={tab} onChange={setTab} options={[{ value: 'watch', label: '自选' }, { value: 'positions', label: '持仓' }]} />
      </header>

      <div className="wd-market-wrap">
        <section className="wd-card wd-market-list">
          <table className="wd-table">
            <thead>
              <tr><th>名称</th><th className="is-num">现价</th><th className="is-num">涨跌</th><th className="is-num">涨跌幅</th><th>分时</th><th /></tr>
            </thead>
            <tbody>
              {(tab === 'watch' ? rows : positions).map(row => {
                const quote = quotes[row.code]
                const isSelected = selected === row.code
                return (
                  <tr key={row.id ?? row.code} className={`${isSelected ? 'is-selected' : ''} ${toneOf(quote?.changePct)}`} onClick={() => { setDesk({ minuteCode: row.code }); loadMinute(row.code) }}>
                    <td>
                      <span className="wd-quote-name">{quote?.name ?? row.name}</span>
                      <small>{row.code.toUpperCase()}</small>
                    </td>
                    <td className="is-num"><b>{quote?.price ?? '—'}</b></td>
                    <td className="is-num">{quote?.change === null || quote?.change === undefined ? '—' : `${quote.change >= 0 ? '+' : ''}${quote.change.toFixed(2)}`}</td>
                    <td className="is-num">{fmtPct(quote?.changePct)}</td>
                    <td>{isSelected && minute?.points?.length ? <Sparkline points={minute.points} /> : <Sparkline quote={quote} />}</td>
                    <td className="is-right">
                      <button type="button" className="wd-icon-btn" aria-label="加提醒" onClick={event => { event.stopPropagation(); addAlert(quote ?? { symbol: row.code }) }}><Icon name="bell" size={13} /></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {tab === 'positions' && positions.length ? (
            <footer className="wd-market-total">
              <span>市值 <b>{fmtMoney(totalValue, 0)}</b></span>
              <span>成本 <b>{fmtMoney(totalCost, 0)}</b></span>
              <span className={toneOf(totalPnl)}>浮盈 <b>{totalPnl >= 0 ? '+' : ''}{fmtMoney(totalPnl, 0)}</b></span>
            </footer>
          ) : null}
          {tab === 'watch' && rows.length === 0 ? <Empty title="还没有自选" hint="在上面输入代码，加一只看看。" /> : null}
          {tab === 'positions' && positions.length === 0 ? <Empty title="还没有持仓" hint="记一笔之后，这里会按现价算浮动盈亏。" action={<button type="button" className="wd-btn is-small" onClick={addPosition}>记一笔</button>} /> : null}
        </section>
        <aside className="wd-market-side">
          <Detail code={selected} quotes={quotes} minute={minuteCode === selected ? minute : null} positions={positions} alerts={state.alerts} />
          <section className="wd-card">
            <header className="wd-card-head"><h2>我的提醒</h2></header>
            {state.alerts.length === 0 ? <p className="wd-card-empty">还没有提醒。给一只票加个阈值，盘中越过就会出现在今日页。</p> : (
              <ul className="wd-alert-list">
                {state.alerts.map(alert => (
                  <li key={alert.id}>
                    <Icon name="bell" size={12} />
                    <span>{alert.code?.toUpperCase()} {alert.direction === 'down' ? '跌' : '涨'}超 {alert.threshold}%</span>
                    <IconButton icon="trash" label="删除提醒" onClick={() => dispatchOps([{ op: 'remove_alert', id: alert.id }], { label: '删除提醒' })} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
