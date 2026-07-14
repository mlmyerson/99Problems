/**
 * useStocks – fetches market data from Yahoo Finance's public JSON API.
 * Falls back to Reddit r/stocks for market discussion when price data is blocked.
 *
 * Note: Yahoo Finance's API is unofficial and may encounter CORS restrictions in
 * some browsers or deployment environments. The component renders a clear error
 * state with a direct link to Yahoo Finance when data cannot be retrieved.
 * No API keys are required for either source.
 */

import { useState, useCallback } from 'react'

const TIMEOUT_MS = 10000

export const TRACKED_SYMBOLS = [
  { symbol: 'SPY', name: 'S&P 500 ETF' },
  { symbol: 'QQQ', name: 'NASDAQ-100 ETF' },
  { symbol: 'DIA', name: 'Dow Jones ETF' },
  { symbol: 'IWM', name: 'Russell 2000 ETF' },
  { symbol: 'GLD', name: 'Gold ETF' },
  { symbol: 'TLT', name: '20-Year Treasury ETF' },
]

function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  )
}

async function fetchYahooFinance() {
  const symbolList = TRACKED_SYMBOLS.map((s) => s.symbol).join(',')
  const fields =
    'regularMarketPrice,regularMarketChange,regularMarketChangePercent,shortName,marketState'
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolList}&fields=${fields}`

  const res = await fetchWithTimeout(url)
  if (!res.ok) throw new Error(`Yahoo Finance HTTP ${res.status}`)
  const data = await res.json()
  const results = data?.quoteResponse?.result ?? []
  if (!results.length) throw new Error('Yahoo Finance returned no results')

  return results.map((q) => ({
    symbol: q.symbol,
    name:
      q.shortName ??
      TRACKED_SYMBOLS.find((s) => s.symbol === q.symbol)?.name ??
      q.symbol,
    price: q.regularMarketPrice,
    change: q.regularMarketChange,
    changePercent: q.regularMarketChangePercent,
    positive: (q.regularMarketChange ?? 0) >= 0,
    marketState: q.marketState ?? null,
  }))
}

async function fetchRedditStocks() {
  const url = `https://www.reddit.com/r/stocks/hot.json?limit=12&raw_json=1`
  const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Reddit r/stocks HTTP ${res.status}`)
  const data = await res.json()
  const children = data?.data?.children ?? []
  return children
    .filter((p) => p.kind === 't3' && !p.data.stickied)
    .map((p) => {
      const d = p.data
      const rawUrl = d.url ?? ''
      return {
        id: d.id,
        title: d.title,
        url: rawUrl.startsWith('/') ? `https://reddit.com${rawUrl}` : rawUrl,
        score: d.score,
        numComments: d.num_comments,
        commentUrl: `https://reddit.com${d.permalink}`,
      }
    })
    .slice(0, 10)
}

export function useStocks() {
  const [sources, setSources] = useState({
    quotes: { status: 'idle', data: null, error: null },
    discussion: { status: 'idle', data: null, error: null },
  })
  const [lastUpdated, setLastUpdated] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setSources({
      quotes: { status: 'loading', data: null, error: null },
      discussion: { status: 'loading', data: null, error: null },
    })

    const [quotesResult, discussionResult] = await Promise.allSettled([
      fetchYahooFinance(),
      fetchRedditStocks(),
    ])

    setSources({
      quotes: {
        status: quotesResult.status === 'fulfilled' ? 'ok' : 'error',
        data: quotesResult.status === 'fulfilled' ? quotesResult.value : null,
        error:
          quotesResult.status === 'rejected'
            ? (quotesResult.reason?.message ?? 'Failed')
            : null,
      },
      discussion: {
        status: discussionResult.status === 'fulfilled' ? 'ok' : 'error',
        data: discussionResult.status === 'fulfilled' ? discussionResult.value : null,
        error:
          discussionResult.status === 'rejected'
            ? (discussionResult.reason?.message ?? 'Failed')
            : null,
      },
    })

    setLastUpdated(new Date())
    setLoading(false)
  }, [])

  return { sources, lastUpdated, loading, fetchAll }
}
