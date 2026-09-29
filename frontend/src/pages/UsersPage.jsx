import { useCallback, useState } from "react";
import { usersApi, basesApi } from "../api/endpoints.js";
import { useApiQuery, useMutation } from "../hooks/useApi.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { Modal } from "../components/ui/Modal.jsx";
import { Badge, Button, EmptyState, ErrorState, Field, Input, Pagination, Select, Spinner } from "../components/ui/index.jsx";
import { fieldErrors, formatDateTime } from "../utils/format.js";
import { ROLE_LABELS } from "../constants/options.js";

const EMPTY = { role: "", baseId: "", includeInactive: "false", search: "", page: 1, limit: 20 };

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const [filters, setFilters] = useState(EMPTY);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);

  const params = {
    page: filters.page,
    limit: filters.limit,
    includeInactive: filters.includeInactive,
    ...(filters.role ? { role: filters.role } : {}),
    ...(filters.baseId ? { baseId: filters.baseId } : {}),
    ...(filters.search ? { search: filters.search } : {}),
  };

  const listLoader = useCallback(() => usersApi.list(params), [JSON.stringify(params)]);
  const baseLoader = useCallback(() => basesApi.list({ limit: 100 }), []);

  const list = useApiQuery(listLoader, [JSON.stringify(params)]);
  const bases = useApiQuery(baseLoader, []);
  const rows = list.data?.data || [];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p>Accounts, roles and base assignments.</p>
        </div>
        <Button variant="primary" onClick={() => setCreating(true)}>Add user</Button>
      </div>

      <div className="filter-bar">
        <Field label="Search" id="user-search">
          <Input id="user-search" value={filters.search} placeholder="Name or email" onChange={(event) => setFilters({ ...filters, search: event.target.value, page: 1 })} />
        </Field>
        <Field label="Role" id="user-role">
          <Select id="user-role" value={filters.role} onChange={(event) => setFilters({ ...filters, role: event.target.value, page: 1 })}>
            <option value="">All roles</option>
            {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
        </Field>
        <Field label="Base" id="user-base">
          <Select id="user-base" value={filters.baseId} onChange={(event) => setFilters({ ...filters, baseId: event.target.value, page: 1 })}>
            <option value="">All bases</option>
            {(bases.data?.data || []).map((base) => <option key={base.id} value={base.id}>{base.name}</option>)}
          </Select>
        </Field>
        <Field label="Status" id="user-status">
          <Select id="user-status" value={filters.includeInactive} onChange={(event) => setFilters({ ...filters, includeInactive: event.target.value, page: 1 })}>
            <option value="false">Active only</option>
            <option value="true">Include deactivated</option>
          </Select>
        </Field>
        <div className="filter-actions">
          <Button onClick={() => setFilters(EMPTY)}>Reset</Button>
        </div>
      </div>

      <div className="card">
        {list.loading ? (
          <Spinner />
        ) : list.error ? (
          <ErrorState error={list.error} onRetry={list.reload} />
        ) : rows.length === 0 ? (
          <EmptyState title="No users match these filters" />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Base</th>
                    <th>Status</th>
                    <th>Last sign in</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <strong>{row.name}</strong>
                        {row.id === currentUser.id ? <span className="faint small"> (you)</span> : null}
                      </td>
                      <td>{row.email}</td>
                      <td>{ROLE_LABELS[row.role]}</td>
                      <td>{row.base?.name || "All bases"}</td>
                      <td><Badge tone={row.isActive ? "success" : "neutral"}>{row.isActive ? "Active" : "Deactivated"}</Badge></td>
                      <td>{formatDateTime(row.lastLoginAt)}</td>
                      <td className="right">
                        <Button size="sm" variant="ghost" onClick={() => setEditing(row)}>Manage</Button>
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
        <UserForm
          bases={bases.data?.data || []}
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); list.reload(); }}
        />
      ) : null}

      {editing ? (
        <ManageUserDialog
          target={editing}
          currentUser={currentUser}
          bases={bases.data?.data || []}
          onClose={() => setEditing(null)}
          onDone={() => { setEditing(null); list.reload(); }}
        />
      ) : null}
    </>
  );
}

