import { useCallback, useState } from "react";
import { auditLogsApi } from "../api/endpoints.js";
import { useApiQuery } from "../hooks/useApi.js";
import { Badge, Button, EmptyState, ErrorState, Field, Input, Pagination, Select, Spinner } from "../components/ui/index.jsx";
import { Modal } from "../components/ui/Modal.jsx";
import { formatDateTime } from "../utils/format.js";

const EMPTY = { dateFrom: "", dateTo: "", action: "", entityType: "", page: 1, limit: 25 };

const ACTION_TONES = {
  LOGIN: "success",
  LOGIN_FAILED: "danger",
  LOGOUT: "neutral",
  REGISTER: "info",
  USER_CREATED: "info",
  USER_UPDATED: "info",
  USER_DEACTIVATED: "danger",
  BASE_CREATED: "info",
  BASE_UPDATED: "neutral",
  EQUIPMENT_CREATED: "info",
  EQUIPMENT_UPDATED: "neutral",
  PURCHASE_CREATED: "success",
  PURCHASE_REVERSED: "danger",
  TRANSFER_CREATED: "info",
  TRANSFER_APPROVED: "success",
  TRANSFER_REJECTED: "danger",
  TRANSFER_CANCELLED: "neutral",
  TRANSFER_COMPLETED: "success",
  ASSIGNMENT_CREATED: "info",
  ASSIGNMENT_RETURNED: "neutral",
  EXPENDITURE_CREATED: "danger",
  EXPENDITURE_REVERSED: "neutral",
};

export function AuditLogsPage() {
  const [filters, setFilters] = useState(EMPTY);
  const [viewing, setViewing] = useState(null);

  const params = {
    page: filters.page,
    limit: filters.limit,
    ...(filters.dateFrom ? { dateFrom: filters.dateFrom } : {}),
    ...(filters.dateTo ? { dateTo: filters.dateTo } : {}),
    ...(filters.action ? { action: filters.action } : {}),
    ...(filters.entityType ? { entityType: filters.entityType } : {}),
  };

  const listLoader = useCallback(() => auditLogsApi.list(params), [JSON.stringify(params)]);
  const optionsLoader = useCallback(() => auditLogsApi.filterOptions(), []);

  const list = useApiQuery(listLoader, [JSON.stringify(params)]);
  const options = useApiQuery(optionsLoader, []);
  const rows = list.data?.data || [];

  const onFilterChange = (next) => setFilters({ ...next, page: 1 });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Audit log</h1>
          <p>Every significant action, with who did it, from where, and when.</p>
        </div>
        <Button variant="secondary" onClick={list.reload}>Refresh</Button>
      </div>

      <div className="filter-bar">
        <Field label="From" id="audit-from">
          <Input id="audit-from" type="date" value={filters.dateFrom} onChange={(event) => onFilterChange({ ...filters, dateFrom: event.target.value })} />
        </Field>
        <Field label="To" id="audit-to">
          <Input id="audit-to" type="date" value={filters.dateTo} onChange={(event) => onFilterChange({ ...filters, dateTo: event.target.value })} />
        </Field>
        <Field label="Action" id="audit-action">
          <Select id="audit-action" value={filters.action} onChange={(event) => onFilterChange({ ...filters, action: event.target.value })}>
            <option value="">All actions</option>
            {(options.data?.actions || []).map((action) => (
              <option key={action} value={action}>{action.replace(/_/g, " ")}</option>
            ))}
          </Select>
        </Field>
        <Field label="Record type" id="audit-entity">
          <Select id="audit-entity" value={filters.entityType} onChange={(event) => onFilterChange({ ...filters, entityType: event.target.value })}>
            <option value="">All types</option>
            {(options.data?.entityTypes || []).map((type) => <option key={type} value={type}>{type}</option>)}
          </Select>
        </Field>
        <div className="filter-actions">
          <Button onClick={() => setFilters(EMPTY)}>Reset</Button>
        </div>
      </div>

      <div className="card">
        {list.loading ? (
          <Spinner label="Loading audit entries" />
        ) : list.error ? (
          <ErrorState error={list.error} onRetry={list.reload} />
        ) : rows.length === 0 ? (
          <EmptyState title="No audit entries match these filters" />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Action</th>
                    <th>User</th>
                    <th>Record</th>
                    <th>Request</th>
                    <th>IP</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td style={{ whiteSpace: "nowrap" }}>{formatDateTime(row.createdAt)}</td>
                      <td><Badge tone={ACTION_TONES[row.action]}>{row.action.replace(/_/g, " ")}</Badge></td>
                      <td>{row.userEmail || "—"}</td>
                      <td>
                        {row.entityType}
                        {row.entityId ? <span className="faint"> #{row.entityId}</span> : null}
                      </td>
                      <td className="mono small">{row.method} {row.endpoint}</td>
                      <td className="mono small">{row.ipAddress || "—"}</td>
                      <td className="right">
                        <Button size="sm" variant="ghost" onClick={() => setViewing(row)}>Details</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={list.data.page}
              limit={list.data.limit}
              total={list.data.total}
              onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
            />
          </>
        )}
      </div>

      {viewing ? (
        <Modal title="Audit entry" onClose={() => setViewing(null)}>
          <div className="detail-list">
            <Item label="Action" value={<Badge tone={ACTION_TONES[viewing.action]}>{viewing.action.replace(/_/g, " ")}</Badge>} />
            <Item label="When" value={formatDateTime(viewing.createdAt)} />
            <Item label="User" value={viewing.userEmail || "System"} />
            <Item label="Record" value={`${viewing.entityType}${viewing.entityId ? ` #${viewing.entityId}` : ""}`} />
            <Item label="Method" value={viewing.method} />
            <Item label="Endpoint" value={<span className="mono">{viewing.endpoint}</span>} />
            <Item label="IP address" value={viewing.ipAddress} />
            <Item label="Request id" value={<span className="mono">{viewing.requestId}</span>} />
          </div>
          {viewing.metadata ? (
            <div className="mt-16">
              <div className="stat-label">Metadata</div>
              <pre className="mono" style={{ background: "var(--surface-alt)", padding: 12, borderRadius: 4, overflowX: "auto" }}>
                {JSON.stringify(viewing.metadata, null, 2)}
              </pre>
            </div>
          ) : null}
        </Modal>
      ) : null}
    </>
  );
}

function Item({ label, value }) {
  return (
    <div className="detail-item">
      <div className="label">{label}</div>
      <div className="value">{value ?? "—"}</div>
    </div>
  );
}
