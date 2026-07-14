# 99 Problems — Weather, Politics & Markets

A **mobile-first, accessible** static site that aggregates weather, politics news, and stock market data from multiple free public APIs — no API keys or accounts required. Built with **React + Vite** and deployed to **GitHub Pages**.

---

## Categories

| Tab | Content | Data Sources |
|-----|---------|-------------|
| 🌤️ Weather | Current conditions + hourly forecast | Open-Meteo, NOAA/NWS |
| 🏙️ Local Politics | Regional news relevant to your location | Reddit r/news, Reddit search |
| 🇺🇸 American Politics | US political headlines | Reddit r/politics, r/uspolitics |
| 🌍 World Politics | International news | Reddit r/worldnews, r/geopolitics |
| 📈 Markets | Index/ETF quotes + market discussion | Yahoo Finance, Reddit r/stocks |

---

## Location Permission & Default Behavior

On first load, the app shows an accessible consent dialog asking whether to use your device location:

- **Allow** — the browser requests geolocation. If granted, your coordinates are used for location-sensitive sections (weather, local politics). If the browser itself denies access, the app silently falls back to Washington, D.C.
- **Decline** — **Washington, D.C.** is used as the default for all location-based content.

Your choice is **persisted in `localStorage`** so you are never prompted again. You can reset or change your preference at any time using the **Settings** button below the navigation bar.

---

## Data Sources & APIs

All sources are free and require no API keys.

| Source | Used For | Notes |
|--------|----------|-------|
| [Open-Meteo](https://open-meteo.com) | Current weather (global) | JSON REST, CORS-enabled |
| [NOAA/NWS](https://api.weather.gov) | US hourly forecast | JSON REST, CORS-enabled; US-only |
| [Reddit JSON API](https://www.reddit.com) | Politics news + market discussion | Public `.json` endpoints, no auth |
| [Yahoo Finance](https://finance.yahoo.com) | Market quotes (SPY, QQQ, DIA, IWM, GLD, TLT) | Unofficial API; may be CORS-blocked in some environments |

### Known Limitations & Fallback Behavior

- **NOAA/NWS** only covers US locations. Non-US coordinates will return an error; Open-Meteo data is still shown.
- **Yahoo Finance** market quotes may be blocked by CORS in some browsers or hosting environments. When unavailable, a clear notice is shown with a direct link to Yahoo Finance, and Reddit r/stocks discussion is still displayed.
- **Reddit** may occasionally rate-limit rapid requests. The app retries on manual refresh.
- **Local politics** search quality depends on how well the location name maps to Reddit content. Results may not always be perfectly local.
- All fetch requests include a **10-second timeout**; a partial-failure error state is shown per source if a request times out.
- Data is loaded **lazily per category** (only when you visit that tab) and cached for the session. Use the **Refresh** button to reload the active category.

---

## Accessibility Features

- **Semantic landmarks**: `<header>`, `<nav>`, `<main>`, `<footer>` with ARIA roles.
- **Heading hierarchy**: `h1` → `h2` (section) → `h3` (sub-heading), no skipped levels.
- **ARIA tabs pattern**: `role="tablist"` / `role="tab"` / `role="tabpanel"` with `aria-selected`, `aria-controls`, and keyboard navigation (Arrow keys, Home, End).
- **Accessible location dialog**: `role="dialog"` with `aria-modal`, `aria-labelledby`, `aria-describedby`; focus trapped inside; Escape blocked until user makes a choice.
- **Live regions**: `aria-live="polite"` announces loading-start, load-complete, and refresh events without interrupting reading.
- **Per-source status badges**: `role="status"` badges show loading/OK/error state in both text and a colored dot (never color-only).
- **Error and info alerts**: `role="alert"` for errors; `role="note"` for informational messages.
- **Skip link**: "Skip to main content" visible on focus for keyboard users.
- **Visible focus rings**: All interactive elements have a 3px outline on `:focus-visible`.
- **Touch targets**: Tab buttons and cards meet 44×44 px minimum.
- **Contrast**: All foreground/background color pairings meet WCAG AA (4.5:1 minimum).
- **Decorative icons**: All emoji used as decoration carry `aria-hidden="true"`.
- **Change direction (stocks)**: Up/down is indicated by both ▲/▼ symbol and color — never color alone.

---

## Local Development

**Prerequisites**: Node.js 18+ and npm.

```bash
# Install dependencies
npm install

# Start development server (with HMR)
npm run dev

# Build for production (outputs to dist/)
npm run build

# Preview the production build locally
npm run preview
```

Open [http://localhost:5173/99Problems/](http://localhost:5173/99Problems/) in your browser.

---

## GitHub Pages Deployment

The site deploys automatically to GitHub Pages via GitHub Actions when changes are pushed to the `main` branch.

**Live URL:** `https://mlmyerson.github.io/99Problems/`

### Setup (one-time)

1. Go to **Settings → Pages** in the repository.
2. Set **Source** to **GitHub Actions**.
3. Push to `main` — the workflow at `.github/workflows/deploy.yml` builds and deploys automatically.

Vite is configured with `base: '/99Problems/'` in `vite.config.js` to ensure all asset paths resolve correctly under the project-page URL.

---

## Future Improvements

- Reverse-geocode coordinates to a human-readable city name for better local-politics search quality.
- Add a manual location entry field (city name input) as an alternative to browser geolocation.
- Cache last-good data in `localStorage` so stale data is shown on load while a fresh fetch runs.
- Add more market instruments (crypto, commodities) when reliable no-key APIs become available.
- Progressive Web App (PWA) manifest for installability and offline support.
