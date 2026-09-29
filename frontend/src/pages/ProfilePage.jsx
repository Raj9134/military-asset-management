import { useState } from "react";
import { authApi } from "../api/endpoints.js";
import { useMutation } from "../hooks/useApi.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { Button, Field, Input } from "../components/ui/index.jsx";
import { fieldErrors, formatDateTime } from "../utils/format.js";
import { ROLE_LABELS } from "../constants/options.js";
import { initialsOf } from "../utils/permissions.js";

export function ProfilePage() {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [done, setDone] = useState(false);

  const { run, pending, error } = useMutation(authApi.changePassword);
  const errors = fieldErrors(error);

  const submit = async (event) => {
    event.preventDefault();
    setDone(false);
    try {
      await run({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      setDone(true);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      // Rendered inline.
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Profile</h1>
          <p>Your account details and password.</p>
        </div>
      </div>

      <div className="card mb-16">
        <div className="card-body">
          <div className="toolbar" style={{ gap: 16 }}>
            <div className="avatar lg">{initialsOf(user.name)}</div>
            <div>
              <h2>{user.name}</h2>
              <p className="muted small" style={{ margin: "2px 0 0" }}>{user.email}</p>
            </div>
          </div>

          <div className="detail-list mt-16">
            <div className="detail-item">
              <div className="label">Role</div>
              <div className="value">{ROLE_LABELS[user.role] || user.role}</div>
            </div>
            <div className="detail-item">
              <div className="label">Base</div>
              <div className="value">{user.base?.name || "All bases"}</div>
            </div>
            <div className="detail-item">
              <div className="label">Last sign in</div>
              <div className="value">{formatDateTime(user.lastLoginAt)}</div>
            </div>
            <div className="detail-item">
              <div className="label">Account created</div>
              <div className="value">{formatDateTime(user.createdAt)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Change password</h2>
        </div>
        <div className="card-body">
          <div className="alert alert-warning">
            Changing your password signs out every device, including this one. You will be returned to
            the login screen afterwards.
          </div>

          {error && !error.details ? <div className="alert alert-error">{error.message}</div> : null}
          {done ? <div className="alert alert-success">Password updated. Please sign in again.</div> : null}

          <form onSubmit={submit} noValidate>
            <div className="form-grid">
              <Field label="Current password" required error={errors.currentPassword} id="profile-current">
                <Input
                  id="profile-current"
                  type="password"
                  autoComplete="current-password"
                  value={form.currentPassword}
                  onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
                />
              </Field>

              <Field
                label="New password"
                required
                error={errors.newPassword}
                hint="At least 8 characters with upper, lower and a number"
                id="profile-new"
              >
                <Input
                  id="profile-new"
                  type="password"
                  autoComplete="new-password"
                  value={form.newPassword}
                  onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
                />
              </Field>

              <Field label="Confirm new password" required error={errors.confirmPassword} id="profile-confirm">
                <Input
                  id="profile-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                />
              </Field>
            </div>

            <div className="toolbar mt-16">
              <Button type="submit" variant="primary" pending={pending}>
                Update password
              </Button>
              <Button variant="ghost" onClick={logout}>Sign out now</Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
