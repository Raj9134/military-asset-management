import { useCallback, useState } from "react";
import { purchasesApi, dashboardApi } from "../api/endpoints.js";
import { useApiQuery, useMutation } from "../hooks/useApi.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { can } from "../utils/permissions.js";
import { FilterBar } from "../components/filters/FilterBar.jsx";
import { Modal, ConfirmDialog } from "../components/ui/Modal.jsx";
import { Badge, Button, EmptyState, ErrorState, Field, Input, Pagination, Select, Spinner } from "../components/ui/index.jsx";
import { fieldErrors, formatCurrency, formatDate, formatNumber, toDateInput } from "../utils/format.js";

const EMPTY = { dateFrom: "", dateTo: "", baseId: "", equipmentTypeId: "", status: "", page: 1, limit: 20 };

export function PurchasesPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState(EMPTY);
  const [creating, setCreating] = useState(false);
  const [reversing, setReversing] = useState(null);
  const [viewing, setViewing] = useState(null);

  const mayCreate = can(user.role, "purchases:write");
  const mayReverse = can(user.role, "purchases:reverse");

  const params = {
    page: filters.page,
    limit: filters.limit,
    ...(filters.dateFrom ? { dateFrom: filters.dateFrom } : {}),
    ...(filters.dateTo ? { dateTo: filters.dateTo } : {}),
    ...(filters.baseId ? { baseId: filters.baseId } : {}),
    ...(filters.equipmentTypeId ? { equipmentTypeId: filters.equipmentTypeId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  };

  const listLoader = useCallback(() => purchasesApi.list(params), [JSON.stringify(params)]);
  const filterLoader = useCallback(() => dashboardApi.filters(), []);

  const list = useApiQuery(listLoader, [JSON.stringify(params)]);
  const options = useApiQuery(filterLoader, []);

  const rows = list.data?.data || [];

  const onFilterChange = (next) => setFilters({ ...next, page: 1 });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Purchases</h1>
          <p>Recorded receipts that increase stock at a base.</p>
        </div>
        {mayCreate ? (
          <Button variant="primary" onClick={() => setCreating(true)}>
            Record purchase
          </Button>
        ) : null}
      </div>

      <FilterBar
        baseOptions={options.data?.bases}
        equipmentOptions={options.data?.equipmentTypes}
        filters={filters}
        onChange={onFilterChange}
        onReset={() => setFilters(EMPTY)}
        busy={list.loading}
      >
        <Field label="Status" id="purchase-status">
          <Select
            id="purchase-status"
            value={filters.status}
            onChange={(event) => onFilterChange({ ...filters, status: event.target.value })}
          >
            <option value="">Active and reversed</option>
            <option value="ACTIVE">Active only</option>
            <option value="REVERSED">Reversed only</option>
          </Select>
        </Field>
      </FilterBar>

      <div className="card">
        {list.loading ? (
          <Spinner label="Loading purchases" />
        ) : list.error ? (
          <ErrorState error={list.error} onRetry={list.reload} />
        ) : rows.length === 0 ? (
          <EmptyState title="No purchases match these filters" description="Adjust the filters or record a new purchase." />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Date</th>
                    <th>Base</th>
                    <th>Equipment</th>
                    <th className="numeric">Quantity</th>
                    <th className="numeric">Unit price</th>
                    <th>Supplier</th>
                    <th>Recorded by</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className={row.status === "REVERSED" ? "row-reversed" : ""}>
                      <td className="mono">{row.referenceNumber}</td>
                      <td>{formatDate(row.purchaseDate)}</td>
                      <td>{row.base?.name}</td>
                      <td>{row.equipmentType?.name}</td>
                      <td className="numeric">{formatNumber(row.quantity)}</td>
                      <td className="numeric">{row.unitPrice ? formatCurrency(Number(row.unitPrice)) : "—"}</td>
                      <td>{row.supplier || "—"}</td>
                      <td>{row.createdBy?.name || "—"}</td>
                      <td><Badge>{row.status}</Badge></td>
                      <td className="right">
                        <div className="toolbar" style={{ justifyContent: "flex-end" }}>
                          <Button size="sm" variant="ghost" onClick={() => setViewing(row)}>
                            View
                          </Button>
                          {mayReverse && row.status === "ACTIVE" ? (
                            <Button size="sm" variant="ghost" onClick={() => setReversing(row)}>
                              Reverse
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
        <PurchaseForm
          options={options.data}
          defaultBaseId={user.baseId || ""}
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); list.reload(); }}
        />
      ) : null}

      {viewing ? (
        <Modal title={`Purchase ${viewing.referenceNumber}`} onClose={() => setViewing(null)}>
          <div className="detail-list">
            <Detail label="Date" value={formatDate(viewing.purchaseDate)} />
            <Detail label="Base" value={viewing.base?.name} />
            <Detail label="Equipment" value={viewing.equipmentType?.name} />
            <Detail label="Quantity" value={`${formatNumber(viewing.quantity)} ${viewing.equipmentType?.unitOfMeasure || ""}`} />
            <Detail label="Unit price" value={viewing.unitPrice ? formatCurrency(Number(viewing.unitPrice)) : "—"} />
            <Detail label="Supplier" value={viewing.supplier} />
            <Detail label="Recorded by" value={viewing.createdBy?.name} />
            <Detail label="Status" value={<Badge>{viewing.status}</Badge>} />
          </div>
          {viewing.notes ? (
            <div className="mt-16">
              <div className="stat-label">Notes</div>
              <p className="small">{viewing.notes}</p>
            </div>
          ) : null}
        </Modal>
      ) : null}

      {reversing ? (
        <ReversePurchaseDialog
          purchase={reversing}
          onClose={() => setReversing(null)}
          onDone={() => { setReversing(null); list.reload(); }}
        />
      ) : null}
    </>
  );
}

