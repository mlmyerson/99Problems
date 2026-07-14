/**
 * CategoryNav – accessible tab-bar navigation for the five content categories.
 *
 * Implements the ARIA Tabs design pattern:
 *   - role="tablist" containing role="tab" buttons
 *   - aria-selected on the active tab
 *   - aria-controls pointing to each panel
 *   - Arrow-key navigation between tabs (left/right/home/end)
 *   - Only the active tab is in the tab order (tabIndex 0 vs -1)
 */

export const CATEGORIES = [
  { id: 'weather', label: 'Weather', icon: '🌤️', shortLabel: 'Weather' },
  { id: 'local', label: 'Local Politics', icon: '🏙️', shortLabel: 'Local' },
  { id: 'american', label: 'US Politics', icon: '🇺🇸', shortLabel: 'US' },
  { id: 'world', label: 'World Politics', icon: '🌍', shortLabel: 'World' },
  { id: 'stocks', label: 'Markets', icon: '📈', shortLabel: 'Markets' },
]

const CAT_IDS = CATEGORIES.map((c) => c.id)

export default function CategoryNav({ active, onChange }) {
  const handleKeyDown = (e) => {
    const idx = CAT_IDS.indexOf(active)
    let nextId = null

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      nextId = CAT_IDS[(idx + 1) % CAT_IDS.length]
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      nextId = CAT_IDS[(idx - 1 + CAT_IDS.length) % CAT_IDS.length]
    } else if (e.key === 'Home') {
      e.preventDefault()
      nextId = CAT_IDS[0]
    } else if (e.key === 'End') {
      e.preventDefault()
      nextId = CAT_IDS[CAT_IDS.length - 1]
    }

    if (nextId) {
      onChange(nextId)
      // Move DOM focus to the newly selected tab
      document.getElementById(`tab-${nextId}`)?.focus()
    }
  }

  return (
    <nav className="category-nav" aria-label="Content categories">
      <div role="tablist" aria-label="Content categories" className="tab-list">
        {CATEGORIES.map((cat) => {
          const isActive = active === cat.id
          return (
            <button
              key={cat.id}
              id={`tab-${cat.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${cat.id}`}
              className="tab-btn"
              data-active={isActive ? 'true' : 'false'}
              onClick={() => onChange(cat.id)}
              onKeyDown={handleKeyDown}
              tabIndex={isActive ? 0 : -1}
            >
              <span className="tab-icon" aria-hidden="true">
                {cat.icon}
              </span>
              {/* Full label visible on wider screens; short label on narrow.
                  Both use display:none to toggle — CSS removes from a11y tree when hidden.
                  Neither needs aria-hidden since display:none handles it correctly. */}
              <span className="tab-label-full">{cat.label}</span>
              <span className="tab-label-short">{cat.shortLabel}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
