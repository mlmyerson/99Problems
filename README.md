# 99 Problems — Weather & News Aggregator

A **mobile-first, accessible** static site that aggregates weather data and news headlines from multiple free public APIs — no API keys required for the current frontend. Built with **React + Vite** and deployed to **GitHub Pages**.

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

# Optional: copy the env template for local-only configuration
cp .env.example .env

# Start development server
npm run dev
```

Open [http://localhost:5173/99Problems/](http://localhost:5173/99Problems/) in your browser.

### Environment Configuration

Use `.env.example` as the starting point for local configuration and keep your real `.env` file uncommitted.

#### Server-only secrets

- `OPENAI_API_KEY` is reserved for **server-side** use only.
- Never import it into Vite client code.
- Never rename it to `VITE_OPENAI_API_KEY`.
- A static GitHub Pages frontend cannot safely call OpenAI directly with a secret key, because any client-side secret would be exposed to every browser.

#### Public Vite variables

Only `VITE_` variables are exposed to the browser bundle. In this repository they are limited to safe, non-secret configuration such as:

- `VITE_OPENAI_PROXY_URL` — optional public URL for a future backend or serverless proxy
- `VITE_ENABLE_OPENAI_UI` — optional public feature flag

The client config guard in `src/config/publicEnv.js` throws if `VITE_OPENAI_API_KEY` is ever set, which helps prevent accidental secret exposure.

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

### GitHub Secrets Setup

1. Go to **Settings → Secrets and variables → Actions**
2. Choose **New repository secret**
3. Add `OPENAI_API_KEY`
4. Run the **Secret readiness check** workflow in **Actions** to verify the secret is available to server-side jobs without printing its value

The GitHub Pages deploy workflow intentionally does **not** inject `OPENAI_API_KEY` into the static frontend build. Keep `${{ secrets.OPENAI_API_KEY }}` limited to CI or backend/serverless contexts only.

### Maintainer checklist

- [ ] Add `OPENAI_API_KEY` in GitHub repository **Secrets and variables → Actions**
- [ ] Keep `.env` files local only; do not commit them
- [ ] Do not add `VITE_OPENAI_API_KEY` or any other secret-bearing `VITE_` variable
- [ ] If OpenAI features are added later, route browser traffic through a secure backend or serverless proxy

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
- [ ] Secure OpenAI integration via serverless function or backend proxy using `OPENAI_API_KEY` server-side only
