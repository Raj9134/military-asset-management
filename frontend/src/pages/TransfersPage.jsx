import { useCallback, useState } from "react";
import { transfersApi, dashboardApi } from "../api/endpoints.js";
import { useApiQuery, useMutation } from "../hooks/useApi.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { FilterBar } from "../components/filters/FilterBar.jsx";
import { Modal } from "../components/ui/Modal.jsx";
import { Badge, Button, EmptyState, ErrorState, Field, Input, Pagination, Select, Spinner } from "../components/ui/index.jsx";
import { fieldErrors, formatDate, formatDateTime, formatNumber } from "../utils/format.js";
import { TRANSFER_STATUS_LABELS } from "../constants/options.js";

const EMPTY = { dateFrom: "", dateTo: "", baseId: "", equipmentTypeId: "", status: "", page: 1, limit: 20 };

const LIFECYCLE = ["PENDING", "APPROVED", "COMPLETED", "REJECTED", "CANCELLED"];

export function TransfersPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState(EMPTY);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [acting, setActing] = useState(null);

  const params = {
    page: filters.page,
    limit: filters.limit,
    ...(filters.dateFrom ? { dateFrom: filters.dateFrom } : {}),
    ...(filters.dateTo ? { dateTo: filters.dateTo } : {}),
    ...(filters.baseId ? { baseId: filters.baseId } : {}),
    ...(filters.equipmentTypeId ? { equipmentTypeId: filters.equipmentTypeId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  };

  const listLoader = useCallback(() => transfersApi.list(params), [JSON.stringify(params)]);
  const filterLoader = useCallback(() => dashboardApi.filters(), []);

  const list = useApiQuery(listLoader, [JSON.stringify(params)]);
  const options = useApiQuery(filterLoader, []);
  const rows = list.data?.data || [];

  const onFilterChange = (next) => setFilters({ ...next, page: 1 });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Transfers</h1>
          <p>Movement of equipment between bases. Stock moves only when a transfer is completed.</p>
        </div>
        <Button variant="primary" onClick={() => setCreating(true)}>
          Initiate transfer
        </Button>
      </div>

      <FilterBar
        baseOptions={options.data?.bases}
        equipmentOptions={options.data?.equipmentTypes}
        filters={filters}
        onChange={onFilterChange}
        onReset={() => setFilters(EMPTY)}
        busy={list.loading}
      >
        <Field label="Status" id="transfer-status">
          <Select
            id="transfer-status"
            value={filters.status}
            onChange={(event) => onFilterChange({ ...filters, status: event.target.value })}
          >
            <option value="">All statuses</option>
            {Object.entries(TRANSFER_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </Field>
      </FilterBar>

      <div className="card">
        {list.loading ? (
          <Spinner label="Loading transfers" />
        ) : list.error ? (
          <ErrorState error={list.error} onRetry={list.reload} />
        ) : rows.length === 0 ? (
          <EmptyState title="No transfers match these filters" />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Equipment</th>
                    <th className="numeric">Qty</th>
                    <th>Status</th>
                    <th>Raised</th>
                    <th>Initiated by</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className="mono">{row.referenceNumber}</td>
                      <td>{row.sourceBase?.name}</td>
                      <td>{row.destinationBase?.name}</td>
                      <td>{row.equipmentType?.name}</td>
                      <td className="numeric">{formatNumber(row.quantity)}</td>
                      <td><Badge>{row.status}</Badge></td>
                      <td>{formatDate(row.createdAt)}</td>
                      <td>{row.initiatedBy?.name}</td>
                      <td className="right">
                        <div className="toolbar" style={{ justifyContent: "flex-end" }}>
                          <Button size="sm" variant="ghost" onClick={() => setViewing(row)}>Details</Button>
                          {row.status === "PENDING" || row.status === "APPROVED" ? (
                            <Button size="sm" variant="secondary" onClick={() => setActing({ transfer: row, action: "decide" })}>
                              Action
                            </Button>
                          ) : null}
                        </div>
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

      {creating ? (
        <TransferForm
          options={options.data}
          user={user}
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); list.reload(); }}
        />
      ) : null}

      {viewing ? (
        <Modal title={`Transfer ${viewing.referenceNumber}`} onClose={() => setViewing(null)}>
          <Lifecycle status={viewing.status} transfer={viewing} />
          <div className="detail-list mt-16">
            <Item label="From" value={viewing.sourceBase?.name} />
            <Item label="To" value={viewing.destinationBase?.name} />
            <Item label="Equipment" value={viewing.equipmentType?.name} />
            <Item label="Quantity" value={formatNumber(viewing.quantity)} />
            <Item label="Initiated by" value={viewing.initiatedBy?.name} />
            <Item label="Approved by" value={viewing.approvedBy?.name} />
            <Item label="Raised" value={formatDateTime(viewing.createdAt)} />
            <Item label="Completed" value={formatDateTime(viewing.completedAt)} />
          </div>
          {viewing.decisionReason ? (
            <div className="alert alert-info mt-16">{viewing.decisionReason}</div>
          ) : null}
          {viewing.notes ? <p className="small muted mt-16">{viewing.notes}</p> : null}
        </Modal>
      ) : null}

      {acting ? (
        <TransferActionDialog
          transfer={acting.transfer}
          user={user}
          onClose={() => setActing(null)}
          onDone={() => { setActing(null); list.reload(); }}
        />
      ) : null}
    </>
  );
}

/** Visual progress through the lifecycle, so the current stage is obvious at a glance. */
function Lifecycle({ status, transfer }) {
  const index = LIFECYCLE.indexOf(status);
  const failed = status === "REJECTED" || status === "CANCELLED";

  return (
    <div className="timeline">
      {LIFECYCLE.map((stage, position) => {
        const done = !failed && position < index;
        const current = stage === status;
        return (
          <div className="timeline-step" key={stage}>
            <div className={`timeline-dot${done ? " done" : ""}${current ? " current" : ""}`}>
              {done ? "✓" : ""}
            </div>
            <div>
              <div className="timeline-label">{TRANSFER_STATUS_LABELS[stage]}</div>
              <div className="timeline-meta">
                {stage === "PENDING" && transfer?.createdAt ? `Raised ${formatDateTime(transfer.createdAt)}` : ""}
                {stage === "APPROVED" && transfer?.approvedBy ? `By ${transfer.approvedBy.name}` : ""}
                {stage === "COMPLETED" && transfer?.completedAt ? formatDateTime(transfer.completedAt) : ""}
              </div>
            </div>
          </div>
        );
      })}
    </div>
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

function TransferForm({ options, user, onClose, onSaved }) {
  const bases = options?.bases || [];
  const [form, setForm] = useState({
    sourceBaseId: user.baseId || "",
    destinationBaseId: "",
    equipmentTypeId: "",
    quantity: "",
    notes: "",
  });

  const { run, pending, error } = useMutation(transfersApi.create);
  const errors = fieldErrors(error);
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  // Surfaces the same rule the API enforces, so the mistake is obvious before a
  // round trip. The server still refuses it regardless of what the form allows.
  const sameBase = form.sourceBaseId && form.sourceBaseId === form.destinationBaseId;

  const submit = async (event) => {
    event.preventDefault();
    if (sameBase) return;
    try {
      await run({
        sourceBaseId: Number(form.sourceBaseId),
        destinationBaseId: Number(form.destinationBaseId),
        equipmentTypeId: Number(form.equipmentTypeId),
        quantity: Number(form.quantity),
        notes: form.notes || null,
      });
      onSaved();
    } catch {
      // Rendered from `error`.
    }
  };

  return (
    <Modal
      title="Initiate transfer"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={pending}>Cancel</Button>
          <Button variant="primary" onClick={submit} pending={pending} disabled={sameBase}>
            Initiate
          </Button>
        </>
      }
    >
      {error && !error.details ? <div className="alert alert-error">{error.message}</div> : null}

      <div className="form-grid">
        <Field label="From base" required error={errors.sourceBaseId} id="transfer-source">
          <Select id="transfer-source" value={form.sourceBaseId} onChange={update("sourceBaseId")} invalid={Boolean(errors.sourceBaseId)}>
            <option value="">Select</option>
            {bases.map((base) => (
              <option key={base.id} value={base.id}>{base.name}</option>
            ))}
          </Select>
        </Field>

        <Field label="To base" required error={errors.destinationBaseId} hint="Must differ from the source" id="transfer-dest">
          <Select id="transfer-dest" value={form.destinationBaseId} onChange={update("destinationBaseId")} invalid={Boolean(errors.destinationBaseId) || sameBase}>
            <option value="">Select</option>
            {bases.filter((base) => String(base.id) !== String(form.sourceBaseId)).map((base) => (
              <option key={base.id} value={base.id}>{base.name}</option>
            ))}
          </Select>
          {sameBase ? <span className="field-error">Source and destination must be different</span> : null}
        </Field>

        <Field label="Equipment type" required error={errors.equipmentTypeId} id="transfer-equipment">
          <Select id="transfer-equipment" value={form.equipmentTypeId} onChange={update("equipmentTypeId")} invalid={Boolean(errors.equipmentTypeId)}>
            <option value="">Select</option>
            {(options?.equipmentTypes || []).map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </Select>
        </Field>

        <Field label="Quantity" required error={errors.quantity} id="transfer-quantity">
          <Input id="transfer-quantity" type="number" min="1" step="1" value={form.quantity} onChange={update("quantity")} invalid={Boolean(errors.quantity)} />
        </Field>

        <Field label="Notes" full id="transfer-notes">
          <Input id="transfer-notes" value={form.notes} onChange={update("notes")} />
        </Field>
      </div>
    </Modal>
  );
}

/**
 * Approval, rejection, completion or cancellation.
 *
 * Which buttons appear is decided by the same rules the API applies, but the
 * server enforces each one independently: a hidden button is a courtesy, not a
 * control.
 */
function TransferActionDialog({ transfer, user, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const [action, setAction] = useState("approve");

  const isSourceBase = user.role === "ADMIN" || transfer.sourceBaseId === user.baseId;
  const isDestinationBase = user.role === "ADMIN" || transfer.destinationBaseId === user.baseId;
  const isInitiator = transfer.initiatedById === user.id;
  const isAdmin = user.role === "ADMIN";

  const actions = [];
  if (transfer.status === "PENDING") {
    if ((isAdmin || (isSourceBase && user.role === "BASE_COMMANDER")) && !isInitiator) {
      actions.push({ key: "approve", label: "Approve", variant: "primary" });
      actions.push({ key: "reject", label: "Reject", variant: "danger" });
    }
    if (isDestinationBase) actions.push({ key: "complete", label: "Complete receipt", variant: "primary" });
    if (isAdmin || isInitiator) actions.push({ key: "cancel", label: "Cancel", variant: "secondary" });
  }
  if (transfer.status === "APPROVED") {
    if (isDestinationBase) actions.push({ key: "complete", label: "Complete receipt", variant: "primary" });
    if (isAdmin || isInitiator) actions.push({ key: "cancel", label: "Cancel", variant: "secondary" });
  }

  const { run, pending, error } = useMutation(async (chosen) => {
    if (chosen === "approve") return transfersApi.approve(transfer.id, reason || null);
    if (chosen === "reject") return transfersApi.reject(transfer.id, reason);
    if (chosen === "complete") return transfersApi.complete(transfer.id, reason || null);
    return transfersApi.cancel(transfer.id);
  });

  if (actions.length === 0) {
    return (
      <Modal title="Transfer actions" onClose={onClose}>
        <div className="alert alert-info">
          There is no action available for your role on this transfer. A transfer must be approved by
          someone at the source base who did not raise it, and completed by the destination base.
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={`Transfer ${transfer.referenceNumber}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={pending}>Close</Button>
          <Button
            variant={actions.find((a) => a.key === action)?.variant || "primary"}
            pending={pending}
            onClick={async () => {
              try {
                await run(action);
                onDone();
              } catch {
                // Rendered inline.
              }
            }}
          >
            {actions.find((a) => a.key === action)?.label}
          </Button>
        </>
      }
    >
      {error ? <div className="alert alert-error">{error.message}</div> : null}

      <div className="detail-list mb-16">
        <Item label="From" value={transfer.sourceBase?.name} />
        <Item label="To" value={transfer.destinationBase?.name} />
        <Item label="Quantity" value={formatNumber(transfer.quantity)} />
        <Item label="Status" value={<Badge>{transfer.status}</Badge>} />
      </div>

      <div className="toolbar mb-16">
        {actions.map((item) => (
          <Button key={item.key} variant={action === item.key ? "primary" : "secondary"} onClick={() => setAction(item.key)}>
            {item.label}
          </Button>
        ))}
      </div>

      <Field
        label={action === "reject" ? "Reason for rejection" : "Notes"}
        required={action === "reject"}
        id="transfer-action-reason"
      >
        <Input id="transfer-action-reason" value={reason} onChange={(event) => setReason(event.target.value)} />
      </Field>
    </Modal>
  );
}
