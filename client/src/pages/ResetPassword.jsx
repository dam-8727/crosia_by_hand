import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import './Auth.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const invalidLink = !token || !email;

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      await api.resetPassword({ email, token, password });
      navigate('/login', { state: { resetDone: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (invalidLink) {
    return (
      <div className="auth-card">
        <h1>Reset password</h1>
        <p className="form-error">This reset link is invalid or incomplete.</p>
        <p className="auth-switch">
          <Link to="/forgot-password">Request a new link</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <h1>Reset password</h1>
      <p className="sub">Set a new password for {email}</p>
      <form onSubmit={onSubmit}>
        {error && <p className="form-error">{error}</p>}
        <div className="form-group">
          <label htmlFor="password">New password (min 6)</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirm">Confirm password</label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={6}
            required
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Updating…' : 'Update password'}
        </button>
      </form>
      <p className="auth-switch">
        <Link to="/login">Back to log in</Link>
      </p>
    </div>
  );
}
