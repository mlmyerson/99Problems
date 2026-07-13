/**
 * useNews – fetches news headlines from public free APIs (no API key):
 *   1. Hacker News "Top Stories" API (https://hacker.news/v0)
 *      - Fetches top story IDs, then loads first N individual items
 *   2. Wikipedia "In the news" via REST API (fallback for variety)
 *
 * Falls back gracefully if either source is unavailable.
 */

import { useState, useCallback } from 'react'

const HN_BASE = 'https://hacker-news.firebaseio.com/v0'
const HN_TOP_STORIES = `${HN_BASE}/topstories.json`
const STORY_COUNT = 10

async function fetchHackerNews() {
  const idsRes = await fetch(HN_TOP_STORIES)
  if (!idsRes.ok) throw new Error(`HN top stories HTTP ${idsRes.status}`)
  const ids = await idsRes.json()

  const topIds = ids.slice(0, STORY_COUNT)
  const stories = await Promise.all(
    topIds.map(async (id) => {
      const res = await fetch(`${HN_BASE}/item/${id}.json`)
      if (!res.ok) return null
      return res.json()
    })
  )

  return stories
    .filter(Boolean)
    .filter((s) => s.url || s.title)
    .map((s) => ({
      id: String(s.id),
      title: s.title,
      url: s.url ?? `https://news.ycombinator.com/item?id=${s.id}`,
      source: 'Hacker News',
      score: s.score,
      by: s.by,
      time: s.time ? new Date(s.time * 1000) : null,
      commentUrl: `https://news.ycombinator.com/item?id=${s.id}`,
    }))
}

async function fetchWikipediaInTheNews() {
  // Wikipedia "current events" news portal via REST summary endpoint
  const url =
    'https://en.wikipedia.org/api/rest_v1/page/summary/Portal:Current_events'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Wikipedia HTTP ${res.status}`)
  const data = await res.json()

  // Extract plain-text sentences as pseudo-headlines
  const extract = data.extract ?? ''
  const sentences = extract
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.length > 30 && s.length < 200)
    .slice(0, 5)

  return sentences.map((sentence, i) => ({
    id: `wiki-${i}`,
    title: sentence.replace(/\[\d+\]/g, '').trim(),
    url: 'https://en.wikipedia.org/wiki/Portal:Current_events',
    source: 'Wikipedia Current Events',
    score: null,
    by: 'Wikipedia',
    time: null,
    commentUrl: null,
  }))
}

export function useNews() {
  const [sources, setSources] = useState({
    hackerNews: { status: 'idle', data: null, error: null },
    wikipedia: { status: 'idle', data: null, error: null },
  })
  const [lastUpdated, setLastUpdated] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setSources({
      hackerNews: { status: 'loading', data: null, error: null },
      wikipedia: { status: 'loading', data: null, error: null },
    })

    const [hnResult, wikiResult] = await Promise.allSettled([
      fetchHackerNews(),
      fetchWikipediaInTheNews(),
    ])

    setSources({
      hackerNews:
        hnResult.status === 'fulfilled'
          ? { status: 'ok', data: hnResult.value, error: null }
          : { status: 'error', data: null, error: hnResult.reason?.message ?? 'Failed' },
      wikipedia:
        wikiResult.status === 'fulfilled'
          ? { status: 'ok', data: wikiResult.value, error: null }
          : { status: 'error', data: null, error: wikiResult.reason?.message ?? 'Failed' },
    })

    setLastUpdated(new Date())
    setLoading(false)
  }, [])

  return { sources, lastUpdated, loading, fetchAll }
}
