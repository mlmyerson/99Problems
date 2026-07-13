/**
 * SourceBadge – displays per-source status as an accessible badge.
 * Uses data-status attribute for CSS styling (not color-only signaling).
 */
export default function SourceBadge({ name, status }) {
  const label =
    status === 'ok'
      ? `${name}: data loaded`
      : status === 'error'
      ? `${name}: error`
      : status === 'loading'
      ? `${name}: loading`
      : `${name}: not started`

  const text = status === 'ok' ? 'OK' : status === 'error' ? 'Error' : status === 'loading' ? 'Loading…' : 'Idle'

  return (
    <span
      className="source-status"
      data-status={status === 'idle' ? 'loading' : status}
      aria-label={label}
      role="status"
    >
      <span className="source-status-dot" aria-hidden="true" />
      <span>{name}</span>
      <span aria-hidden="true">·</span>
      <span>{text}</span>
    </span>
  )
}
