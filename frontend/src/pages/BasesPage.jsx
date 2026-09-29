import { useCallback, useState } from "react";
import { basesApi } from "../api/endpoints.js";
import { useApiQuery, useMutation } from "../hooks/useApi.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { can } from "../utils/permissions.js";
import { Modal } from "../components/ui/Modal.jsx";
import { Badge, Button, EmptyState, ErrorState, Field, Input, Select, Spinner } from "../components/ui/index.jsx";
import { fieldErrors } from "../utils/format.js";

export function BasesPage() {
  const { user } = useAuth();
  const [includeInactive, setIncludeInactive] = useState("false");
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const mayWrite = can(user.role, "bases:write");
  const loader = useCallback(() => basesApi.list({ includeInactive, limit: 100 }), [includeInactive]);
  const list = useApiQuery(loader, [includeInactive]);
  const rows = list.data?.data || [];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Bases</h1>
          <p>Locations that hold equipment. Bases are retired, never deleted.</p>
        </div>
        {mayWrite ? (
          <Button variant="primary" onClick={() => setCreating(true)}>Add base</Button>
        ) : null}
      </div>

      <div className="filter-bar">
        <Field label="Status" id="base-status">
          <Select id="base-status" value={includeInactive} onChange={(event) => setIncludeInactive(event.target.value)}>
            <option value="false">Active only</option>
            <option value="true">Include inactive</option>
          </Select>
        </Field>
      </div>

      <div className="card">
        {list.loading ? (
          <Spinner />
        ) : list.error ? (
          <ErrorState error={list.error} onRetry={list.reload} />
        ) : rows.length === 0 ? (
          <EmptyState title="No bases" />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Description</th>
                  <th>Status</th>
                  {mayWrite ? <th /> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="mono">{row.code}</td>
                    <td>
                      <strong>{row.name}</strong>
                      {row.isOwnBase ? <span className="faint small"> (your base)</span> : null}
                    </td>
                    <td>{row.location || "—"}</td>
                    <td className="small">{row.description || "—"}</td>
                    <td><Badge tone={row.isActive ? "success" : "neutral"}>{row.isActive ? "Active" : "Inactive"}</Badge></td>
                    {mayWrite ? (
                      <td className="right">
                        <Button size="sm" variant="ghost" onClick={() => setEditing(row)}>Manage</Button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {creating ? (
        <BaseForm
          base={null}
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); list.reload(); }}
        />
      ) : null}

      {editing ? (
        <BaseForm
          base={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); list.reload(); }}
        />
      ) : null}
    </>
  );
}

function BaseForm({ base, onClose, onSaved }) {
  const isNew = !base;
  const [form, setForm] = useState({
    code: base?.code || "",
    name: base?.name || "",
    location: base?.location || "",
    description: base?.description || "",
    isActive: base ? base.isActive : true,
  });

  const { run, pending, error } = useMutation(
    isNew ? (payload) => basesApi.create(payload) : (payload) => basesApi.update(base.id, payload)
  );
  const errors = fieldErrors(error);

  const submit = async () => {
    try {
      await run(isNew ? { ...form } : {
        name: form.name,
        location: form.location || null,
        description: form.description || null,
        isActive: form.isActive,
      });
      onSaved();
    } catch {
      // Rendered inline.
    }
  };

  return (
    <Modal
      title={isNew ? "Add base" : `Manage ${base.name}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={pending}>Cancel</Button>
          <Button variant="primary" onClick={submit} pending={pending}>{isNew ? "Create base" : "Save changes"}</Button>
        </>
      }
    >
      {error ? <div className="alert alert-error">{error.message}</div> : null}
      {!isNew ? (
        <div className="alert alert-info">
          A base is never deleted, because inventory, movements and user accounts all refer to it.
          Deactivating it hides it from selection lists while keeping every historical record readable.
        </div>
      ) : null}

      <div className="form-grid">
        <Field label="Code" required error={errors.code} hint={isNew ? "Short identifier used in reports" : "Cannot be changed"} id="base-code">
          <Input id="base-code" value={form.code} disabled={!isNew} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} />
        </Field>
        <Field label="Name" required error={errors.name} id="base-name">
          <Input id="base-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </Field>
        <Field label="Location" error={errors.location} id="base-location">
          <Input id="base-location" value={form.location || ""} onChange={(event) => setForm({ ...form, location: event.target.value })} />
        </Field>
        <Field label="Description" full id="base-description">
          <Input id="base-description" value={form.description || ""} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </Field>
        {!isNew ? (
          <div className="checkbox-field field full">
            <input id="base-active" type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
            <label htmlFor="base-active">Base is active</label>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
