import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeCode, parseQuote, parseQuoteResponse, marketOf, isTradingHours, displaySymbol } from '../src/quotes.js'

// 真实响应里截出来的四条（A 股 / 指数 / 港股 / 美股），字段位置以它为准
const SAMPLE = [
  'v_sh600519="1~贵州茅台~600519~1444.21~1453.00~1440.06~7170~3751~3419~1444.11~2~1444.09~2~1444.07~1~1444.00~1~1443.83~2~1444.30~1~1444.31~2~1444.41~1~1444.61~1~1444.64~3~~20261109095834~-8.79~-0.60~1449.46~1435.08~1444.21/7170/1034005534~7170~103401~0.06~21.97~~1449.46~1435.08~0.99~18053.80~18053.80~6.66";',
  'v_sh000001="1~上证指数~000001~3673.54~3649.18~3659.02~146103905~0~0~0.00~0~0.00~0~0.00~0~0.00~0~0.00~0~0.00~0~0.00~0~0.00~0~0.00~0~0.00~0~~20261109095927~24.36~0.67~3676.45~3653.05~3673.54/146103905/236055057418~146103905~23605506~0.30~16.68";',
  'v_hk00700="100~腾讯控股~00700~427.200~419.800~425.200~3308282.0~0~0~427.200~0~0~0~0~0~0~0~0~0~427.200~0~0~0~0~0~0~0~0~0~3308282.0~2026/11/09 09:44:25~7.400~1.76~428.400~422.800~427.200~3308282.0~1405361069.500~0~15.60";',
  'v_usAAPL="200~苹果~AAPL.OQ~342.37~344.17~338.73~44703806~0~0~342.65~480~0~0~0~0~0~0~0~0~342.82~80~0~0~0~0~0~0~0~0~~2026-11-06 16:00:01~-1.80~-0.52~345.79~338.30~USD~44703806~15326963640~0.31~38.13";',
].join('\n')

test('代码规整：带前缀优先，纯数字按沪深规则猜', () => {
  assert.equal(normalizeCode('600519'), 'sh600519')
  assert.equal(normalizeCode('000001'), 'sz000001')
  assert.equal(normalizeCode('sh000001'), 'sh000001')
  assert.equal(normalizeCode('00700'), 'hk00700')
  assert.equal(normalizeCode('AAPL'), 'usAAPL')
  assert.equal(normalizeCode('aapl'), 'usAAPL')
  assert.equal(normalizeCode('这不是代码'), null)
  assert.equal(marketOf('hk00700'), 'hk')
  assert.equal(displaySymbol('sh600519'), '600519')
  assert.equal(displaySymbol('usAAPL'), 'AAPL')
})

test('解析 A 股：价格、涨跌、高低、时间都对得上', () => {
  const payload = /v_sh600519="([^"]*)"/.exec(SAMPLE)[1]
  const quote = parseQuote('sh600519', payload)
  assert.equal(quote.name, '贵州茅台')
  assert.equal(quote.price, 1444.21)
  assert.equal(quote.prevClose, 1453)
  assert.equal(quote.open, 1440.06)
  assert.equal(quote.high, 1449.46)
  assert.equal(quote.low, 1435.08)
  assert.equal(quote.change, -8.79)
  assert.equal(quote.changePct, -0.6)
  assert.equal(quote.quotedAt, '2026-11-09T09:58:34')
  assert.equal(quote.currency, 'CNY')
})

test('解析指数、港股、美股', () => {
  const all = parseQuoteResponse(SAMPLE)
  assert.equal(all.errors.length, 0)
  assert.equal(all.quotes.length, 4)
  const index = all.quotes.find(row => row.symbol === 'sh000001')
  assert.equal(index.price, 3673.54)
  assert.equal(index.changePct, 0.67)
  const hk = all.quotes.find(row => row.symbol === 'hk00700')
  assert.equal(hk.price, 427.2)
  assert.equal(hk.currency, 'HKD')
  assert.equal(hk.quotedAt, '2026-11-09 09:44:25')
  const us = all.quotes.find(row => row.symbol === 'usAAPL')
  assert.equal(us.currency, 'USD')
  assert.equal(us.price, 342.37)
})

test('空行和坏行不会让整批解析失败', () => {
  const { quotes, errors } = parseQuoteResponse('v_sh600519="1~名字~600519";\n\n垃圾\nv_sz000001=""')
  assert.equal(quotes.length, 0)
  assert.equal(errors.length, 2)
})

test('交易时段判断：工作日盘中为真，周末为假', () => {
  assert.equal(isTradingHours(new Date('2026-11-09T10:00:00+08:00')), true)
  assert.equal(isTradingHours(new Date('2026-11-09T12:00:00+08:00')), false)
  assert.equal(isTradingHours(new Date('2026-11-14T10:00:00+08:00')), false)
})
