/**
 * App – Root component for 99 Problems Aggregator.
 *
 * Responsibilities:
 *  - Location permission flow: first-visit consent dialog → persist choice
 *  - Category navigation: Weather / Local Politics / US Politics / World Politics / Markets
 *  - Lazy per-category data fetching (fetch on first tab visit, re-fetch on Refresh)
 *  - Global aria-live announcements for loading/error/refresh events
 *  - Settings panel to reset/change location preference
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useLocation } from './hooks/useLocation.js'
import { useWeather } from './hooks/useWeather.js'
import { usePolitics } from './hooks/usePolitics.js'
import { useStocks } from './hooks/useStocks.js'
import WeatherSection from './components/WeatherSection.jsx'
import PoliticsSection from './components/PoliticsSection.jsx'
import StockMarketSection from './components/StockMarketSection.jsx'
import CategoryNav, { CATEGORIES } from './components/CategoryNav.jsx'
import LocationPermissionDialog from './components/LocationPermissionDialog.jsx'

function getLocationPreferenceLabel(loc) {
  if (loc.choice === 'declined') {
    return 'Using Washington, D.C. (location sharing declined)'
  }
  if (loc.choice === 'allowed' && loc.browserDenied) {
    return 'Location sharing allowed, but your browser denied access. Using Washington, D.C.'
  }
  if (loc.choice === 'allowed') {
    return `Using your device location (${loc.locationName})`
  }
  return 'Not yet set'
}

export default function App() {
  const loc = useLocation()
  const [activeCategory, setActiveCategory] = useState('weather')
  const [announceMsg, setAnnounceMsg] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  // Data hooks (one per category)
  const weather = useWeather()
  const localPolitics = usePolitics('local')
  const americanPolitics = usePolitics('american')
  const worldPolitics = usePolitics('world')
  const stocks = useStocks()

  // Keep stable refs to each fetchAll so the auto-fetch effect doesn't re-run
  // every render due to stale-closure warnings from eslint-plugin-react-hooks.
  const fetchRefs = useRef({})
  fetchRefs.current = {
    weather: weather.fetchAll,
    local: localPolitics.fetchAll,
    american: americanPolitics.fetchAll,
    world: worldPolitics.fetchAll,
    stocks: stocks.fetchAll,
  }

  // Track which (category + location) keys have already been fetched
  const fetchedRef = useRef(new Set())

  // Derive a cache key for the active category
  const cacheKey = (catId) =>
    catId === 'weather' || catId === 'local'
      ? `${catId}::${loc.lat}::${loc.lon}`
      : catId

  // Auto-fetch the active category on first visit (after location resolves)
  useEffect(() => {
    if (loc.needsPermission || loc.isRequestingLocation) return
    const key = cacheKey(activeCategory)
    if (fetchedRef.current.has(key)) return
    fetchedRef.current.add(key)

    const fn = fetchRefs.current[activeCategory]
    if (!fn) return

    if (activeCategory === 'weather') fn(loc.lat, loc.lon)
    else if (activeCategory === 'local') fn(loc.lat, loc.lon, loc.locationName)
    else fn()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, loc.needsPermission, loc.isRequestingLocation, loc.lat, loc.lon])

  // Announce when the active section finishes loading
  const loadingMap = {
    weather: weather.loading,
    local: localPolitics.loading,
    american: americanPolitics.loading,
    world: worldPolitics.loading,
    stocks: stocks.loading,
  }
  const isLoading = loadingMap[activeCategory] ?? false
  const prevLoadingRef = useRef(false)
  useEffect(() => {
    if (prevLoadingRef.current && !isLoading) {
      const label = CATEGORIES.find((c) => c.id === activeCategory)?.label ?? 'Data'
      setAnnounceMsg(`${label} updated.`)
    }
    prevLoadingRef.current = isLoading
  }, [isLoading, activeCategory])

  const handleRefresh = useCallback(() => {
    const label = CATEGORIES.find((c) => c.id === activeCategory)?.label ?? 'Data'
    setAnnounceMsg(`Refreshing ${label}…`)

    const fn = fetchRefs.current[activeCategory]
    if (!fn) return
    if (activeCategory === 'weather') fn(loc.lat, loc.lon)
    else if (activeCategory === 'local') fn(loc.lat, loc.lon, loc.locationName)
    else fn()
  }, [activeCategory, loc.lat, loc.lon, loc.locationName])

  const handleCategoryChange = (catId) => {
    setActiveCategory(catId)
    // Move focus into the panel for keyboard/screen-reader users
    requestAnimationFrame(() => {
      document.getElementById(`panel-${catId}`)?.focus()
    })
  }

  const handleResetLocation = () => {
    loc.resetLocation()
    setShowSettings(false)
    // Clear fetch cache so data re-loads with the new location after dialog
    fetchedRef.current.clear()
  }

  const currentYear = new Date().getFullYear()

  const localNote =
    loc.choice === 'declined'
      ? 'Showing news for Washington, D.C. (default). Allow location sharing in Settings for local results.'
      : `Showing news relevant to: ${loc.locationName}`

  return (
    <>
      {/* Skip-to-content link for keyboard users */}
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      {/* Global aria-live region for screen-reader announcements */}
      <div
        className="live-region"
        aria-live="polite"
        aria-atomic="true"
        role="status"
      >
        {announceMsg}
      </div>

      {/* Location permission dialog (shown on first visit only) */}
      {(loc.needsPermission || loc.isRequestingLocation) && (
        <LocationPermissionDialog
          onAllow={loc.allowLocation}
          onDecline={loc.declineLocation}
          isRequesting={loc.isRequestingLocation}
        />
      )}

      <header className="app-header" role="banner">
        <h1>99 Problems</h1>
        <p>Weather, politics &amp; markets — free public data, no accounts needed</p>
      </header>

      {/* Category tab navigation */}
      <CategoryNav active={activeCategory} onChange={handleCategoryChange} />

      <main id="main-content" className="app-main" role="main" tabIndex={-1}>
        {/* Toolbar: location info + settings + refresh */}
        <div className="toolbar" role="region" aria-label="Controls and status">
          <div className="toolbar-info">
            {loc.isRequestingLocation ? (
              <span>
                <span className="loading-spinner" aria-hidden="true" />
                Detecting location…
              </span>
            ) : (
              <span className="location-display">
                <strong>Location: </strong>
                <span aria-label={`Current location: ${loc.locationName}`}>
                  {loc.locationName}
                </span>
              </span>
            )}
            {loc.browserDenied && (
              <span
                className="alert alert-info alert-inline"
                role="note"
                aria-label="Browser location access denied; using default location"
              >
                ℹ️ Browser access denied; using default
              </span>
            )}
          </div>

          <div className="toolbar-actions">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowSettings((s) => !s)}
              aria-expanded={showSettings}
              aria-controls="location-settings"
              aria-label={showSettings ? 'Close settings' : 'Open location settings'}
            >
              <span aria-hidden="true">⚙️</span>
              <span>Settings</span>
            </button>

            <button
              className="btn btn-primary"
              onClick={handleRefresh}
              disabled={isLoading || loc.needsPermission || loc.isRequestingLocation}
              aria-busy={isLoading}
              aria-label={
                isLoading
                  ? 'Refreshing data, please wait'
                  : `Refresh ${CATEGORIES.find((c) => c.id === activeCategory)?.label ?? 'data'}`
              }
            >
              {isLoading ? (
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
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div
            id="location-settings"
            className="settings-panel"
            role="region"
            aria-label="Location settings"
          >
            <h3 className="settings-title">
              <span aria-hidden="true">⚙️</span> Location Settings
            </h3>
            <p className="settings-desc">
              <strong>Current preference: </strong>
              {getLocationPreferenceLabel(loc)}
            </p>
            <button className="btn btn-secondary" onClick={handleResetLocation}>
              <span aria-hidden="true">🔄</span>
              Change location preference
            </button>
          </div>
        )}

        {/*
         * Category panels — all rendered in the DOM; only the active one is visible.
         * Using `hidden` attribute keeps inactive panels out of the accessibility tree
         * while preserving their mounted state (no unmount/remount on tab switch).
         */}
        <div
          id="panel-weather"
          role="tabpanel"
          aria-labelledby="tab-weather"
          hidden={activeCategory !== 'weather'}
          tabIndex={-1}
        >
          <WeatherSection
            sources={weather.sources}
            loading={weather.loading}
            lastUpdated={weather.lastUpdated}
          />
        </div>

        <div
          id="panel-local"
          role="tabpanel"
          aria-labelledby="tab-local"
          hidden={activeCategory !== 'local'}
          tabIndex={-1}
        >
          <PoliticsSection
            sources={localPolitics.sources}
            loading={localPolitics.loading}
            lastUpdated={localPolitics.lastUpdated}
            headingId="local-politics-heading"
            title="Local Politics"
            icon="🏙️"
            locationNote={localNote}
          />
        </div>

        <div
          id="panel-american"
          role="tabpanel"
          aria-labelledby="tab-american"
          hidden={activeCategory !== 'american'}
          tabIndex={-1}
        >
          <PoliticsSection
            sources={americanPolitics.sources}
            loading={americanPolitics.loading}
            lastUpdated={americanPolitics.lastUpdated}
            headingId="american-politics-heading"
            title="American Politics"
            icon="🇺🇸"
          />
        </div>

        <div
          id="panel-world"
          role="tabpanel"
          aria-labelledby="tab-world"
          hidden={activeCategory !== 'world'}
          tabIndex={-1}
        >
          <PoliticsSection
            sources={worldPolitics.sources}
            loading={worldPolitics.loading}
            lastUpdated={worldPolitics.lastUpdated}
            headingId="world-politics-heading"
            title="World Politics"
            icon="🌍"
          />
        </div>

        <div
          id="panel-stocks"
          role="tabpanel"
          aria-labelledby="tab-stocks"
          hidden={activeCategory !== 'stocks'}
          tabIndex={-1}
        >
          <StockMarketSection
            sources={stocks.sources}
            loading={stocks.loading}
            lastUpdated={stocks.lastUpdated}
          />
        </div>
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
          <a href="https://www.reddit.com" target="_blank" rel="noopener noreferrer">
            Reddit
          </a>
          , and{' '}
          <a href="https://finance.yahoo.com" target="_blank" rel="noopener noreferrer">
            Yahoo Finance
          </a>
          . All free public sources. No API keys or accounts required.
        </p>
        <p>© {currentYear} 99 Problems Aggregator</p>
      </footer>
    </>
  )
}
