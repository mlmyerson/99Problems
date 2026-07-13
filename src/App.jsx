/**
 * App – Root component for the 99 Problems Weather & News Aggregator.
 *
 * Responsibilities:
 *  - Detect user's geolocation (with permission)
 *  - Trigger parallel fetches for weather and news on load and on manual refresh
 *  - Render accessible layout with semantic landmarks
 *  - Announce state changes via aria-live regions
 */

import { useEffect, useCallback, useState, useRef } from 'react'
import WeatherSection from './components/WeatherSection.jsx'
import NewsSection from './components/NewsSection.jsx'
import { useWeather } from './hooks/useWeather.js'
import { useNews } from './hooks/useNews.js'

// Default location: New York City (fallback when geolocation is unavailable/denied)
const DEFAULT_LAT = 40.7128
const DEFAULT_LON = -74.006
const DEFAULT_LOCATION_NAME = 'New York City (default)'

function useGeolocation() {
  const [location, setLocation] = useState(null)
  const [locationName, setLocationName] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [locationLoading, setLocationLoading] = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({ lat: DEFAULT_LAT, lon: DEFAULT_LON })
      setLocationName(DEFAULT_LOCATION_NAME)
      setLocationError('Geolocation not supported; using default location.')
      setLocationLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        setLocation({ lat, lon })
        // Reverse-geocode via Open-Meteo timezone endpoint (no key needed)
        try {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
          setLocationName(`${lat.toFixed(2)}°, ${lon.toFixed(2)}° (${tz})`)
        } catch {
          setLocationName(`${lat.toFixed(2)}°, ${lon.toFixed(2)}°`)
        }
        setLocationLoading(false)
      },
      (err) => {
        setLocation({ lat: DEFAULT_LAT, lon: DEFAULT_LON })
        setLocationName(DEFAULT_LOCATION_NAME)
        setLocationError(`Location access denied. Using default location. (${err.message})`)
        setLocationLoading(false)
      },
      { timeout: 8000, enableHighAccuracy: false }
    )
  }, [])

  return { location, locationName, locationError, locationLoading }
}

export default function App() {
  const { location, locationName, locationError, locationLoading } = useGeolocation()
  const { sources: weatherSources, lastUpdated: weatherUpdated, loading: weatherLoading, fetchAll: fetchWeather } = useWeather()
  const { sources: newsSources, lastUpdated: newsUpdated, loading: newsLoading, fetchAll: fetchNews } = useNews()
  const [announceMsg, setAnnounceMsg] = useState('')
  const initialFetchDone = useRef(false)

  const doRefresh = useCallback(
    (lat, lon) => {
      setAnnounceMsg('Refreshing weather and news data…')
      fetchWeather(lat, lon)
      fetchNews()
    },
    [fetchWeather, fetchNews]
  )

  // Initial fetch once location is resolved
  useEffect(() => {
    if (location && !initialFetchDone.current) {
      initialFetchDone.current = true
      doRefresh(location.lat, location.lon)
    }
  }, [location, doRefresh])

  // Announce when both fetches complete
  useEffect(() => {
    if (!weatherLoading && !newsLoading && (weatherUpdated || newsUpdated)) {
      setAnnounceMsg('Weather and news data updated successfully.')
    }
  }, [weatherLoading, newsLoading, weatherUpdated, newsUpdated])

  const isRefreshing = weatherLoading || newsLoading
  const currentYear = new Date().getFullYear()

  return (
    <>
      {/* Skip-to-content for keyboard users */}
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      {/* Accessible live region for screen reader announcements */}
      <div
        className="live-region"
        aria-live="polite"
        aria-atomic="true"
        role="status"
      >
        {announceMsg}
      </div>

      <header className="app-header" role="banner">
        <h1>99 Problems — Weather &amp; News</h1>
        <p>Aggregating public data from multiple free APIs</p>
      </header>

      <main id="main-content" className="app-main" role="main">
        {/* Toolbar: location info + refresh button */}
        <div className="toolbar" role="region" aria-label="Controls and status">
          <div className="toolbar-info">
            {locationLoading ? (
              <span>
                <span className="loading-spinner" aria-hidden="true" />
                Detecting location…
              </span>
            ) : (
              <span className="location-display">
                <strong>Location: </strong>
                <span aria-label={`Current location: ${locationName}`}>{locationName}</span>
              </span>
            )}
            {locationError && (
              <span
                className="alert alert-info alert-inline"
                role="note"
                aria-label={`Location note: ${locationError}`}
              >
                ℹ️ {locationError}
              </span>
            )}
          </div>

          <button
            className="btn btn-primary"
            onClick={() => location && doRefresh(location.lat, location.lon)}
            disabled={isRefreshing || locationLoading}
            aria-busy={isRefreshing}
            aria-label={isRefreshing ? 'Refreshing data, please wait' : 'Refresh weather and news data'}
          >
            {isRefreshing ? (
              <>
                <span className="loading-spinner" aria-hidden="true" />
                Refreshing…
              </>
            ) : (
              <>
                <span aria-hidden="true">🔄</span>
                Refresh
              </>
            )}
          </button>
        </div>

        {/* Weather Section */}
        <WeatherSection
          sources={weatherSources}
          loading={weatherLoading}
          lastUpdated={weatherUpdated}
        />

        {/* News Section */}
        <NewsSection
          sources={newsSources}
          loading={newsLoading}
          lastUpdated={newsUpdated}
        />
      </main>

      <footer className="app-footer" role="contentinfo">
        <p>
          Data from{' '}
          <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer">
            Open-Meteo
          </a>
          ,{' '}
          <a href="https://api.weather.gov" target="_blank" rel="noopener noreferrer">
            NOAA/NWS
          </a>
          ,{' '}
          <a href="https://news.ycombinator.com" target="_blank" rel="noopener noreferrer">
            Hacker News
          </a>
          , and{' '}
          <a href="https://en.wikipedia.org/wiki/Portal:Current_events" target="_blank" rel="noopener noreferrer">
            Wikipedia
          </a>
          . All free public APIs. No API keys required.
        </p>
        <p>© {currentYear} 99 Problems Aggregator</p>
      </footer>
    </>
  )
}
