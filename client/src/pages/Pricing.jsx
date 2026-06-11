import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { paymentsApi } from '../utils/api';
import { Check, Minus } from 'lucide-react';

function Feature({ included, children }) {
  return (
    <li className={included ? 'inc' : 'exc'}>
      {included ? <Check size={16} /> : <Minus size={16} />}
      <span>{children}</span>
    </li>
  );
}

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
      <div className="page-header">
        <h1>Pricing</h1>
        <p className="page-sub">Start free. Upgrade if you need more than one question.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="pricing-grid">
        {/* Free */}
        <div className="pricing-card">
          <h2 className="pricing-name">Free</h2>
          <div className="pricing-amount">
            <span className="price">A$0</span>
            <span className="period">forever</span>
          </div>
          <ul className="pricing-features">
            <Feature included>One lease question or review</Feature>
            <Feature included>State-specific answers</Feature>
            <Feature included>References to the relevant Act</Feature>
            <Feature included={false}>PDF upload</Feature>
            <Feature included={false}>Unlimited questions</Feature>
          </ul>
          <div>
            <button
              className="btn btn-ghost btn-block"
              onClick={() => user ? navigate('/lease-check') : navigate('/signup')}
            >
              {user ? 'Use your free question' : 'Create free account'}
            </button>
          </div>
        </div>

        {/* Monthly */}
        <div className="pricing-card popular">
          <div className="popular-badge">Most popular</div>
          <h2 className="pricing-name">Monthly</h2>
          <div className="pricing-amount">
            <span className="price">A$9</span>
            <span className="period">per month</span>
          </div>
          <ul className="pricing-features">
            <Feature included>Unlimited lease reviews</Feature>
            <Feature included>Unlimited assistant questions</Feature>
            <Feature included>PDF upload</Feature>
            <Feature included>State-specific answers</Feature>
            <Feature included>Cancel anytime</Feature>
          </ul>
          <div>
            <button
              className="btn btn-primary btn-block"
              onClick={() => handlePurchase('subscription')}
              disabled={loading === 'subscription'}
            >
              {loading === 'subscription' ? 'Redirecting…' : isSubscribed ? 'Current plan' : 'Subscribe'}
            </button>
          </div>
        </div>

        {/* One-time */}
        <div className="pricing-card">
          <h2 className="pricing-name">One-time review</h2>
          <div className="pricing-amount">
            <span className="price">A$44</span>
            <span className="period">once</span>
          </div>
          <ul className="pricing-features">
            <Feature included>One full lease review</Feature>
            <Feature included>PDF upload</Feature>
            <Feature included>Clause-by-clause flags</Feature>
            <Feature included>State-specific analysis</Feature>
            <Feature included={false}>Ongoing access</Feature>
          </ul>
          <div>
            <button
              className="btn btn-ghost btn-block"
              onClick={() => handlePurchase('oneShot')}
              disabled={loading === 'oneShot'}
            >
              {loading === 'oneShot' ? 'Redirecting…' : 'Buy one review'}
            </button>
          </div>
        </div>
      </div>

      <section className="section" style={{ paddingTop: 0 }}>
        <h2 className="section-title">Common questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h3>Is this legal advice?</h3>
            <p>No. LeaseLand provides general information based on state tenancy laws. For advice about your situation, contact your state's tenancy authority or a qualified professional.</p>
          </div>
          <div className="faq-item">
            <h3>Can I cancel the subscription?</h3>
            <p>Yes, anytime. Your access continues until the end of the billing period.</p>
          </div>
          <div className="faq-item">
            <h3>Which states are covered?</h3>
            <p>NSW, Victoria, Queensland, Western Australia, South Australia, and the ACT.</p>
          </div>
          <div className="faq-item">
            <h3>How do referrals work?</h3>
            <p>Share the referral link from your dashboard. When a friend signs up with it, you both get one free month.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
