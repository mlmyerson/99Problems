/**
 * useLocation – manages location permission and localStorage persistence.
 *
 * Permission flow:
 *  1. On first visit: return needsPermission=true so App renders a consent dialog.
 *  2. If user allows: request browser geolocation; on browser denial, fall back to D.C.
 *  3. If user declines: use Washington, D.C. as the default.
 *  4. Persist the choice so the dialog is never shown again.
 *  5. Allow resetting the preference via resetLocation() (triggered from Settings).
 */

import { useState, useCallback } from 'react'

const STORAGE_KEY = '99problems_location_pref'

/** Washington, D.C. — default when location is declined or unavailable. */
export const DEFAULT_LAT = 38.9072
export const DEFAULT_LON = -77.0369
export const DEFAULT_LOCATION_NAME = 'Washington, D.C.'

function loadStoredPreference() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore storage errors */
  }
  return null
}

function savePreference(pref) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pref))
  } catch {
    /* ignore storage errors */
  }
}

export function useLocation() {
  const [state, setState] = useState(() => {
    const stored = loadStoredPreference()
    if (stored) {
      return {
        status: 'resolved',
        choice: stored.choice,
        lat: stored.lat ?? DEFAULT_LAT,
        lon: stored.lon ?? DEFAULT_LON,
        locationName: stored.locationName ?? DEFAULT_LOCATION_NAME,
        browserDenied: stored.browserDenied ?? false,
      }
    }
    // No stored preference → show permission dialog
    return { status: 'pending' }
  })

  /** User clicked "Yes, use my location". Request browser geolocation. */
  const allowLocation = useCallback(() => {
    if (!navigator.geolocation) {
      const pref = {
        choice: 'allowed',
        lat: DEFAULT_LAT,
        lon: DEFAULT_LON,
        locationName: DEFAULT_LOCATION_NAME + ' (geolocation not supported)',
        browserDenied: true,
      }
      savePreference(pref)
      setState({ status: 'resolved', ...pref })
      return
    }

    // Show spinner while requesting
    setState((prev) => ({ ...prev, status: 'requesting' }))

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        let tz = ''
        try {
          tz = Intl.DateTimeFormat().resolvedOptions().timeZone
        } catch {
          /* ignore */
        }
        const locationName = tz
          ? `${lat.toFixed(2)}°N, ${Math.abs(lon).toFixed(2)}°${lon < 0 ? 'W' : 'E'} (${tz})`
          : `${lat.toFixed(2)}°N, ${Math.abs(lon).toFixed(2)}°${lon < 0 ? 'W' : 'E'}`

        const pref = { choice: 'allowed', lat, lon, locationName, browserDenied: false }
        savePreference(pref)
        setState({ status: 'resolved', ...pref })
      },
      () => {
        // Browser permission denied — fall back to Washington, D.C.
        const pref = {
          choice: 'allowed',
          lat: DEFAULT_LAT,
          lon: DEFAULT_LON,
          locationName: DEFAULT_LOCATION_NAME + ' (browser location denied)',
          browserDenied: true,
        }
        savePreference(pref)
        setState({ status: 'resolved', ...pref })
      },
      { timeout: 10000, enableHighAccuracy: false },
    )
  }, [])

  /** User clicked "No thanks". Use Washington, D.C. silently. */
  const declineLocation = useCallback(() => {
    const pref = {
      choice: 'declined',
      lat: DEFAULT_LAT,
      lon: DEFAULT_LON,
      locationName: DEFAULT_LOCATION_NAME,
      browserDenied: false,
    }
    savePreference(pref)
    setState({ status: 'resolved', ...pref })
  }, [])

  /** Reset stored preference so the dialog reappears on next render. */
  const resetLocation = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    setState({ status: 'pending' })
  }, [])

  return {
    /** True when the consent dialog should be shown. */
    needsPermission: state.status === 'pending',
    /** True while the browser geolocation request is in flight. */
    isRequestingLocation: state.status === 'requesting',
    lat: state.lat ?? DEFAULT_LAT,
    lon: state.lon ?? DEFAULT_LON,
    locationName: state.locationName ?? DEFAULT_LOCATION_NAME,
    /** 'allowed' | 'declined' | null */
    choice: state.choice ?? null,
    /** True if the user allowed but the browser denied access. */
    browserDenied: state.browserDenied ?? false,
    allowLocation,
    declineLocation,
    resetLocation,
  }
}
