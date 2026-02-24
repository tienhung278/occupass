interface LoadingOverlayProps {
  label?: string
}

export function LoadingOverlay({ label = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="loading-overlay" role="status" aria-live="polite" aria-label={label}>
      <div className="loading-overlay-content">
        <span className="loading-spinner" aria-hidden="true" />
        <span>{label}</span>
      </div>
    </div>
  )
}
