import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { Button, Field, Input } from "../components/ui/index.jsx";
import { fieldErrors } from "../utils/format.js";

// Fictional demo accounts from the seed script. Offering them on the login screen
// is a convenience for an assignment demo, not a production feature.
const DEMO_ACCOUNTS = [
  { email: "admin@mams.local", label: "Administrator", detail: "Full access to every base" },
  { email: "commander.alpha@mams.local", label: "Base Commander", detail: "Alpha Base only" },
  { email: "commander.bravo@mams.local", label: "Base Commander", detail: "Bravo Base only" },
  { email: "logistics.alpha@mams.local", label: "Logistics Officer", detail: "Purchases and transfers" },
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login({ email, password });
      navigate("/dashboard", { replace: true });
    } catch (caught) {
      // Invalid credentials land here. The backend returns one generic message
      // for both an unknown email and a wrong password, so nothing is revealed
      // about which accounts exist.
      setError(caught);
    } finally {
      setPending(false);
    }
  };

  const fieldError = fieldErrors(error);

  const fill = (accountEmail) => {
    setEmail(accountEmail);
    setPassword("Passw0rd@2026");
    setError(null);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Military Asset Management</h1>
        <p className="login-sub">Sign in to continue</p>

        {error && !error.details ? <div className="alert alert-error">{error.message}</div> : null}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field" style={{ marginBottom: 12 }}>
            <label htmlFor="email">Email</label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              invalid={Boolean(fieldError.email)}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            {fieldError.email ? <span className="field-error">{fieldError.email}</span> : null}
          </div>

          <div className="field" style={{ marginBottom: 18 }}>
            <label htmlFor="password">Password</label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              invalid={Boolean(fieldError.password)}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {fieldError.password ? <span className="field-error">{fieldError.password}</span> : null}
          </div>

          <Button type="submit" variant="primary" className="btn-block" pending={pending}>
            Sign in
          </Button>
        </form>

        <div className="login-demo">
          <h4>Demo accounts</h4>
          {DEMO_ACCOUNTS.map((account) => (
            <button
              type="button"
              key={account.email}
              className="demo-account"
              onClick={() => fill(account.email)}
            >
              <strong>{account.label}</strong>
              <span>{account.detail}</span>
            </button>
          ))}
          <p className="faint small" style={{ margin: "8px 0 0" }}>
            Shared password: <span className="mono">Passw0rd@2026</span>
          </p>
        </div>
      </div>
    </div>
  );
}
