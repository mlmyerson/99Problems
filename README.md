# 99 Problems — Weather & News Aggregator

A **mobile-first, accessible** static site that aggregates weather data and news headlines from multiple free public APIs — no API keys required. Built with **React + Vite** and deployed to **GitHub Pages**.

---

## Project Purpose

This is a proof-of-concept data aggregation dashboard that:

- Fetches current weather from **two independent sources** in parallel
- Fetches tech/current-events news from **two independent sources** in parallel
- Handles partial failures gracefully — if one source is down, data from the other still appears
- Prioritizes **accessibility** so the site works with screen readers, keyboard navigation, and AI agents parsing the DOM
- Works on **mobile phones** as the primary form factor

---

## Chosen APIs and Rationale

### Weather

| Source | URL | Why |
|--------|-----|-----|
| **Open-Meteo** | https://open-meteo.com | Global coverage, no API key, free tier, returns current conditions in a single request |
| **NOAA/NWS** | https://api.weather.gov | Official US government forecast data, no API key, provides human-readable short forecasts |

**Limitations:** NOAA/NWS only covers US locations. Open-Meteo covers the whole world and will work as the sole weather source outside the US.

### News

| Source | URL | Why |
|--------|-----|-----|
| **Hacker News** | https://hacker.news (Firebase API) | Free, no API key, no CORS restrictions, tech/startup/science news |
| **Wikipedia Current Events** | https://en.wikipedia.org/wiki/Portal:Current_events | Free, no API key, broad world news coverage |

---

## Local Development

### Prerequisites

- Node.js 18+ and npm

### Setup

```bash
# Clone the repo
git clone https://github.com/mlmyerson/99Problems.git
cd 99Problems

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173/99Problems/](http://localhost:5173/99Problems/) in your browser.

### Build for Production

```bash
npm run build
# Output is in the dist/ directory

npm run preview   # Preview the production build locally
```

---

## GitHub Pages Deployment

The site deploys automatically to GitHub Pages via GitHub Actions when changes are pushed to the `main` branch.

**Live URL:** `https://mlmyerson.github.io/99Problems/`

### Setup Steps (one-time)

1. Go to **Settings → Pages** in the repository
2. Set **Source** to **GitHub Actions**
3. Push to `main` — the workflow at `.github/workflows/deploy.yml` will build and deploy automatically

The Vite config sets `base: '/99Problems/'` to ensure all asset paths resolve correctly under the project-page URL.

---

## Accessibility Features

| Feature | Implementation |
|---------|----------------|
| **Semantic landmarks** | `<header>`, `<main>`, `<section>`, `<footer>` with ARIA roles |
| **Heading hierarchy** | `<h1>` site title → `<h2>` section headings → `<h3>` card titles |
| **Screen-reader labels** | `aria-label` on all interactive controls and data cards |
| **Live region announcements** | `aria-live="polite"` region announces loading, errors, and successful refreshes |
| **Loading states** | `aria-busy="true"` on the refresh button while loading |
| **Keyboard navigation** | Visible `:focus-visible` outline on all focusable elements |
| **No color-only signaling** | Status badges use both color AND text labels AND dot indicators |
| **Skip link** | "Skip to main content" link at top of page for keyboard users |
| **Descriptive link text** | News links include `aria-label` clarifying the destination and "(opens in new tab)" |
| **Semantic time elements** | `<time>` with `dateTime` ISO attribute for machine-readable timestamps |
| **Alt text** | Decorative icons have `aria-hidden="true"`; meaningful images have descriptive labels |
| **AI-parseable DOM** | All data rendered as semantic HTML text, no canvas or image-only content |

---

## Known Limitations and Fallback Behavior

- **NOAA/NWS weather** only covers US locations. Outside the US, the NWS card will show an error badge while Open-Meteo continues to display global data.
- **Geolocation** requires browser permission. If denied, the app falls back to New York City as the default location and shows an informational notice.
- **Wikipedia news** extracts are sometimes sparse or formatted oddly — this is a known limitation of using the summary endpoint as a news feed.
- **Hacker News** reflects tech/startup/open-source community stories, not general world news.
- **No caching** — every page load or manual refresh hits the APIs fresh. A future improvement would be to add `localStorage` caching with a TTL.
- **No user-configurable location** — a future improvement would be a search box to look up any city.

---

## Future Improvements

- [ ] City search / location autocomplete
- [ ] `localStorage` caching to reduce API calls
- [ ] 7-day forecast display from Open-Meteo
- [ ] Dark mode support
- [ ] Additional news sources (e.g., RSS feed reader)
- [ ] Progressive Web App (PWA) offline support
