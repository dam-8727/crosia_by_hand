import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resetLink, setResetLink] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setResetLink('');
    setBusy(true);
    try {
      const data = await api.forgotPassword(email);
      setMessage(data.message);
      if (data.resetLink) setResetLink(data.resetLink);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-card">
      <h1>Forgot password</h1>
      <p className="sub">Enter your email to get a reset link</p>
      <form onSubmit={onSubmit}>
        {error && <p className="form-error">{error}</p>}
        {message && <p className="form-success">{message}</p>}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Generating…' : 'Send reset link'}
        </button>
      </form>

      {resetLink && (
        <div className="reset-demo-box">
          <p className="reset-demo-note">
            Demo mode: normally this link is emailed. Click to reset now:
          </p>
          <Link to={resetLink.replace(window.location.origin, '')} className="reset-demo-link">
            Reset your password →
          </Link>
        </div>
      )}

      <p className="auth-switch">
        Remembered it? <Link to="/login">Back to log in</Link>
      </p>
    </div>
  );
}
