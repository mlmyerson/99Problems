/**
 * usePolitics – fetches news/politics headlines from Reddit's free JSON API.
 *
 * Categories:
 *   'local'    – Reddit search for city/region-based news + r/news fallback
 *   'american' – r/politics + r/uspolitics
 *   'world'    – r/worldnews + r/geopolitics
 *
 * Reddit's *.json endpoints are free, public, and CORS-enabled for read access.
 * Includes per-request timeout and partial failure tolerance.
 */

import { useState, useCallback } from 'react'

const TIMEOUT_MS = 10000
const ITEM_COUNT = 15

// Simple fetch wrapper with AbortController timeout
function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  )
}

function parseRedditPosts(data) {
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
        source: `r/${d.subreddit}`,
        score: d.score,
        by: d.author,
        time: d.created_utc ? new Date(d.created_utc * 1000) : null,
        commentUrl: `https://reddit.com${d.permalink}`,
        numComments: d.num_comments,
      }
    })
    .slice(0, ITEM_COUNT)
}

async function fetchSubreddit(subreddit) {
  const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${ITEM_COUNT}&raw_json=1`
  const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Reddit r/${subreddit} HTTP ${res.status}`)
  const data = await res.json()
  return parseRedditPosts(data)
}

async function fetchRedditSearch(query) {
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=hot&t=week&limit=${ITEM_COUNT}&raw_json=1`
  const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Reddit search HTTP ${res.status}`)
  const data = await res.json()
  return parseRedditPosts(data)
}

/**
 * @param {'local'|'american'|'world'} category
 */
export function usePolitics(category) {
  const [sources, setSources] = useState({
    primary: { status: 'idle', data: null, error: null, name: '' },
    secondary: { status: 'idle', data: null, error: null, name: '' },
  })
  const [lastUpdated, setLastUpdated] = useState(null)
  const [loading, setLoading] = useState(false)

  /**
   * @param {number} [lat]
   * @param {number} [lon]
   * @param {string} [locationName] - Human-readable location name for local searches.
   */
  const fetchAll = useCallback(
    async (lat, lon, locationName) => {
      setLoading(true)

      let primaryFetch, secondaryFetch
      let primaryName, secondaryName

      if (category === 'american') {
        primaryName = 'r/politics'
        secondaryName = 'r/uspolitics'
        primaryFetch = fetchSubreddit('politics')
        secondaryFetch = fetchSubreddit('uspolitics')
      } else if (category === 'world') {
        primaryName = 'r/worldnews'
        secondaryName = 'r/geopolitics'
        primaryFetch = fetchSubreddit('worldnews')
        secondaryFetch = fetchSubreddit('geopolitics')
      } else {
        // local — search Reddit using the location name
        const cityQuery = locationName
          ? locationName.split('(')[0].replace(/[°NEWSnsew\d.,]/g, '').trim() || 'Washington DC'
          : 'Washington DC'
        primaryName = 'r/news (US local)'
        secondaryName = `search: "${cityQuery} politics"`
        primaryFetch = fetchSubreddit('news')
        secondaryFetch = fetchRedditSearch(`${cityQuery} local politics`)
      }

      setSources({
        primary: { status: 'loading', data: null, error: null, name: primaryName },
        secondary: { status: 'loading', data: null, error: null, name: secondaryName },
      })

      const [primaryResult, secondaryResult] = await Promise.allSettled([
        primaryFetch,
        secondaryFetch,
      ])

      setSources({
        primary: {
          status: primaryResult.status === 'fulfilled' ? 'ok' : 'error',
          data: primaryResult.status === 'fulfilled' ? primaryResult.value : null,
          error:
            primaryResult.status === 'rejected'
              ? (primaryResult.reason?.message ?? 'Failed')
              : null,
          name: primaryName,
        },
        secondary: {
          status: secondaryResult.status === 'fulfilled' ? 'ok' : 'error',
          data: secondaryResult.status === 'fulfilled' ? secondaryResult.value : null,
          error:
            secondaryResult.status === 'rejected'
              ? (secondaryResult.reason?.message ?? 'Failed')
              : null,
          name: secondaryName,
        },
      })

      setLastUpdated(new Date())
      setLoading(false)
    },
    [category],
  )

  return { sources, lastUpdated, loading, fetchAll }
}
