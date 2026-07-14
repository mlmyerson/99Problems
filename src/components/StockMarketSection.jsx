/**
 * StockMarketSection – displays market index quotes and discussion.
 *
 * Data sources:
 *   1. Yahoo Finance unofficial API – live price quotes for key ETFs (may be CORS-blocked)
 *   2. Reddit r/stocks – market discussion as fallback / supplemental content
 *
 * Shows a clear informational notice when live price data cannot be retrieved,
 * with a direct link to Yahoo Finance. Change direction is indicated both by
 * color and symbol (▲/▼) to meet color-only contrast requirements.
 */

import SourceBadge from './SourceBadge.jsx'

function QuoteCard({ quote }) {
  const changeSign = (quote.change ?? 0) >= 0 ? '+' : ''
  const isPositive = (quote.change ?? 0) >= 0
  const ariaLabel = [
    `${quote.name} (${quote.symbol})`,
    quote.price != null ? `price $${quote.price.toFixed(2)}` : 'price unavailable',
    quote.change != null
      ? `change ${changeSign}${quote.change.toFixed(2)} (${changeSign}${quote.changePercent?.toFixed(2)}%)`
      : '',
    quote.marketState && quote.marketState !== 'REGULAR'
      ? `${quote.marketState.toLowerCase()} hours`
      : '',
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <article className="card quote-card" aria-label={ariaLabel}>
      <h3 className="card-title quote-symbol">{quote.symbol}</h3>
      <p className="quote-name">{quote.name}</p>
      <p
        className="quote-price"
        aria-label={quote.price != null ? `Price: $${quote.price.toFixed(2)}` : 'Price unavailable'}
      >
        {quote.price != null ? `$${quote.price.toFixed(2)}` : '—'}
      </p>
      {quote.change != null && (
        <p
          className={`quote-change ${isPositive ? 'change-positive' : 'change-negative'}`}
          aria-label={`${isPositive ? 'Up' : 'Down'} ${Math.abs(quote.change).toFixed(2)} (${changeSign}${quote.changePercent?.toFixed(2)}%)`}
        >
          {/* Direction indicator — both text symbol AND color, never color alone */}
          <span aria-hidden="true">{isPositive ? '▲' : '▼'}</span>{' '}
          {changeSign}
          {Math.abs(quote.change).toFixed(2)} ({changeSign}
          {quote.changePercent?.toFixed(2)}%)
        </p>
      )}
      {quote.marketState && quote.marketState !== 'REGULAR' && (
        <p className="card-meta">
          {quote.marketState.charAt(0) + quote.marketState.slice(1).toLowerCase()} hours
        </p>
      )}
    </article>
  )
}

function DiscussionItem({ item }) {
  return (
    <li>
      <article className="card">
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
          {item.score != null && (
            <span aria-label={`${item.score.toLocaleString()} upvotes`}>
              {item.score.toLocaleString()} pts
            </span>
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
        </p>
      </article>
    </li>
  )
}

export default function StockMarketSection({ sources, loading, lastUpdated }) {
  const { quotes, discussion } = sources

  return (
    <section aria-labelledby="stocks-heading">
      <h2 className="section-heading" id="stocks-heading">
        <span className="icon" aria-hidden="true">📈</span>
        Stock Market
      </h2>

      {/* Per-source status badges */}
      <div className="status-bar" aria-label="Data source statuses">
        <SourceBadge name="Yahoo Finance" status={quotes.status} />
        <SourceBadge name="r/stocks" status={discussion.status} />
      </div>

      {loading && (
        <p aria-live="polite" aria-busy="true">
          <span className="loading-spinner" aria-hidden="true" />
          Loading market data…
        </p>
      )}

      {/* Live price quotes */}
      {!loading && quotes.status === 'ok' && quotes.data && quotes.data.length > 0 && (
        <div>
          <h3 className="news-source-heading">Key Indices &amp; ETFs</h3>
          <div className="card-grid">
            {quotes.data.map((q) => (
              <QuoteCard key={q.symbol} quote={q} />
            ))}
          </div>
          <p className="card-meta market-note">
            Data from{' '}
            <a href="https://finance.yahoo.com" target="_blank" rel="noopener noreferrer">
              Yahoo Finance
            </a>
            . Prices may be delayed up to 15 minutes.
          </p>
        </div>
      )}

      {!loading && quotes.status === 'error' && (
        <div className="alert alert-info" role="note">
          <strong>Live price data unavailable.</strong>{' '}
          Yahoo Finance may be blocking browser requests (CORS restriction).{' '}
          <a href="https://finance.yahoo.com" target="_blank" rel="noopener noreferrer">
            View live prices on Yahoo Finance ↗
          </a>
        </div>
      )}

      {/* Reddit market discussion */}
      {!loading && discussion.status === 'ok' && discussion.data && discussion.data.length > 0 && (
        <div>
          <h3 className="news-source-heading">Market Discussion (r/stocks)</h3>
          <ol className="news-list" aria-label="Market discussion posts from Reddit">
            {discussion.data.map((item) => (
              <DiscussionItem key={item.id} item={item} />
            ))}
          </ol>
        </div>
      )}

      {!loading && discussion.status === 'error' && (
        <div className="alert alert-error" role="alert">
          <strong>r/stocks failed to load.</strong> {discussion.error}
        </div>
      )}

      {!loading && quotes.status === 'idle' && discussion.status === 'idle' && (
        <p className="alert alert-info">Market data will appear here once loaded.</p>
      )}

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
