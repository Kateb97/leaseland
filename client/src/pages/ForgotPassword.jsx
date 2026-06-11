import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../utils/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/brand/apple-touch-icon.png" alt="" width="40" height="40" />
          <h1>Forgot password</h1>
          <p>Enter your email and we'll send you a reset link</p>
        </div>

        {sent ? (
          <div className="auth-success">
            <p>If an account with that email exists, we've sent a password reset link. Check your inbox.</p>
            <Link to="/login" className="btn btn-primary btn-block">
              Back to log in
            </Link>
          </div>
        ) : (
          <>
            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu.au"
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'Sending…' : 'Send reset link'}
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
