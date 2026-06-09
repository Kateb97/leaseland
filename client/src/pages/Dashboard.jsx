import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { leaseApi, paymentsApi, referralApi } from '../utils/api';
import StateSelector from '../components/StateSelector';

export default function Dashboard() {
  const { user, isSubscribed, canUseFeature } = useAuth();
  const navigate = useNavigate();
  const [recentChecks, setRecentChecks] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [referralInfo, setReferralInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [checks, status, refInfo] = await Promise.all([
        leaseApi.history().catch(() => ({ checks: [] })),
        paymentsApi.status().catch(() => ({})),
        referralApi.code().catch(() => ({})),
      ]);
      setRecentChecks(checks.checks || []);
      setPaymentStatus(status);
      setReferralInfo(refInfo);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReferral = () => {
    if (referralInfo?.referralLink) {
      navigator.clipboard.writeText(referralInfo.referralLink);
      alert('Referral link copied! Share it with friends.');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back{user?.name ? `, ${user.name}` : ''} 👋</h1>
          <p className="text-muted">Manage your leases and tenancy questions</p>
        </div>
        <StateSelector compact />
      </div>

      {/* Status Cards */}
      <div className="status-cards">
        <div className={`status-card ${isSubscribed ? 'premium' : 'free'}`}>
          <div className="status-card-header">
            <span className="status-icon">{isSubscribed ? '⭐' : '📋'}</span>
            <span className="status-badge">{isSubscribed ? 'Active' : 'Free'}</span>
          </div>
          <h3>{isSubscribed ? 'Premium Plan' : 'Free Plan'}</h3>
          <p className="status-detail">
            {isSubscribed 
              ? 'Unlimited lease checks and questions'
              : `${user?.free_questions_remaining || 1} question${(user?.free_questions_remaining || 1) !== 1 ? 's' : ''} remaining`
            }
          </p>
          {!isSubscribed && (
            <Link to="/pricing" className="btn btn-small btn-primary">Upgrade</Link>
          )}
        </div>

        <div className="status-card">
          <div className="status-card-header">
            <span className="status-icon">📍</span>
            <span className="status-badge">{user?.state?.toUpperCase()}</span>
          </div>
          <h3>Your State</h3>
          <p className="status-detail">All answers reference {user?.state?.toUpperCase()} tenancy laws</p>
          <StateSelector compact />
        </div>

        <div className="status-card">
          <div className="status-card-header">
            <span className="status-icon">📊</span>
            <span className="status-badge">{recentChecks.length}</span>
          </div>
          <h3>Lease Checks</h3>
          <p className="status-detail">{recentChecks.length} lease{recentChecks.length !== 1 ? 's' : ''} checked</p>
          <Link to="/lease-check" className="btn btn-small">Check New Lease</Link>
        </div>
      </div>

      {/* Quick Actions */}
      <section className="dashboard-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions">
          <Link to="/lease-check" className="action-card">
            <span className="action-icon">📄</span>
            <h3>Check a Lease</h3>
            <p>Paste your lease text or upload a PDF for AI analysis</p>
          </Link>
          <Link to="/assistant" className="action-card">
            <span className="action-icon">💬</span>
            <h3>Ask a Question</h3>
            <p>Ask about bonds, repairs, notices, or any tenancy topic</p>
          </Link>
          <Link to="/pricing" className="action-card">
            <span className="action-icon">💎</span>
            <h3>Upgrade Plan</h3>
            <p>Unlock unlimited lease checks and questions</p>
          </Link>
        </div>
      </section>

      {/* Referral Section */}
      {referralInfo && (
        <section className="dashboard-section">
          <h2>Refer & Earn Free Months 🎁</h2>
          <div className="referral-card">
            <p>Share your referral link with friends. When they sign up, you both get <strong>1 free month</strong> of Premium!</p>
            <div className="referral-link-box">
              <input 
                type="text" 
                value={referralInfo.referralLink || ''} 
                readOnly 
                className="referral-input"
              />
              <button onClick={handleCopyReferral} className="btn btn-primary">
                Copy Link
              </button>
            </div>
            {referralInfo.referralFreeMonths > 0 && (
              <p className="referral-earned">
                🎉 You've earned <strong>{referralInfo.referralFreeMonths} free month{referralInfo.referralFreeMonths > 1 ? 's' : ''}</strong> from referrals!
              </p>
            )}
          </div>
        </section>
      )}

      {/* Recent Lease Checks */}
      {recentChecks.length > 0 && (
        <section className="dashboard-section">
          <h2>Recent Lease Checks</h2>
          <div className="lease-history">
            {recentChecks.slice(0, 5).map(check => (
              <div key={check.id} className="lease-history-item">
                <div className="history-info">
                  <span className="history-state">{check.state?.toUpperCase()}</span>
                  <span className="history-date">
                    {new Date(check.created_at).toLocaleDateString()}
                  </span>
                  {check.pdf_filename && (
                    <span className="history-file">📎 {check.pdf_filename}</span>
                  )}
                </div>
                <span className={`history-status ${check.status}`}>
                  {check.status === 'completed' ? '✅' : '⏳'} {check.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}