export function Button({ children, variant = "secondary", size, type = "button", pending, className = "", ...rest }) {
  const classes = ["btn", `btn-${variant}`, size === "sm" ? "btn-sm" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} disabled={pending || rest.disabled} {...rest}>
      {pending ? <span className="spinner sm" /> : null}
      {children}
    </button>
  );
}

export function Field({ label, required, error, hint, full, children, id }) {
  return (
    <div className={`field${full ? " full" : ""}`}>
      {label ? (
        <label htmlFor={id}>
          {label} {required ? <span className="required">*</span> : null}
        </label>
      ) : null}
      {children}
      {hint && !error ? <span className="field-hint">{hint}</span> : null}
      {error ? <span className="field-error">{error}</span> : null}
    </div>
  );
}

export function Input({ invalid, ...rest }) {
  return <input className={invalid ? "invalid" : ""} {...rest} />;
}

export function Select({ invalid, children, ...rest }) {
  return (
    <select className={invalid ? "invalid" : ""} {...rest}>
      {children}
    </select>
  );
}

const BADGE_TONES = {
  COMPLETED: "success",
  APPROVED: "success",
  ACTIVE: "success",
  RETURNED: "info",
  PARTIALLY_RETURNED: "warning",
  PENDING: "warning",
  REJECTED: "danger",
  CANCELLED: "neutral",
  EXPIRED: "neutral",
  REVERSED: "danger",
};

export function Badge({ children, tone }) {
  const resolved = tone || BADGE_TONES[children] || "neutral";
  return <span className={`badge badge-${resolved}`}>{children}</span>;
}

export function Spinner({ label = "Loading" }) {
  return (
    <div className="loading-block" role="status" aria-live="polite">
      <span className="spinner" />
      <p className="muted small mt-16">{label}…</p>
    </div>
  );
}

export function EmptyState({ title = "Nothing to show", description, action, icon = "◦" }) {
  return (
    <div className="state">
      <span className="state-icon">{icon}</span>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="state">
      <span className="state-icon">⚠</span>
      <h3>Could not load this data</h3>
      <p>{error?.message || "An unexpected error occurred."}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function Pagination({ page, limit, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / (limit || 1)));
  const first = total === 0 ? 0 : (page - 1) * limit + 1;
  const last = Math.min(page * limit, total || 0);

  return (
    <div className="pagination">
      <span className="pagination-info">
        {total === 0 ? "No records" : `Showing ${first}–${last} of ${total}`}
      </span>
      <div className="pagination-controls">
        <Button size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          Previous
        </Button>
        <span className="small muted">
          Page {page} of {totalPages}
        </span>
        <Button size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          Next
        </Button>
      </div>
    </div>
  );
}
