import { Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { FileSearch, MessageSquareText, MapPin } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <section className="hero">
        <div className="hero-eyebrow">For international students renting in Australia</div>
        <h1 className="hero-title">Check your Australian lease before you sign.</h1>
        <p className="hero-subtitle">
          Paste your lease and get a plain-English review against your state's tenancy laws.
          LeaseLand flags clauses that are illegal, unfair, or worth negotiating — before they cost you your bond.
        </p>
        <div className="hero-actions">
          {user ? (
            <Link to="/lease-check" className="btn btn-gradient btn-lg">Check your lease</Link>
          ) : (
            <Link to="/signup" className="btn btn-gradient btn-lg">Start free</Link>
          )}
          <Link to="/pricing" className="btn btn-ghost btn-lg">See pricing</Link>
        </div>
        <p className="text-muted" style={{ fontSize: '14px' }}>
          Your first lease question is free. No card required.
        </p>
      </section>

      <section className="section">
        <h2 className="section-title">What you get</h2>
        <div className="feature-rows">
          <div className="feature-row">
            <div className="feature-row-icon"><FileSearch size={22} /></div>
            <div>
              <h3>Lease review</h3>
              <p>
                Paste your lease or upload the PDF. LeaseLand reads every clause and flags the ones
                that breach your state's tenancy laws, with references to the relevant Act.
              </p>
            </div>
          </div>
          <div className="feature-row">
            <div className="feature-row-icon"><MessageSquareText size={22} /></div>
            <div>
              <h3>Tenancy assistant</h3>
              <p>
                Ask questions about bonds, repairs, notice periods, or breaking a lease.
                Answers are written in plain English and grounded in your state's rules.
              </p>
            </div>
          </div>
          <div className="feature-row">
            <div className="feature-row-icon"><MapPin size={22} /></div>
            <div>
              <h3>Six states covered</h3>
              <p>
                NSW, Victoria, Queensland, Western Australia, South Australia, and the ACT.
                Pick your state once and every answer uses the laws that apply to you.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">How it works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">Step 1</div>
            <h3>Create a free account</h3>
            <p>Tell us which state you're renting in. That's all we need.</p>
          </div>
          <div className="step">
            <div className="step-number">Step 2</div>
            <h3>Add your lease</h3>
            <p>Paste the text or upload the PDF your landlord or agent sent you.</p>
          </div>
          <div className="step">
            <div className="step-number">Step 3</div>
            <h3>Read the review</h3>
            <p>See which clauses are fine, which are unfair, and which are illegal in your state.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Covered states</h2>
        <div className="states-strip">
          {['NSW', 'VIC', 'QLD', 'WA', 'SA', 'ACT'].map(state => (
            <div key={state} className="state-pill">{state}</div>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <h2>Start with a free question</h2>
        <p>No card required. Ask one question or run one lease review free, then decide.</p>
        {user ? (
          <Link to="/lease-check" className="btn btn-primary btn-lg">Check your lease</Link>
        ) : (
          <Link to="/signup" className="btn btn-primary btn-lg">Create free account</Link>
        )}
      </section>
    </div>
  );
}