function Detail({ label, value }) {
  return (
    <div className="detail-item">
      <div className="label">{label}</div>
      <div className="value">{value ?? "—"}</div>
    </div>
  );
}

function PurchaseForm({ options, defaultBaseId, onClose, onSaved }) {
  const [form, setForm] = useState({
    baseId: defaultBaseId,
    equipmentTypeId: "",
    quantity: "",
    purchaseDate: toDateInput(new Date()),
    supplier: "",
    unitPrice: "",
    notes: "",
  });

  const { run, pending, error, setError } = useMutation(purchasesApi.create);
  const errors = fieldErrors(error);
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    try {
      await run({
        baseId: Number(form.baseId),
        equipmentTypeId: Number(form.equipmentTypeId),
        quantity: Number(form.quantity),
        purchaseDate: form.purchaseDate,
        supplier: form.supplier || null,
        unitPrice: form.unitPrice ? Number(form.unitPrice) : null,
        notes: form.notes || null,
      });
      onSaved();
    } catch {
      // The message is rendered from `error` below.
    }
  };

  return (
    <Modal
      title="Record purchase"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={pending}>Cancel</Button>
          <Button variant="primary" onClick={submit} pending={pending}>Record purchase</Button>
        </>
      }
    >
      {error && !error.details ? <div className="alert alert-error">{error.message}</div> : null}

      <form onSubmit={submit} noValidate>
        <div className="form-grid">
          <Field label="Base" required error={errors.baseId} id="purchase-base">
            <Select id="purchase-base" value={form.baseId} onChange={update("baseId")} invalid={Boolean(errors.baseId)}>
              <option value="">Select a base</option>
              {(options?.bases || []).map((base) => (
                <option key={base.id} value={base.id}>{base.name}</option>
              ))}
            </Select>
          </Field>

          <Field label="Equipment type" required error={errors.equipmentTypeId} id="purchase-equipment">
            <Select
              id="purchase-equipment"
              value={form.equipmentTypeId}
              onChange={update("equipmentTypeId")}
              invalid={Boolean(errors.equipmentTypeId)}
            >
              <option value="">Select equipment</option>
              {(options?.equipmentTypes || []).map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </Select>
          </Field>

          <Field label="Quantity" required error={errors.quantity} id="purchase-quantity">
            <Input
              id="purchase-quantity"
              type="number"
              min="1"
              step="1"
              value={form.quantity}
              onChange={update("quantity")}
              invalid={Boolean(errors.quantity)}
            />
          </Field>

          <Field label="Purchase date" required error={errors.purchaseDate} id="purchase-date">
            <Input
              id="purchase-date"
              type="date"
              value={form.purchaseDate}
              onChange={update("purchaseDate")}
              invalid={Boolean(errors.purchaseDate)}
            />
          </Field>

          <Field label="Supplier" id="purchase-supplier">
            <Input id="purchase-supplier" value={form.supplier} onChange={update("supplier")} />
          </Field>

          <Field label="Unit price" hint="Optional" id="purchase-price">
            <Input id="purchase-price" type="number" min="0" step="0.01" value={form.unitPrice} onChange={update("unitPrice")} />
          </Field>

          <Field label="Notes" full id="purchase-notes">
            <Input id="purchase-notes" value={form.notes} onChange={update("notes")} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}

function ReversePurchaseDialog({ purchase, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const { run, pending, error } = useMutation((reasonText) => purchasesApi.reverse(purchase.id, reasonText));
  const errors = fieldErrors(error);

  return (
    <Modal
      title={`Reverse ${purchase.referenceNumber}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={pending}>Cancel</Button>
          <Button
            variant="danger"
            pending={pending}
            onClick={async () => {
              try {
                await run(reason);
                onDone();
              } catch {
                // Shown inline.
              }
            }}
          >
            Reverse purchase
          </Button>
        </>
      }
    >
      {error && !error.details ? <div className="alert alert-error">{error.message}</div> : null}
      <div className="alert alert-warning">
        The original record is kept and marked reversed. {formatNumber(purchase.quantity)} units will be
        returned to stock at {purchase.base?.name}. This cannot be undone.
      </div>
      <Field label="Reason" required error={errors.reason} id="reverse-reason">
        <Input id="reverse-reason" value={reason} onChange={(event) => setReason(event.target.value)} />
      </Field>
    </Modal>
  );
}
