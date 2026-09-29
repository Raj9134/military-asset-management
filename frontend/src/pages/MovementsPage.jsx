import { useCallback, useState } from "react";
import { assignmentsApi, expendituresApi, dashboardApi } from "../api/endpoints.js";
import { useApiQuery, useMutation } from "../hooks/useApi.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { can } from "../utils/permissions.js";
import { FilterBar } from "../components/filters/FilterBar.jsx";
import { Modal } from "../components/ui/Modal.jsx";
import { Badge, Button, EmptyState, ErrorState, Field, Input, Pagination, Select, Spinner } from "../components/ui/index.jsx";
import { fieldErrors, formatDate, formatNumber, toDateInput } from "../utils/format.js";
import { EXPENDITURE_REASONS } from "../constants/options.js";

const EMPTY = { dateFrom: "", dateTo: "", baseId: "", equipmentTypeId: "", status: "", reason: "", page: 1, limit: 20 };

export function MovementsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("assignments");
  const [filters, setFilters] = useState(EMPTY);
  const [issuing, setIssuing] = useState(false);
  const [expending, setExpending] = useState(false);
  const [returning, setReturning] = useState(null);

  const mayExpend = can(user.role, "expenditures:write");

  const params = {
    page: filters.page,
    limit: filters.limit,
    ...(filters.dateFrom ? { dateFrom: filters.dateFrom } : {}),
    ...(filters.dateTo ? { dateTo: filters.dateTo } : {}),
    ...(filters.baseId ? { baseId: filters.baseId } : {}),
    ...(filters.equipmentTypeId ? { equipmentTypeId: filters.equipmentTypeId } : {}),
  };

  const assignmentParams = { ...params, ...(filters.status ? { status: filters.status } : {}) };
  const expenditureParams = { ...params, ...(filters.reason ? { reason: filters.reason } : {}) };

  const assignmentLoader = useCallback(() => assignmentsApi.list(assignmentParams), [JSON.stringify(assignmentParams)]);
  const expenditureLoader = useCallback(() => expendituresApi.list(expenditureParams), [JSON.stringify(expenditureParams)]);
  const filterLoader = useCallback(() => dashboardApi.filters(), []);

  const assignments = useApiQuery(assignmentLoader, [JSON.stringify(assignmentParams)]);
  const expenditures = useApiQuery(expenditureLoader, [JSON.stringify(expenditureParams)]);
  const options = useApiQuery(filterLoader, []);

  const onFilterChange = (next) => setFilters({ ...next, page: 1 });
  const active = tab === "assignments" ? assignments : expenditures;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Assignments &amp; Expenditures</h1>
          <p>Equipment issued to personnel, and equipment written off.</p>
        </div>
        <div className="toolbar">
          <Button variant="primary" onClick={() => setIssuing(true)}>Issue equipment</Button>
          {mayExpend ? (
            <Button variant="secondary" onClick={() => setExpending(true)}>Record expenditure</Button>
          ) : null}
        </div>
      </div>

      <div className="toolbar mb-16">
        <Button variant={tab === "assignments" ? "primary" : "secondary"} onClick={() => setTab("assignments")}>
          Assignments
        </Button>
        <Button variant={tab === "expenditures" ? "primary" : "secondary"} onClick={() => setTab("expenditures")}>
          Expenditures
        </Button>
      </div>

      <FilterBar
        baseOptions={options.data?.bases}
        equipmentOptions={options.data?.equipmentTypes}
        filters={filters}
        onChange={onFilterChange}
        onReset={() => setFilters(EMPTY)}
        busy={active.loading}
      >
        {tab === "assignments" ? (
          <Field label="Status" id="movement-status">
            <Select id="movement-status" value={filters.status} onChange={(event) => onFilterChange({ ...filters, status: event.target.value })}>
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PARTIALLY_RETURNED">Partially returned</option>
              <option value="RETURNED">Returned</option>
            </Select>
          </Field>
        ) : (
          <Field label="Reason" id="movement-reason">
            <Select id="movement-reason" value={filters.reason} onChange={(event) => onFilterChange({ ...filters, reason: event.target.value })}>
              <option value="">All reasons</option>
              {EXPENDITURE_REASONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </Select>
          </Field>
        )}
      </FilterBar>

      <div className="card">
        {active.loading ? (
          <Spinner />
        ) : active.error ? (
          <ErrorState error={active.error} onRetry={active.reload} />
        ) : (active.data?.data || []).length === 0 ? (
          <EmptyState title={tab === "assignments" ? "No assignments" : "No expenditures"} />
        ) : (
          <>
            <div className="table-wrap">
              {tab === "assignments" ? (
                <table className="data">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Date</th>
                      <th>Base</th>
                      <th>Equipment</th>
                      <th>Personnel</th>
                      <th className="numeric">Issued</th>
                      <th className="numeric">Returned</th>
                      <th className="numeric">Outstanding</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {active.data.data.map((row) => {
                      const outstanding = row.quantity - row.returnedQuantity;
                      return (
                        <tr key={row.id}>
                          <td className="mono">{row.referenceNumber}</td>
                          <td>{formatDate(row.assignmentDate)}</td>
                          <td>{row.base?.name}</td>
                          <td>
                            {row.equipmentType?.name || row.asset?.assetNumber}
                            {row.asset?.serialNumber ? <div className="faint small">{row.asset.serialNumber}</div> : null}
                          </td>
                          <td>
                            {row.personnelName}
                            <div className="faint small">{row.personnelId || row.designation || ""}</div>
                          </td>
                          <td className="numeric">{formatNumber(row.quantity)}</td>
                          <td className="numeric">{formatNumber(row.returnedQuantity)}</td>
                          <td className="numeric">{formatNumber(outstanding)}</td>
                          <td><Badge>{row.status}</Badge></td>
                          <td className="right">
                            {outstanding > 0 ? (
                              <Button size="sm" variant="secondary" onClick={() => setReturning(row)}>
                                Record return
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <table className="data">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Date</th>
                      <th>Base</th>
                      <th>Equipment</th>
                      <th className="numeric">Quantity</th>
                      <th>Reason</th>
                      <th>From assignment</th>
                      <th>Recorded by</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {active.data.data.map((row) => (
                      <tr key={row.id} className={row.status === "REVERSED" ? "row-reversed" : ""}>
                        <td className="mono">{row.referenceNumber}</td>
                        <td>{formatDate(row.expenditureDate)}</td>
                        <td>{row.base?.name}</td>
                        <td>{row.equipmentType?.name}</td>
                        <td className="numeric">{formatNumber(row.quantity)}</td>
                        <td>{EXPENDITURE_REASONS.find((r) => r.value === row.reason)?.label || row.reason}</td>
                        <td className="mono">{row.assignment?.referenceNumber || "—"}</td>
                        <td>{row.recordedBy?.name || "—"}</td>
                        <td><Badge>{row.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <Pagination
              page={active.data.page}
              limit={active.data.limit}
              total={active.data.total}
              onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
            />
          </>
        )}
      </div>

      {issuing ? (
        <AssignmentForm
          options={options.data}
          user={user}
          onClose={() => setIssuing(false)}
          onSaved={() => { setIssuing(false); assignments.reload(); }}
        />
      ) : null}

      {expending ? (
        <ExpenditureForm
          options={options.data}
          user={user}
          onClose={() => setExpending(false)}
          onSaved={() => { setExpending(false); expenditures.reload(); }}
        />
      ) : null}

      {returning ? (
        <ReturnForm
          assignment={returning}
          onClose={() => setReturning(null)}
          onDone={() => { setReturning(null); assignments.reload(); }}
        />
      ) : null}
    </>
  );
}

function AssignmentForm({ options, user, onClose, onSaved }) {
  const [form, setForm] = useState({
    baseId: user.baseId || "",
    equipmentTypeId: "",
    quantity: "",
    personnelName: "",
    personnelId: "",
    designation: "",
    assignmentDate: toDateInput(new Date()),
    notes: "",
  });

  const { run, pending, error } = useMutation(assignmentsApi.create);
  const errors = fieldErrors(error);
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async () => {
    try {
      await run({
        baseId: Number(form.baseId),
        equipmentTypeId: Number(form.equipmentTypeId),
        quantity: Number(form.quantity),
        personnelName: form.personnelName,
        personnelId: form.personnelId || null,
        designation: form.designation || null,
        assignmentDate: form.assignmentDate,
        notes: form.notes || null,
      });
      onSaved();
    } catch {
      // Rendered inline.
    }
  };

  return (
    <Modal
      title="Issue equipment"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={pending}>Cancel</Button>
          <Button variant="primary" onClick={submit} pending={pending}>Issue</Button>
        </>
      }
    >
      {error && !error.details ? <div className="alert alert-error">{error.message}</div> : null}
      <div className="alert alert-info">
        Issuing equipment does not reduce stock on hand. It marks the units as committed, so they
        cannot be promised to somebody else until they are returned.
      </div>

      <div className="form-grid">
        <Field label="Base" required error={errors.baseId} id="assign-base">
          <Select id="assign-base" value={form.baseId} onChange={update("baseId")}>
            <option value="">Select</option>
            {(options?.bases || []).map((base) => <option key={base.id} value={base.id}>{base.name}</option>)}
          </Select>
        </Field>

        <Field label="Equipment type" required error={errors.equipmentTypeId} id="assign-equipment">
          <Select id="assign-equipment" value={form.equipmentTypeId} onChange={update("equipmentTypeId")}>
            <option value="">Select</option>
            {(options?.equipmentTypes || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </Select>
        </Field>

        <Field label="Quantity" required error={errors.quantity} id="assign-quantity">
          <Input id="assign-quantity" type="number" min="1" step="1" value={form.quantity} onChange={update("quantity")} />
        </Field>

        <Field label="Issue date" required error={errors.assignmentDate} id="assign-date">
          <Input id="assign-date" type="date" value={form.assignmentDate} onChange={update("assignmentDate")} />
        </Field>

        <Field label="Personnel name" required error={errors.personnelName} id="assign-person">
          <Input id="assign-person" value={form.personnelName} onChange={update("personnelName")} />
        </Field>

        <Field label="Service number" id="assign-service-id">
          <Input id="assign-service-id" value={form.personnelId} onChange={update("personnelId")} />
        </Field>

        <Field label="Designation" id="assign-designation">
          <Input id="assign-designation" value={form.designation} onChange={update("designation")} />
        </Field>

        <Field label="Notes" id="assign-notes">
          <Input id="assign-notes" value={form.notes} onChange={update("notes")} />
        </Field>
      </div>
    </Modal>
  );
}

function ExpenditureForm({ options, user, onClose, onSaved }) {
  const [form, setForm] = useState({
    baseId: user.baseId || "",
    equipmentTypeId: "",
    quantity: "",
    expenditureDate: toDateInput(new Date()),
    reason: "TRAINING",
    notes: "",
  });
  const [assignments, setAssignments] = useState([]);
  const [assignmentId, setAssignmentId] = useState("");

  const { run, pending, error } = useMutation(expendituresApi.create);
  const errors = fieldErrors(error);
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  // Open assignments for the chosen base. Linking one is what lets the server
  // clear committed stock at the same time as on-hand, so the same unit is not
  // counted as both missing and still-owed.
  const baseChanged = (event) => {
    update("baseId")(event);
    setAssignmentId("");
    setAssignments([]);
    if (!event.target.value) return;
    assignmentsApi
      .list({ baseId: event.target.value, status: "ACTIVE", limit: 100 })
      .then((result) => setAssignments(result.data))
      .catch(() => setAssignments([]));
  };

  const submit = async () => {
    try {
      await run({
        baseId: Number(form.baseId),
        equipmentTypeId: Number(form.equipmentTypeId),
        quantity: Number(form.quantity),
        expenditureDate: form.expenditureDate,
        reason: form.reason,
        assignmentId: assignmentId ? Number(assignmentId) : null,
        notes: form.notes || null,
      });
      onSaved();
    } catch {
      // Rendered inline.
    }
  };

  return (
    <Modal
      title="Record expenditure"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={pending}>Cancel</Button>
          <Button variant="primary" onClick={submit} pending={pending}>Record</Button>
        </>
      }
    >
      {error && !error.details ? <div className="alert alert-error">{error.message}</div> : null}

      <div className="form-grid">
        <Field label="Base" required error={errors.baseId} id="exp-base">
          <Select id="exp-base" value={form.baseId} onChange={baseChanged}>
            <option value="">Select</option>
            {(options?.bases || []).map((base) => <option key={base.id} value={base.id}>{base.name}</option>)}
          </Select>
        </Field>

        <Field label="Equipment type" required error={errors.equipmentTypeId} id="exp-equipment">
          <Select id="exp-equipment" value={form.equipmentTypeId} onChange={update("equipmentTypeId")}>
            <option value="">Select</option>
            {(options?.equipmentTypes || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </Select>
        </Field>

        <Field label="Quantity" required error={errors.quantity} id="exp-quantity">
          <Input id="exp-quantity" type="number" min="1" step="1" value={form.quantity} onChange={update("quantity")} />
        </Field>

        <Field label="Date" required error={errors.expenditureDate} id="exp-date">
          <Input id="exp-date" type="date" value={form.expenditureDate} onChange={update("expenditureDate")} />
        </Field>

        <Field label="Reason" required error={errors.reason} id="exp-reason">
          <Select id="exp-reason" value={form.reason} onChange={update("reason")}>
            {EXPENDITURE_REASONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </Select>
        </Field>

        <Field
          label="Consumed from assignment"
          hint="Optional, but linking it clears committed stock at the same time"
          id="exp-assignment"
        >
          <Select id="exp-assignment" value={assignmentId} onChange={(event) => setAssignmentId(event.target.value)}>
            <option value="">Not from an assignment</option>
            {assignments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.referenceNumber} · {item.personnelName} · {item.quantity - item.returnedQuantity} outstanding
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Notes" full id="exp-notes">
          <Input id="exp-notes" value={form.notes} onChange={update("notes")} />
        </Field>
      </div>
    </Modal>
  );
}

function ReturnForm({ assignment, onClose, onDone }) {
  const outstanding = assignment.quantity - assignment.returnedQuantity;
  const [quantity, setQuantity] = useState(String(outstanding));

  const { run, pending, error } = useMutation((payload) =>
    assignmentsApi.returnEquipment(assignment.id, payload)
  );
  const errors = fieldErrors(error);

  return (
    <Modal
      title={`Record return · ${assignment.referenceNumber}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={pending}>Cancel</Button>
          <Button variant="primary" pending={pending} onClick={async () => {
            try {
              await run({ returnedQuantity: Number(quantity) });
              onDone();
            } catch {
              // Rendered inline.
            }
          }}>
            Record return
          </Button>
        </>
      }
    >
      {error ? <div className="alert alert-error">{error.message}</div> : null}
      <div className="alert alert-info">
        {outstanding} unit(s) outstanding on this assignment. A partial return is recorded as such,
        and only the returned units are released back to available stock.
      </div>
      <Field
        label="Quantity returned"
        required
        error={errors.returnedQuantity}
        hint={`Maximum ${outstanding}`}
        id="return-quantity"
      >
        <Input
          id="return-quantity"
          type="number"
          min="1"
          max={outstanding}
          step="1"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
        />
      </Field>
    </Modal>
  );
}
