import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../utils/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="page-container auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <img src="/brand/apple-touch-icon.png" alt="" width="40" height="40" />
            <h1>Invalid link</h1>
            <p>This password reset link is invalid or has expired.</p>
          </div>
          <Link to="/forgot-password" className="btn btn-primary btn-block">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({ token, password });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Error resetting password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/brand/apple-touch-icon.png" alt="" width="40" height="40" />
          <h1>Reset password</h1>
          <p>Choose a new password for your account</p>
        </div>

        {success ? (
          <div className="auth-success">
            <p>Your password has been reset.</p>
            <Link to="/login" className="btn btn-primary btn-block">
              Log in
            </Link>
          </div>
        ) : (
          <>
            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="password">New password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirm">Confirm password</label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your new password"
                  required
                  minLength={6}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'Resetting…' : 'Reset password'}
              </button>
            </form>

            <div className="auth-footer">
              <p>Remember your password? <Link to="/login">Log in</Link></p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
