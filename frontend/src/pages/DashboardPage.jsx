import { useCallback, useState } from "react";
import { dashboardApi } from "../api/endpoints.js";
import { useApiQuery } from "../hooks/useApi.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { FilterBar } from "../components/filters/FilterBar.jsx";
import { Modal } from "../components/ui/Modal.jsx";
import { Badge, Button, EmptyState, ErrorState, Spinner } from "../components/ui/index.jsx";
import { formatDate, formatNumber, formatQuantity } from "../utils/format.js";

const EMPTY_FILTERS = { dateFrom: "", dateTo: "", baseId: "", equipmentTypeId: "" };

function StatCard({ label, value, tone, meta, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag className={`stat-card${onClick ? " clickable" : ""}`} onClick={onClick} type={onClick ? "button" : undefined}>
      <div className="stat-label">{label}</div>
      <div className={`stat-value${tone ? ` ${tone}` : ""}`}>{value}</div>
      {meta ? <div className="stat-meta">{meta}</div> : null}
    </Tag>
  );
}

/**
 * Every figure on this screen comes from the API. Nothing is derived in the
 * browser, and nothing is stored as a manually editable total.
 */
export function DashboardPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [movementOpen, setMovementOpen] = useState(false);

  const params = {
    ...(filters.dateFrom ? { dateFrom: filters.dateFrom } : {}),
    ...(filters.dateTo ? { dateTo: filters.dateTo } : {}),
    ...(filters.baseId ? { baseId: filters.baseId } : {}),
    ...(filters.equipmentTypeId ? { equipmentTypeId: filters.equipmentTypeId } : {}),
  };

  const summaryLoader = useCallback(() => dashboardApi.summary(params), [
    filters.dateFrom, filters.dateTo, filters.baseId, filters.equipmentTypeId,
  ]);
  const movementLoader = useCallback(() => dashboardApi.movements(params), [
    filters.dateFrom, filters.dateTo, filters.baseId, filters.equipmentTypeId,
  ]);
  const filterLoader = useCallback(() => dashboardApi.filters(), []);

  const summary = useApiQuery(summaryLoader, [
    filters.dateFrom, filters.dateTo, filters.baseId, filters.equipmentTypeId,
  ]);
  const movements = useApiQuery(movementLoader, [
    filters.dateFrom, filters.dateTo, filters.baseId, filters.equipmentTypeId,
  ]);
  const filterOptions = useApiQuery(filterLoader, []);

  const data = summary.data;
  const netTone = data?.netMovement > 0 ? "positive" : data?.netMovement < 0 ? "negative" : "";

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>
            {user.base ? `${user.base.name} inventory position` : "All bases, consolidated position"}
          </p>
        </div>
        <Button variant="secondary" onClick={() => { summary.reload(); movements.reload(); }}>
          Refresh
        </Button>
      </div>

      <FilterBar
        filters={{
          ...filters,
          baseOptions: filterOptions.data?.bases,
          equipmentOptions: filterOptions.data?.equipmentTypes,
        }}
        onChange={setFilters}
        onReset={() => setFilters(EMPTY_FILTERS)}
        busy={summary.loading}
      />

      {summary.loading ? (
        <Spinner label="Calculating balances" />
      ) : summary.error ? (
        <ErrorState error={summary.error} onRetry={summary.reload} />
      ) : (
        <>
          <div className="stat-grid">
            <StatCard label="Opening balance" value={formatNumber(data.openingBalance)} />
            <StatCard label="Purchases" value={formatNumber(data.purchases)} tone="positive" />
            <StatCard label="Transfer in" value={formatNumber(data.transferIn)} tone="positive" />
            <StatCard label="Transfer out" value={formatNumber(data.transferOut)} tone="negative" />
            <StatCard
              label="Net movement"
              value={formatNumber(data.netMovement)}
              tone={netTone}
              meta="Click to see the breakdown"
              onClick={() => setMovementOpen(true)}
            />
            <StatCard label="Assigned" value={formatNumber(data.assigned)} />
            <StatCard label="Expended" value={formatNumber(data.expended)} tone="negative" />
            <StatCard
              label="Closing balance"
              value={formatQuantity(data.closingBalance)}
              meta={data.filteredByDate ? "Not shown for a date range" : "Stock on hand"}
            />
          </div>

          {data.note ? <div className="alert alert-info">{data.note}</div> : null}

          <div className="card">
            <div className="card-header">
              <h2>Movement by equipment type</h2>
              <span className="muted small">
                Closing = opening + purchases + transfer in − transfer out − expenditure
              </span>
            </div>

            {movements.loading ? (
              <Spinner label="Loading breakdown" />
            ) : movements.error ? (
              <ErrorState error={movements.error} onRetry={movements.reload} />
            ) : !movements.data || movements.data.length === 0 ? (
              <EmptyState
                title="No inventory for these filters"
                description="Try widening the date range or clearing the base filter."
              />
            ) : (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Equipment</th>
                      <th className="numeric">Opening</th>
                      <th className="numeric">Purchases</th>
                      <th className="numeric">Transfer in</th>
                      <th className="numeric">Transfer out</th>
                      <th className="numeric">Expended</th>
                      <th className="numeric">Net</th>
                      <th className="numeric">Closing</th>
                      <th className="numeric">Committed</th>
                      <th className="numeric">Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.data.map((row) => (
                      <tr key={row.equipmentType.id}>
                        <td>
                          <strong>{row.equipmentType.name}</strong>
                          <div className="faint small">{row.equipmentType.code}</div>
                        </td>
                        <td className="numeric">{formatNumber(row.openingBalance)}</td>
                        <td className="numeric">{formatNumber(row.purchases)}</td>
                        <td className="numeric">{formatNumber(row.transferIn)}</td>
                        <td className="numeric">{formatNumber(row.transferOut)}</td>
                        <td className="numeric">{formatNumber(row.expended)}</td>
                        <td className="numeric">
                          <span className={row.netMovement < 0 ? "muted" : ""}>
                            {row.netMovement > 0 ? "+" : ""}
                            {formatNumber(row.netMovement)}
                          </span>
                        </td>
                        <td className="numeric">
                          <strong>{formatNumber(row.closingBalance)}</strong>
                        </td>
                        <td className="numeric">{formatNumber(row.committedQuantity)}</td>
                        <td className="numeric">{formatNumber(row.available)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {movementOpen ? (
        <NetMovementModal params={params} filters={filters} onClose={() => setMovementOpen(false)} />
      ) : null}
    </>
  );
}

/**
 * Net Movement detail.
 *
 * A single net figure hides how it was reached, so this opens the individual
 * purchases and transfers behind it, loaded from the API rather than assembled
 * from what the dashboard already has.
 */
function NetMovementModal({ params, filters, onClose }) {
  const loader = useCallback(() => dashboardApi.netMovementDetails(params), [
    filters.dateFrom, filters.dateTo, filters.baseId, filters.equipmentTypeId,
  ]);
  const { data, loading, error } = useApiQuery(loader, []);

  return (
    <Modal title="Net movement detail" wide onClose={onClose}>
      {loading ? (
        <Spinner label="Loading movements" />
      ) : error ? (
        <ErrorState error={error} />
      ) : (
        <>
          <div className="alert alert-info">
            Net movement is{" "}
            <strong>
              {data.netMovement > 0 ? "+" : ""}
              {formatNumber(data.netMovement)}
            </strong>{" "}
            across {formatNumber(data.total)} movements.
          </div>

          {data.truncated ? (
            <div className="alert alert-warning">
              Only the most recent 200 movements are shown. Narrow the date range to see the rest.
            </div>
          ) : null}

          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Equipment</th>
                  <th className="numeric">Qty</th>
                  <th>Date</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, index) => (
                  <tr key={`${row.reference}-${index}`}>
                    <td>
                      <Badge tone={row.effect === "IN" ? "success" : "warning"}>
                        {row.movementType} {row.effect === "IN" ? "IN" : "OUT"}
                      </Badge>
                    </td>
                    <td>{row.equipmentType}</td>
                    <td className="numeric">{formatNumber(row.quantity)}</td>
                    <td>{formatDate(row.date)}</td>
                    <td>{row.sourceBase || "—"}</td>
                    <td>{row.destinationBase || "—"}</td>
                    <td className="mono">{row.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Modal>
  );
}
