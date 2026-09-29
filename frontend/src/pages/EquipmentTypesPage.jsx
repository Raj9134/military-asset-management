import { useCallback, useState } from "react";
import { equipmentTypesApi } from "../api/endpoints.js";
import { useApiQuery, useMutation } from "../hooks/useApi.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { can } from "../utils/permissions.js";
import { Modal } from "../components/ui/Modal.jsx";
import { Badge, Button, EmptyState, ErrorState, Field, Input, Select, Spinner } from "../components/ui/index.jsx";
import { fieldErrors } from "../utils/format.js";
import { EQUIPMENT_CATEGORIES } from "../constants/options.js";

export function EquipmentTypesPage() {
  const { user } = useAuth();
  const [includeInactive, setIncludeInactive] = useState("false");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);

  const mayWrite = can(user.role, "equipment:write");
  const loader = useCallback(
    () => equipmentTypesApi.list({ includeInactive, limit: 100 }),
    [includeInactive]
  );
  const list = useApiQuery(loader, [includeInactive]);
  const rows = list.data?.data || [];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Equipment types</h1>
          <p>The catalogue of what this system tracks.</p>
        </div>
        {mayWrite ? (
          <Button variant="primary" onClick={() => setCreating(true)}>Add type</Button>
        ) : null}
      </div>

      <div className="filter-bar">
        <Field label="Status" id="equipment-status">
          <Select id="equipment-status" value={includeInactive} onChange={(event) => setIncludeInactive(event.target.value)}>
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
          <EmptyState title="No equipment types" />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Tracking</th>
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
                      {row.description ? <div className="faint small">{row.description}</div> : null}
                    </td>
                    <td>{EQUIPMENT_CATEGORIES.find((c) => c.value === row.category)?.label || row.category}</td>
                    <td>{row.unitOfMeasure}</td>
                    <td>
                      <Badge tone={row.isTrackable ? "info" : "neutral"}>
                        {row.isTrackable ? "Serialised" : "Bulk"}
                      </Badge>
                    </td>
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

      <div className="alert alert-info mt-16">
        <strong>Serialised</strong> types get one asset record per physical item, with a serial number.
        <strong> Bulk</strong> types such as ammunition are held as quantity alone.
      </div>

      {creating ? (
        <EquipmentTypeForm
          item={null}
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); list.reload(); }}
        />
      ) : null}

      {editing ? (
        <EquipmentTypeForm
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); list.reload(); }}
        />
      ) : null}
    </>
  );
}

function EquipmentTypeForm({ item, onClose, onSaved }) {
  const isNew = !item;
  const [form, setForm] = useState({
    code: item?.code || "",
    name: item?.name || "",
    category: item?.category || "OTHER",
    unitOfMeasure: item?.unitOfMeasure || "unit",
    isTrackable: item?.isTrackable ?? false,
    description: item?.description || "",
    isActive: item ? item.isActive : true,
  });

  const { run, pending, error } = useMutation(
    isNew
      ? (payload) => equipmentTypesApi.create(payload)
      : (payload) => equipmentTypesApi.update(item.id, payload)
  );
  const errors = fieldErrors(error);

  const submit = async () => {
    try {
      await run(
        isNew
          ? { ...form, description: form.description || null }
          : {
              name: form.name,
              unitOfMeasure: form.unitOfMeasure,
              isTrackable: form.isTrackable,
              description: form.description || null,
              isActive: form.isActive,
            }
      );
      onSaved();
    } catch {
      // Rendered inline.
    }
  };

  return (
    <Modal
      title={isNew ? "Add equipment type" : `Manage ${item.name}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={pending}>Cancel</Button>
          <Button variant="primary" onClick={submit} pending={pending}>{isNew ? "Create" : "Save changes"}</Button>
        </>
      }
    >
      {error ? <div className="alert alert-error">{error.message}</div> : null}

      {!isNew ? (
        <div className="alert alert-info">
          Code and category are fixed once a type exists. Trackability can only be changed while the
          type has no movement history, because flipping it would change what the existing records mean.
        </div>
      ) : null}

      <div className="form-grid">
        <Field label="Code" required error={errors.code} hint={isNew ? "Uppercase, e.g. AMMO_556" : "Cannot be changed"} id="equip-code">
          <Input id="equip-code" value={form.code} disabled={!isNew} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} />
        </Field>

        <Field label="Name" required error={errors.name} id="equip-name">
          <Input id="equip-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </Field>

        <Field label="Category" required error={errors.category} hint={isNew ? undefined : "Cannot be changed"} id="equip-category">
          <Select id="equip-category" value={form.category} disabled={!isNew} onChange={(event) => setForm({ ...form, category: event.target.value })}>
            {EQUIPMENT_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </Select>
        </Field>

        <Field label="Unit of measure" required error={errors.unitOfMeasure} hint="rifle, round, vehicle" id="equip-unit">
          <Input id="equip-unit" value={form.unitOfMeasure} onChange={(event) => setForm({ ...form, unitOfMeasure: event.target.value })} />
        </Field>

        <div className="checkbox-field field full">
          <input
            id="equip-trackable"
            type="checkbox"
            checked={form.isTrackable}
            onChange={(event) => setForm({ ...form, isTrackable: event.target.checked })}
          />
          <label htmlFor="equip-trackable">Tracked individually (one asset record per physical item)</label>
        </div>

        <Field label="Description" full id="equip-description">
          <Input id="equip-description" value={form.description || ""} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </Field>

        {!isNew ? (
          <div className="checkbox-field field full">
            <input id="equip-active" type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
            <label htmlFor="equip-active">Type is active</label>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
