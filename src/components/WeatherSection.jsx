/**
 * WeatherSection – displays weather data from Open-Meteo and NOAA/NWS.
 * Includes semantic markup, ARIA labels, and accessible status indicators.
 */

import SourceBadge from './SourceBadge.jsx'

function WeatherCard({ data, sourceKey }) {
  const label = `Weather from ${data.source}: ${data.temperature}, feels like ${data.feelsLike ?? 'N/A'}, ${data.condition}`

  return (
    <article
      className="card"
      aria-label={label}
    >
      <header>
        <h3 className="card-title">{data.source}</h3>
        {data.location && (
          <p className="card-subtitle" aria-label={`Location: ${data.location}`}>
            📍 <span>{data.location}</span>
          </p>
        )}
        {data.timezone && !data.location && (
          <p className="card-subtitle" aria-label={`Timezone: ${data.timezone}`}>
            🕐 <span>{data.timezone}</span>
          </p>
        )}
      </header>

      <p
        className="weather-temp"
        aria-label={`Temperature: ${data.temperature}`}
      >
        {data.temperature}
      </p>

      <p className="weather-condition" aria-label={`Conditions: ${data.condition}`}>
        {data.condition}
      </p>

      <ul className="weather-details" aria-label="Weather details">
        {data.feelsLike && (
          <li className="weather-detail-item">
            Feels like <span>{data.feelsLike}</span>
          </li>
        )}
        {data.humidity && (
          <li className="weather-detail-item">
            Humidity <span>{data.humidity}</span>
          </li>
        )}
        {data.windSpeed && (
          <li className="weather-detail-item">
            Wind{' '}
            <span>
              {data.windSpeed}
              {data.windDirection ? ` ${data.windDirection}` : ''}
            </span>
          </li>
        )}
        {data.precipitation && (
          <li className="weather-detail-item">
            Precipitation <span>{data.precipitation}</span>
          </li>
        )}
      </ul>
    </article>
  )
}

function WeatherError({ sourceName, message }) {
  return (
    <article className="card" aria-label={`${sourceName}: data unavailable`}>
      <header>
        <h3 className="card-title">{sourceName}</h3>
      </header>
      <div className="alert alert-error" role="alert">
        <strong>Unable to load data.</strong>{' '}
        {message}
      </div>
    </article>
  )
}

export default function WeatherSection({ sources, loading, lastUpdated }) {
  const { openMeteo, nws } = sources
  const hasAnyData = openMeteo.data || nws.data
  const allError = openMeteo.status === 'error' && nws.status === 'error'

  return (
    <section aria-labelledby="weather-heading">
      <h2 className="section-heading" id="weather-heading">
        <span className="icon" aria-hidden="true">🌤️</span>
        Current Weather
      </h2>

      {/* Per-source status badges */}
      <div className="status-bar" aria-label="Weather data source statuses">
        <SourceBadge name="Open-Meteo" status={openMeteo.status} />
        <SourceBadge name="NOAA/NWS" status={nws.status} />
      </div>

      {loading && (
        <p aria-live="polite" aria-busy="true">
          <span className="loading-spinner" aria-hidden="true" />
          Loading weather data…
        </p>
      )}

      {!loading && allError && (
        <div className="alert alert-error" role="alert">
          Both weather sources failed to load. Check your connection and try refreshing.
        </div>
      )}

      {!loading && !hasAnyData && openMeteo.status === 'idle' && (
        <p className="alert alert-info">
          Weather data will appear here once your location is detected.
        </p>
      )}

      <div className="card-grid">
        {openMeteo.status === 'ok' && openMeteo.data && (
          <WeatherCard data={openMeteo.data} sourceKey="openMeteo" />
        )}
        {openMeteo.status === 'error' && (
          <WeatherError sourceName="Open-Meteo" message={openMeteo.error} />
        )}

        {nws.status === 'ok' && nws.data && (
          <WeatherCard data={nws.data} sourceKey="nws" />
        )}
        {nws.status === 'error' && (
          <WeatherError sourceName="NOAA/NWS" message={nws.error} />
        )}
      </div>

      {lastUpdated && (
        <p className="card-meta">
          Last updated:{' '}
          <time dateTime={lastUpdated.toISOString()}>
            {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </time>
        </p>
      )}
    </section>
  )
}
