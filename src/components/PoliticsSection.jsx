/**
 * PoliticsSection – displays news/politics headlines from Reddit.
 * Shared component used for local, American, and world politics categories.
 * Includes per-source status badges, accessible list markup, and error states.
 */

import SourceBadge from './SourceBadge.jsx'

function PoliticsItem({ item }) {
  const dateStr = item.time
    ? item.time.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  const ariaLabel = [
    item.title,
    item.source ? `from ${item.source}` : '',
    item.score != null ? `${item.score.toLocaleString()} upvotes` : '',
    dateStr ? `posted ${dateStr}` : '',
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
          {item.by && (
            <>
              {' · '}
              <span>u/{item.by}</span>
            </>
          )}
          {item.score != null && (
            <>
              {' · '}
              <span aria-label={`${item.score.toLocaleString()} upvotes`}>
                {item.score.toLocaleString()} pts
              </span>
            </>
          )}
          {item.numComments != null && item.commentUrl && (
            <>
              {' · '}
              <a
                href={item.commentUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${item.numComments} comments (opens in new tab)`}
              >
                {item.numComments} comments
              </a>
            </>
          )}
          {dateStr && (
            <>
              {' · '}
              <time dateTime={item.time?.toISOString()}>{dateStr}</time>
            </>
          )}
        </p>
      </article>
    </li>
  )
}

function PostList({ sourceKey, sourceData }) {
  if (sourceData.status === 'idle') return null

  return (
    <div>
      <h3 id={`politics-src-${sourceKey}`} className="news-source-heading">
        {sourceData.name}
      </h3>

      {sourceData.status === 'loading' && (
        <p>
          <span className="loading-spinner" aria-hidden="true" />
          Loading…
        </p>
      )}

      {sourceData.status === 'error' && (
        <div
          className="alert alert-error"
          role="alert"
          aria-label={`${sourceData.name}: failed to load`}
        >
          <strong>Failed to load.</strong> {sourceData.error}
        </div>
      )}

      {sourceData.status === 'ok' && (
        <ol aria-labelledby={`politics-src-${sourceKey}`} className="news-list">
          {sourceData.data?.map((item) => (
            <PoliticsItem key={item.id} item={item} />
          ))}
          {(!sourceData.data || sourceData.data.length === 0) && (
            <li>
              <p className="alert alert-info">No posts found.</p>
            </li>
          )}
        </ol>
      )}
    </div>
  )
}

export default function PoliticsSection({
  sources,
  loading,
  lastUpdated,
  headingId,
  title,
  icon,
  locationNote,
}) {
  const { primary, secondary } = sources
  const allError = primary.status === 'error' && secondary.status === 'error'

  return (
    <section aria-labelledby={headingId}>
      <h2 className="section-heading" id={headingId}>
        <span className="icon" aria-hidden="true">
          {icon}
        </span>
        {title}
      </h2>

      {locationNote && (
        <p className="location-note alert alert-info" role="note">
          <span aria-hidden="true">📍</span> {locationNote}
        </p>
      )}

      {/* Per-source loading/status badges */}
      <div className="status-bar" aria-label="Data source statuses">
        <SourceBadge name={primary.name || 'Primary'} status={primary.status} />
        <SourceBadge name={secondary.name || 'Secondary'} status={secondary.status} />
      </div>

      {loading && (
        <p aria-live="polite" aria-busy="true">
          <span className="loading-spinner" aria-hidden="true" />
          Loading news…
        </p>
      )}

      {!loading && allError && (
        <div className="alert alert-error" role="alert">
          Both news sources failed to load. Check your connection and try refreshing.
        </div>
      )}

      {!loading && primary.status === 'idle' && (
        <p className="alert alert-info">
          Headlines will appear here once loaded.
        </p>
      )}

      <div className="news-sources-container">
        <PostList sourceKey="primary" sourceData={primary} />
        <PostList sourceKey="secondary" sourceData={secondary} />
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
