import { Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import StateSelector from '../components/StateSelector';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <section className="hero">
        <div className="hero-badge">🇦🇺 For International Students in Australia</div>
        <h1 className="hero-title">
          Know Your Rights.<br />
          <span className="highlight">Keep Your Bond.</span>
        </h1>
        <p className="hero-subtitle">
          LeaseLand helps you check your rental lease for unfair clauses, understand your tenancy rights 
          in your state, and avoid getting ripped off — all without paying a lawyer.
        </p>
        <div className="hero-actions">
          {user ? (
            <Link to="/lease-check" className="btn btn-large btn-primary">
              Check Your Lease Now
            </Link>
          ) : (
            <Link to="/signup" className="btn btn-large btn-primary">
              Get Started Free
            </Link>
          )}
          <Link to="/pricing" className="btn btn-large btn-secondary">
            See Pricing
          </Link>
        </div>
        <div className="hero-state">
          <StateSelector compact />
        </div>
      </section>

      <section className="features-section">
        <h2 className="section-title">How LeaseLand Helps You</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h3>Lease Checker</h3>
            <p>Paste your lease or upload a PDF. Our AI flags illegal, unfair, or negotiable clauses based on your state's tenancy laws.</p>
            <ul className="feature-list">
              <li>Identifies illegal clauses</li>
              <li>Highlights negotiation points</li>
              <li>State-specific law references</li>
            </ul>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Tenancy Assistant</h3>
            <p>Ask anything about your rental in plain English — bond disputes, repairs, notice periods, breaking lease, condition reports.</p>
            <ul className="feature-list">
              <li>Plain English answers</li>
              <li>State-specific guidance</li>
              <li>Links to official resources</li>
            </ul>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📍</div>
            <h3>State-Specific Knowledge</h3>
            <p>Every answer is grounded in the laws of NSW, VIC, QLD, WA, SA, or ACT. Select your state and get accurate info.</p>
            <ul className="feature-list">
              <li>All 6 Australian states</li>
              <li>Modular knowledge base</li>
              <li>Easy to add more regions</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="states-section">
        <h2 className="section-title">Covered States</h2>
        <div className="states-grid">
          {['NSW', 'VIC', 'QLD', 'WA', 'SA', 'ACT'].map(state => (
            <div key={state} className="state-pill">
              {state}
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-card">
          <h2>Start with a Free Question</h2>
          <p>No credit card required. Ask one lease question free, then subscribe for unlimited access.</p>
          {user ? (
            <Link to="/lease-check" className="btn btn-large btn-primary">Check Your Lease</Link>
          ) : (
            <Link to="/signup" className="btn btn-large btn-primary">Try It Free</Link>
          )}
        </div>
      </section>
    </div>
  );
}