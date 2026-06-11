import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { leaseApi, referralApi } from '../utils/api';
import StateSelector from '../components/StateSelector';
import {
  CreditCard, MapPin, FileText, MessageSquareText,
  ArrowUpRight, CheckCircle2, Clock, Copy, FileSearch,
} from 'lucide-react';

export default function Dashboard() {
  const { user, isSubscribed } = useAuth();
  const navigate = useNavigate();
  const [recentChecks, setRecentChecks] = useState([]);
  const [referralInfo, setReferralInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [checks, refInfo] = await Promise.all([
        leaseApi.history().catch(() => ({ checks: [] })),
        referralApi.code().catch(() => ({})),
      ]);
      setRecentChecks(checks.checks || []);
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back{user?.name ? `, ${user.name}` : ''}</h1>
          <p className="text-muted">Your leases and tenancy questions, in one place.</p>
        </div>
        <StateSelector compact />
      </div>

      <div className="status-cards">
        <div className="status-card">
          <div className="status-card-top">
            <CreditCard size={20} />
            <span className={`status-badge ${isSubscribed ? 'badge-active' : ''}`}>
              {isSubscribed ? 'Active' : 'Free'}
            </span>
          </div>
          <h3>{isSubscribed ? 'Monthly plan' : 'Free plan'}</h3>
          <p className="status-detail">
            {isSubscribed
              ? 'Unlimited lease reviews and questions'
              : `${user?.free_questions_remaining ?? 1} free question${(user?.free_questions_remaining ?? 1) !== 1 ? 's' : ''} remaining`
            }
          </p>
          {!isSubscribed && (
            <Link to="/pricing" className="btn btn-primary btn-sm">Upgrade</Link>
          )}
        </div>

        <div className="status-card">
          <div className="status-card-top">
            <MapPin size={20} />
            <span className="status-badge">{user?.state?.toUpperCase()}</span>
          </div>
          <h3>Your state</h3>
          <p className="status-detail">Answers reference {user?.state?.toUpperCase()} tenancy laws.</p>
          <StateSelector compact />
        </div>

        <div className="status-card">
          <div className="status-card-top">
            <FileText size={20} />
            <span className="status-badge">{recentChecks.length}</span>
          </div>
          <h3>Lease reviews</h3>
          <p className="status-detail">
            {recentChecks.length === 0
              ? 'No leases reviewed yet.'
              : `${recentChecks.length} lease${recentChecks.length !== 1 ? 's' : ''} reviewed so far.`}
          </p>
          <Link to="/lease-check" className="btn btn-ghost btn-sm">Review a lease</Link>
        </div>
      </div>

      <section className="dashboard-section">
        <h2>Quick actions</h2>
        <div className="quick-actions">
          <Link to="/lease-check" className="action-card">
            <FileSearch size={22} />
            <h3>Review a lease</h3>
            <p>Paste the text or upload the PDF for a clause-by-clause check.</p>
          </Link>
          <Link to="/assistant" className="action-card">
            <MessageSquareText size={22} />
            <h3>Ask a question</h3>
            <p>Bonds, repairs, notice periods, or anything else about renting.</p>
          </Link>
          <Link to="/pricing" className="action-card">
            <ArrowUpRight size={22} />
            <h3>Manage plan</h3>
            <p>See pricing or upgrade for unlimited reviews and questions.</p>
          </Link>
        </div>
      </section>

      {referralInfo?.referralLink && (
        <section className="dashboard-section">
          <h2>Refer a friend</h2>
          <div className="referral-card">
            <p>When a friend signs up with your link, you both get one free month.</p>
            <div className="referral-link-box">
              <input
                type="text"
                value={referralInfo.referralLink || ''}
                readOnly
                aria-label="Your referral link"
              />
              <button onClick={handleCopyReferral} className="btn btn-primary">
                <Copy size={16} />
                {copied ? 'Copied' : 'Copy link'}
              </button>
            </div>
            {referralInfo.referralFreeMonths > 0 && (
              <p className="referral-earned">
                You've earned {referralInfo.referralFreeMonths} free month{referralInfo.referralFreeMonths > 1 ? 's' : ''} from referrals.
              </p>
            )}
          </div>
        </section>
      )}

      {recentChecks.length > 0 && (
        <section className="dashboard-section">
          <h2>Recent lease reviews</h2>
          <div className="lease-history">
            {recentChecks.slice(0, 5).map(check => (
              <div key={check.id} className="lease-history-item">
                <div className="history-info">
                  <span className="history-state">{check.state?.toUpperCase()}</span>
                  <span className="history-date">
                    {new Date(check.created_at).toLocaleDateString()}
                  </span>
                  {check.pdf_filename && (
                    <span className="history-file">{check.pdf_filename}</span>
                  )}
                </div>
                <span className="history-status">
                  {check.status === 'completed' || !check.status ? <CheckCircle2 size={15} /> : <Clock size={15} />}
                  {check.status || 'completed'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