function UserForm({ bases, onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "LOGISTICS_OFFICER", baseId: "" });
  const { run, pending, error } = useMutation(usersApi.create);
  const errors = fieldErrors(error);
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async () => {
    try {
      await run({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        baseId: form.role === "ADMIN" ? null : Number(form.baseId),
      });
      onSaved();
    } catch {
      // Rendered inline.
    }
  };

  return (
    <Modal
      title="Add user"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={pending}>Cancel</Button>
          <Button variant="primary" onClick={submit} pending={pending}>Create account</Button>
        </>
      }
    >
      {error && !error.details ? <div className="alert alert-error">{error.message}</div> : null}
      <div className="form-grid">
        <Field label="Full name" required error={errors.name} id="new-user-name">
          <Input id="new-user-name" value={form.name} onChange={update("name")} />
        </Field>
        <Field label="Email" required error={errors.email} id="new-user-email">
          <Input id="new-user-email" type="email" value={form.email} onChange={update("email")} />
        </Field>
        <Field label="Initial password" required error={errors.password} hint="At least 8 characters with upper, lower and a number" id="new-user-password">
          <Input id="new-user-password" type="password" value={form.password} onChange={update("password")} />
        </Field>
        <Field label="Role" required error={errors.role} id="new-user-role">
          <Select id="new-user-role" value={form.role} onChange={update("role")}>
            {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
        </Field>
        {form.role !== "ADMIN" ? (
          <Field label="Base" required error={errors.baseId} id="new-user-base">
            <Select id="new-user-base" value={form.baseId} onChange={update("baseId")}>
              <option value="">Select</option>
              {bases.map((base) => <option key={base.id} value={base.id}>{base.name}</option>)}
            </Select>
          </Field>
        ) : null}
      </div>
    </Modal>
  );
}

/**
 * Administrative changes to an account.
 *
 * A role change is separated from the rest because it requires the acting
 * admin to re-enter their own password. Without that, a stolen admin session
 * could quietly promote an attacker and the audit trail would look routine.
 */
function ManageUserDialog({ target, currentUser, bases, onClose, onDone }) {
  const [form, setForm] = useState({
    name: target.name,
    email: target.email,
    role: target.role,
    baseId: target.baseId || "",
    isActive: target.isActive,
    currentPassword: "",
  });

  const { run, pending, error } = useMutation((payload) => usersApi.update(target.id, payload));
  const errors = fieldErrors(error);

  const roleChanging = form.role !== target.role;
  const isSelf = target.id === currentUser.id;

  const submit = async () => {
    try {
      await run({
        name: form.name,
        email: form.email,
        role: form.role,
        baseId: form.role === "ADMIN" ? null : Number(form.baseId),
        isActive: form.isActive,
        ...(roleChanging ? { currentPassword: form.currentPassword } : {}),
      });
      onDone();
    } catch {
      // Rendered inline.
    }
  };

  return (
    <Modal
      title={`Manage ${target.name}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={pending}>Cancel</Button>
          <Button variant="primary" onClick={submit} pending={pending}>Save changes</Button>
        </>
      }
    >
      {error ? <div className="alert alert-error">{error.message}</div> : null}

      {isSelf ? <div className="alert alert-info">This is your own account. You cannot change your own role or deactivate yourself.</div> : null}

      <div className="form-grid">
        <Field label="Full name" required error={errors.name} id="edit-user-name">
          <Input id="edit-user-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </Field>
        <Field label="Email" required error={errors.email} id="edit-user-email">
          <Input id="edit-user-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </Field>
        <Field
          label="Role"
          required
          error={errors.role}
          hint={isSelf ? "Locked for your own account" : "Changing this requires your password"}
          id="edit-user-role"
        >
          <Select
            id="edit-user-role"
            value={form.role}
            disabled={isSelf}
            onChange={(event) => setForm({ ...form, role: event.target.value })}
          >
            {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
        </Field>
        {form.role !== "ADMIN" ? (
          <Field label="Base" required error={errors.baseId} id="edit-user-base">
            <Select id="edit-user-base" value={form.baseId} onChange={(event) => setForm({ ...form, baseId: event.target.value })}>
              <option value="">Select</option>
              {bases.map((base) => <option key={base.id} value={base.id}>{base.name}</option>)}
            </Select>
          </Field>
        ) : null}

        {roleChanging && !isSelf ? (
          <Field label="Your password" required error={errors.currentPassword} hint="Confirm it is you making this change" id="edit-user-confirm" full>
            <Input
              id="edit-user-confirm"
              type="password"
              value={form.currentPassword}
              onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
            />
          </Field>
        ) : null}

        {!isSelf ? (
          <div className="checkbox-field field full">
            <input
              id="edit-user-active"
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
            />
            <label htmlFor="edit-user-active">Account is active</label>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
