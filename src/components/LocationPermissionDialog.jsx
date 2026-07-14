/**
 * LocationPermissionDialog – accessible modal dialog for location consent.
 *
 * Accessibility:
 *  - role="dialog" with aria-modal, aria-labelledby, aria-describedby
 *  - Focus is moved to the "Yes" button on mount and trapped within the dialog
 *  - Escape key is suppressed (user must make a choice)
 *  - Backdrop prevents interaction with content behind it
 *  - Live region announces when location request is in progress
 */

import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTORS =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function LocationPermissionDialog({ onAllow, onDecline, isRequesting }) {
  const dialogRef = useRef(null)
  const allowBtnRef = useRef(null)

  // Move focus to the "Yes" button when dialog mounts
  useEffect(() => {
    allowBtnRef.current?.focus()
  }, [])

  // Trap focus within the dialog
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      // Don't allow closing without making a choice
      e.preventDefault()
      return
    }

    if (e.key !== 'Tab') return

    const focusable = dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTORS)
    if (!focusable || focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.shiftKey) {
      // Shift+Tab: wrap from first to last
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      // Tab: wrap from last to first
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  return (
    <div className="dialog-backdrop" aria-hidden="false">
      {/* aria-live region so screen readers announce request-in-progress state */}
      <div aria-live="polite" aria-atomic="true" className="live-region">
        {isRequesting ? 'Requesting your device location, please wait…' : ''}
      </div>

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-dialog-title"
        aria-describedby="location-dialog-desc"
        className="dialog"
        onKeyDown={handleKeyDown}
      >
        <h2 id="location-dialog-title" className="dialog-title">
          <span aria-hidden="true">📍</span> Share your location?
        </h2>

        <p id="location-dialog-desc" className="dialog-desc">
          This app can show relevant local weather and news for your area when you share
          your location. Your location data stays in your browser and is never sent to any
          server.
        </p>

        <p className="dialog-desc">
          If you prefer not to share, we&apos;ll use{' '}
          <strong>Washington, D.C.</strong> as the default for all location-based content.
        </p>

        <p className="dialog-note">
          You can change this preference at any time from the{' '}
          <strong>Settings</strong> control below the navigation bar.
        </p>

        <div className="dialog-actions">
          <button
            ref={allowBtnRef}
            className="btn btn-primary"
            onClick={onAllow}
            disabled={isRequesting}
            aria-busy={isRequesting}
            aria-describedby="location-dialog-desc"
          >
            {isRequesting ? (
              <>
                <span className="loading-spinner" aria-hidden="true" />
                Requesting location…
              </>
            ) : (
              <>
                <span aria-hidden="true">📍</span>
                Yes, use my location
              </>
            )}
          </button>

          <button
            className="btn btn-secondary"
            onClick={onDecline}
            disabled={isRequesting}
          >
            <span aria-hidden="true">🏛️</span>
            No thanks — use Washington, D.C.
          </button>
        </div>
      </div>
    </div>
  )
}
