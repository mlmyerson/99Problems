/**
 * useWeather – fetches weather data from two free public APIs in parallel:
 *   1. Open-Meteo (https://open-meteo.com) — global coverage, no API key
 *   2. NOAA/NWS (https://api.weather.gov)  — US coverage only, no API key
 *
 * Handles partial failures so the app still renders available data.
 */

import { useState, useCallback, useRef } from 'react'

// WMO Weather Interpretation Codes → human-readable description
const WMO_CODES = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Icy fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
}

function wmoDescription(code) {
  return WMO_CODES[code] ?? `Condition code ${code}`
}

async function fetchOpenMeteo(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m` +
    `&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto&forecast_days=1`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`)
  const data = await res.json()
  const c = data.current
  const units = data.current_units ?? {}

  return {
    source: 'Open-Meteo',
    temperature: `${Math.round(c.temperature_2m)}°F`,
    feelsLike: `${Math.round(c.apparent_temperature)}°F`,
    humidity: `${c.relative_humidity_2m}%`,
    windSpeed: `${Math.round(c.wind_speed_10m)} mph`,
    windDirection: degreesToCompass(c.wind_direction_10m),
    precipitation: `${c.precipitation} in`,
    condition: wmoDescription(c.weather_code),
    timezone: data.timezone,
    rawTemp: c.temperature_2m,
  }
}

async function fetchNWS(lat, lon) {
  // Step 1: get grid point metadata
  const pointsUrl = `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`
  const pointsRes = await fetch(pointsUrl, {
    headers: { 'User-Agent': '99Problems-Aggregator (github.com/mlmyerson/99Problems)' },
  })
  if (!pointsRes.ok) throw new Error(`NWS points HTTP ${pointsRes.status}`)
  const pointsData = await pointsRes.json()
  const props = pointsData.properties
  const forecastHourlyUrl = props.forecastHourly
  const officeName = props.relativeLocation?.properties
    ? `${props.relativeLocation.properties.city}, ${props.relativeLocation.properties.state}`
    : props.cwa ?? 'Unknown office'

  // Step 2: get hourly forecast (first period = current conditions)
  const forecastRes = await fetch(forecastHourlyUrl, {
    headers: { 'User-Agent': '99Problems-Aggregator (github.com/mlmyerson/99Problems)' },
  })
  if (!forecastRes.ok) throw new Error(`NWS forecast HTTP ${forecastRes.status}`)
  const forecastData = await forecastRes.json()
  const period = forecastData.properties.periods[0]

  // NWS values are already in °F and mph
  const tempF = period.temperature
  const windStr = period.windSpeed ?? ''
  const windDir = period.windDirection ?? ''

  return {
    source: 'NOAA/NWS',
    temperature: `${tempF}°F`,
    feelsLike: null,
    humidity: null,
    windSpeed: windStr,
    windDirection: windDir,
    precipitation: null,
    condition: period.shortForecast,
    location: officeName,
    rawTemp: tempF,
    icon: period.icon ?? null,
    isDaytime: period.isDaytime,
  }
}

function degreesToCompass(deg) {
  if (deg === null || deg === undefined) return ''
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round(deg / 22.5) % 16]
}

function formatTimestamp(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function useWeather() {
  const [sources, setSources] = useState({
    openMeteo: { status: 'idle', data: null, error: null },
    nws: { status: 'idle', data: null, error: null },
  })
  const [lastUpdated, setLastUpdated] = useState(null)
  const [loading, setLoading] = useState(false)
  const abortRef = useRef(null)

  const fetchAll = useCallback(async (lat, lon) => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setSources({
      openMeteo: { status: 'loading', data: null, error: null },
      nws: { status: 'loading', data: null, error: null },
    })

    const [omResult, nwsResult] = await Promise.allSettled([
      fetchOpenMeteo(lat, lon),
      fetchNWS(lat, lon),
    ])

    setSources({
      openMeteo:
        omResult.status === 'fulfilled'
          ? { status: 'ok', data: omResult.value, error: null }
          : { status: 'error', data: null, error: omResult.reason?.message ?? 'Failed' },
      nws:
        nwsResult.status === 'fulfilled'
          ? { status: 'ok', data: nwsResult.value, error: null }
          : { status: 'error', data: null, error: nwsResult.reason?.message ?? 'Failed' },
    })

    setLastUpdated(new Date())
    setLoading(false)
  }, [])

  return { sources, lastUpdated, loading, fetchAll }
}
