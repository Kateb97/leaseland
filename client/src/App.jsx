import { BrowserRouter, Routes, Route, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './utils/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import LeaseCheck from './pages/LeaseCheck';
import Assistant from './pages/Assistant';
import Pricing from './pages/Pricing';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

const PAGE_TITLES = {
  '/': 'LeaseLand — Check your Australian lease before you sign',
  '/login': 'Log in — LeaseLand',
  '/signup': 'Create account — LeaseLand',
  '/dashboard': 'Dashboard — LeaseLand',
  '/lease-check': 'Lease check — LeaseLand',
  '/assistant': 'Tenancy assistant — LeaseLand',
  '/pricing': 'Pricing — LeaseLand',
  '/forgot-password': 'Forgot password — LeaseLand',
  '/reset-password': 'Reset password — LeaseLand',
};

function TitleManager() {
  const location = useLocation();
  useEffect(() => {
    document.title = PAGE_TITLES[location.pathname] || 'LeaseLand';
  }, [location.pathname]);
  return null;
}

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="logo" aria-label="LeaseLand home">
          <img src="/brand/wordmark.png" alt="LeaseLand" />
        </Link>
        <button
          className="nav-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/" className="nav-link" end>Home</NavLink>
          {user && (
            <>
              <NavLink to="/dashboard" className="nav-link">Dashboard</NavLink>
              <NavLink to="/lease-check" className="nav-link">Lease check</NavLink>
              <NavLink to="/assistant" className="nav-link">Assistant</NavLink>
            </>
          )}
          <NavLink to="/pricing" className="nav-link">Pricing</NavLink>
          <div className="nav-cta">
            {user ? (
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">Log out</button>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
                <Link to="/signup" className="btn btn-primary btn-sm">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <img src="/brand/wordmark.png" alt="LeaseLand" />
            <p>Plain-English lease help for renters in Australia.</p>
          </div>
          <div className="footer-cols">
            <div className="footer-col">
              <h4>Product</h4>
              <ul>
                <li><Link to="/lease-check">Lease check</Link></li>
                <li><Link to="/assistant">Tenancy assistant</Link></li>
                <li><Link to="/pricing">Pricing</Link></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Account</h4>
              <ul>
                <li><Link to="/login">Log in</Link></li>
                <li><Link to="/signup">Create account</Link></li>
                <li><Link to="/forgot-password">Reset password</Link></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Contact</h4>
              <ul>
                <li><a href="mailto:hello@leaseland.app">hello@leaseland.app</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>
            LeaseLand provides general information about Australian tenancy law. It is not legal advice.
            For advice about your specific situation, contact your state's tenancy authority or a qualified professional.
          </p>
          <p>© {new Date().getFullYear()} LeaseLand</p>
        </div>
      </div>
    </footer>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setPaymentSuccess(true);
      // Refresh user data
      window.location.search = '';
    }
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading LeaseLand…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <TitleManager />
      <Navbar />
      <main className="main-content">
        {paymentSuccess && (
          <div className="toast">
            Payment successful. Your plan is now active.
            <button onClick={() => setPaymentSuccess(false)} className="toast-close" aria-label="Dismiss">×</button>
          </div>
        )}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/lease-check" element={<LeaseCheck />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
