/**
 * useLocation – manages location permission and localStorage persistence.
 *
 * Permission flow:
 *  1. On first visit: return needsPermission=true so App renders a consent dialog.
 *  2. If user allows: request browser geolocation on each load (choice only, not
 *     coordinates, is stored — avoids persisting sensitive location data at rest).
 *     On browser denial, fall back to Washington, D.C.
 *  3. If user declines: use Washington, D.C. as the default.
 *  4. Persist only the user's choice (not coordinates) so the dialog is not shown again.
 *  5. Allow resetting the preference via resetLocation() (triggered from Settings).
 */

import { useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = '99problems_location_choice'

/** Washington, D.C. — default when location is declined or unavailable. */
export const DEFAULT_LAT = 38.9072
export const DEFAULT_LON = -77.0369
export const DEFAULT_LOCATION_NAME = 'Washington, D.C.'

function loadStoredChoice() {
  try {
    return localStorage.getItem(STORAGE_KEY) // 'allowed' | 'declined' | null
  } catch {
    /* ignore storage errors */
  }
  return null
}

function saveChoice(choice) {
  try {
    localStorage.setItem(STORAGE_KEY, choice)
  } catch {
    /* ignore storage errors */
  }
}

function buildLocationName(lat, lon) {
  const latDir = lat >= 0 ? 'N' : 'S'
  const lonDir = lon >= 0 ? 'E' : 'W'
  let tz = ''
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    /* ignore */
  }
  const base = `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lon).toFixed(2)}°${lonDir}`
  return tz ? `${base} (${tz})` : base
}

function requestGeolocation(onSuccess, onError) {
  if (!navigator.geolocation) {
    onError(new Error('Geolocation not supported'))
    return
  }
  navigator.geolocation.getCurrentPosition(onSuccess, onError, {
    timeout: 10000,
    enableHighAccuracy: false,
  })
}

export function useLocation() {
  const [state, setState] = useState(() => {
    const choice = loadStoredChoice()
    if (choice === 'declined') {
      return {
        status: 'resolved',
        choice: 'declined',
        lat: DEFAULT_LAT,
        lon: DEFAULT_LON,
        locationName: DEFAULT_LOCATION_NAME,
        browserDenied: false,
      }
    }
    if (choice === 'allowed') {
      // Choice is stored but coordinates are fetched fresh on each load
      return { status: 'requesting', choice: 'allowed' }
    }
    // No stored preference → show permission dialog
    return { status: 'pending' }
  })

  // When the stored choice is 'allowed', re-request geolocation on mount
  useEffect(() => {
    if (state.status !== 'requesting') return

    requestGeolocation(
      (pos) => {
        setState({
          status: 'resolved',
          choice: 'allowed',
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          locationName: buildLocationName(pos.coords.latitude, pos.coords.longitude),
          browserDenied: false,
        })
      },
      () => {
        // Browser permission denied or unavailable — fall back to D.C.
        setState({
          status: 'resolved',
          choice: 'allowed',
          lat: DEFAULT_LAT,
          lon: DEFAULT_LON,
          locationName: DEFAULT_LOCATION_NAME + ' (browser location denied)',
          browserDenied: true,
        })
      },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run once when state initializes as 'requesting'

  /** User clicked "Yes, use my location". */
  const allowLocation = useCallback(() => {
    saveChoice('allowed')
    setState({ status: 'requesting', choice: 'allowed' })

    requestGeolocation(
      (pos) => {
        setState({
          status: 'resolved',
          choice: 'allowed',
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          locationName: buildLocationName(pos.coords.latitude, pos.coords.longitude),
          browserDenied: false,
        })
      },
      () => {
        setState({
          status: 'resolved',
          choice: 'allowed',
          lat: DEFAULT_LAT,
          lon: DEFAULT_LON,
          locationName: DEFAULT_LOCATION_NAME + ' (browser location denied)',
          browserDenied: true,
        })
      },
    )
  }, [])

  /** User clicked "No thanks". Use Washington, D.C. silently. */
  const declineLocation = useCallback(() => {
    saveChoice('declined')
    setState({
      status: 'resolved',
      choice: 'declined',
      lat: DEFAULT_LAT,
      lon: DEFAULT_LON,
      locationName: DEFAULT_LOCATION_NAME,
      browserDenied: false,
    })
  }, [])

  /** Reset stored choice so the dialog reappears on next render. */
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
