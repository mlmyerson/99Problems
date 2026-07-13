/**
 * NewsSection – displays news headlines from Hacker News and Wikipedia Current Events.
 * Includes semantic markup, accessible links, and status indicators.
 */

import SourceBadge from './SourceBadge.jsx'

function NewsItem({ item }) {
  const dateStr = item.time
    ? item.time.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  const ariaLabel = [
    item.title,
    item.source ? `Source: ${item.source}` : '',
    item.score != null ? `Score: ${item.score}` : '',
    dateStr ? `Published: ${dateStr}` : '',
  ]
    .filter(Boolean)
    .join('. ')

  return (
    <li>
      <article className="card" aria-label={ariaLabel}>
        <h3 className="card-title">
          <a
            href={item.url}
            className="news-link"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${item.title} (opens in new tab)`}
          >
            {item.title}
          </a>
        </h3>
        <p className="card-meta">
          <span>{item.source}</span>
          {item.by && item.by !== 'Wikipedia' && (
            <> · <span>by {item.by}</span></>
          )}
          {item.score != null && (
            <> · <span aria-label={`${item.score} points`}>{item.score} pts</span></>
          )}
          {dateStr && (
            <>
              {' · '}
              <time dateTime={item.time?.toISOString()}>{dateStr}</time>
            </>
          )}
          {item.commentUrl && item.source === 'Hacker News' && (
            <>
              {' · '}
              <a
                href={item.commentUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Discussion for: ${item.title} (opens in new tab)`}
                className="news-link"
              >
                Discuss
              </a>
            </>
          )}
        </p>
      </article>
    </li>
  )
}

function NewsError({ sourceName, message }) {
  return (
    <div className="alert alert-error" role="alert" aria-label={`${sourceName}: data unavailable`}>
      <strong>{sourceName} failed to load.</strong> {message}
    </div>
  )
}

function NewsList({ sourceKey, sourceData, heading }) {
  if (sourceData.status === 'idle' || sourceData.status === 'loading') return null

  return (
    <div>
      <h3 id={`news-heading-${sourceKey}`} className="card-subtitle" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)' }}>
        {heading}
      </h3>
      {sourceData.status === 'error' ? (
        <NewsError sourceName={heading} message={sourceData.error} />
      ) : (
        <ol
          aria-labelledby={`news-heading-${sourceKey}`}
          style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
        >
          {sourceData.data?.map((item) => (
            <NewsItem key={item.id} item={item} />
          ))}
        </ol>
      )}
    </div>
  )
}

export default function NewsSection({ sources, loading, lastUpdated }) {
  const { hackerNews, wikipedia } = sources
  const hasAnyData = hackerNews.data?.length || wikipedia.data?.length
  const allError = hackerNews.status === 'error' && wikipedia.status === 'error'

  return (
    <section aria-labelledby="news-heading">
      <h2 className="section-heading" id="news-heading">
        <span className="icon" aria-hidden="true">📰</span>
        Latest News
      </h2>

      {/* Per-source status badges */}
      <div className="status-bar" aria-label="News data source statuses">
        <SourceBadge name="Hacker News" status={hackerNews.status} />
        <SourceBadge name="Wikipedia Events" status={wikipedia.status} />
      </div>

      {loading && (
        <p aria-live="polite" aria-busy="true">
          <span className="loading-spinner" aria-hidden="true" />
          Loading news headlines…
        </p>
      )}

      {!loading && allError && (
        <div className="alert alert-error" role="alert">
          Both news sources failed to load. Check your connection and try refreshing.
        </div>
      )}

      {!loading && !hasAnyData && hackerNews.status === 'idle' && (
        <p className="alert alert-info">
          News headlines will appear here after loading.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <NewsList sourceKey="hackerNews" sourceData={hackerNews} heading="Hacker News — Top Stories" />
        <NewsList sourceKey="wikipedia" sourceData={wikipedia} heading="Wikipedia — Current Events" />
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
