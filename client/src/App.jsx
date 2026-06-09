import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
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
import Disclaimer from './components/Disclaimer';
import { useEffect, useState } from 'react';
import { paymentsApi } from './utils/api';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="logo">
          <span className="logo-icon">🏠</span>
          <span className="logo-text">LeaseLand</span>
        </Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          {user && (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/lease-check" className="nav-link">Check Lease</Link>
              <Link to="/assistant" className="nav-link">Assistant</Link>
            </>
          )}
          <Link to="/pricing" className="nav-link">Pricing</Link>
          {user ? (
            <div className="nav-user">
              <span className="nav-email">{user.email}</span>
              <button onClick={handleLogout} className="btn btn-small">Logout</button>
            </div>
          ) : (
            <div className="nav-auth">
              <Link to="/login" className="btn btn-small">Login</Link>
              <Link to="/signup" className="btn btn-small btn-primary">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
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
          <p>Loading LeaseLand...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        {paymentSuccess && (
          <div className="toast toast-success">
            Payment successful! Your subscription is now active.
            <button onClick={() => setPaymentSuccess(false)} className="toast-close">×</button>
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
      <Disclaimer />
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