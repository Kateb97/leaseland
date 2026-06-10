import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { paymentsApi } from '../utils/api';

export default function Pricing() {
  const { user, isSubscribed } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');

  const handlePurchase = async (type) => {
    if (!user) {
      navigate('/signup');
      return;
    }

    if (isSubscribed && type === 'subscription') {
      navigate('/dashboard');
      return;
    }

    setLoading(type);
    setError('');
    try {
      const data = await paymentsApi.createCheckout({ type });
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err.message || 'Error creating payment session. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header centered">
        <h1>💰 Simple Pricing</h1>
        <p className="text-muted">Get the lease protection you need — without breaking the bank</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="pricing-grid">
        {/* Free Tier */}
        <div className="pricing-card free">
          <div className="pricing-header">
            <span className="pricing-icon">📋</span>
            <h2>Free</h2>
            <div className="pricing-amount">
              <span className="price">A$0</span>
              <span className="period">/ forever</span>
            </div>
          </div>
          <div className="pricing-features">
            <ul>
              <li>✅ 1 basic lease question</li>
              <li>✅ State-specific answers</li>
              <li>✅ Legal disclaimers included</li>
              <li>❌ Full lease review</li>
              <li>❌ Unlimited questions</li>
              <li>❌ PDF upload</li>
            </ul>
          </div>
          <div className="pricing-action">
            <button 
              className="btn btn-secondary btn-full"
              onClick={() => user ? navigate('/lease-check') : navigate('/signup')}
            >
              {user ? 'Try It' : 'Get Started'}
            </button>
          </div>
        </div>

        {/* Monthly Subscription */}
        <div className="pricing-card popular">
          <div className="popular-badge">BEST VALUE</div>
          <div className="pricing-header">
            <span className="pricing-icon">⭐</span>
            <h2>Premium</h2>
            <div className="pricing-amount">
              <span className="price">A$9</span>
              <span className="period">/ month</span>
            </div>
          </div>
          <div className="pricing-features">
            <ul>
              <li>✅ Unlimited lease checks</li>
              <li>✅ Unlimited questions</li>
              <li>✅ PDF upload support</li>
              <li>✅ State-specific laws</li>
              <li>✅ Priority support</li>
              <li>✅ Cancel anytime</li>
            </ul>
          </div>
          <div className="pricing-action">
            <button 
              className="btn btn-primary btn-full"
              onClick={() => handlePurchase('subscription')}
              disabled={loading === 'subscription'}
            >
              {loading === 'subscription' ? 'Processing...' : isSubscribed ? 'Current Plan ✓' : 'Subscribe Now'}
            </button>
          </div>
        </div>

        {/* One-Shot */}
        <div className="pricing-card">
          <div className="pricing-header">
            <span className="pricing-icon">🚀</span>
            <h2>One-Shot</h2>
            <div className="pricing-amount">
              <span className="price">A$44</span>
              <span className="period">/ one-time</span>
            </div>
          </div>
          <div className="pricing-features">
            <ul>
              <li>✅ 1 full lease review</li>
              <li>✅ PDF upload support</li>
              <li>✅ State-specific analysis</li>
              <li>✅ Detailed clause flags</li>
              <li>❌ Unlimited questions</li>
              <li>❌ Ongoing subscription</li>
            </ul>
          </div>
          <div className="pricing-action">
            <button 
              className="btn btn-secondary btn-full"
              onClick={() => handlePurchase('oneShot')}
              disabled={loading === 'oneShot'}
            >
              {loading === 'oneShot' ? 'Processing...' : 'Buy Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Referral Info */}
      <section className="referral-info-section">
        <div className="referral-info-card">
          <h2>🎁 Refer a Friend</h2>
          <p>Share LeaseLand with your housemates! When they sign up using your referral link, <strong>you both get 1 free month</strong> of Premium.</p>
          {user ? (
            <p className="text-muted">Find your referral link in the Dashboard.</p>
          ) : (
            <button className="btn btn-primary" onClick={() => navigate('/signup')}>
              Sign Up to Get Your Referral Link
            </button>
          )}
        </div>
      </section>

      <section className="faq-section">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h3>Is this legal advice?</h3>
            <p>No. LeaseLand provides general information based on state tenancy laws. Always consult a qualified professional for your specific situation.</p>
          </div>
          <div className="faq-item">
            <h3>Can I cancel my subscription?</h3>
            <p>Yes, anytime. Your access continues until the end of the billing period.</p>
          </div>
          <div className="faq-item">
            <h3>Which states are covered?</h3>
            <p>NSW, Victoria, Queensland, Western Australia, South Australia, and ACT. More regions coming soon.</p>
          </div>
          <div className="faq-item">
            <h3>How do referrals work?</h3>
            <p>Share your unique referral link. When a friend signs up, you both get 1 free month of Premium.</p>
          </div>
        </div>
      </section>
    </div>
  );
}