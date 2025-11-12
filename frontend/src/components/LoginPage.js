import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '' });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Store token and user info in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Notify app that user context changed (for per-user cart)
      try { window.dispatchEvent(new Event('user-changed')); } catch {}

      // Show centered popup and then redirect
      setToast({ show: true, message: 'Login successful!' });
      setTimeout(() => {
        setToast({ show: false, message: '' });
        navigate('/');
      }, 1200);
    } else {
      setError(data.message || 'Login failed. Please try again.');
    }
  } catch (err) {
    console.error('Login error:', err);
    setError('Network error. Please check your connection and try again.');
  } finally {
    setLoading(false);
  }
};


  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="login-page">
      <Header />
      <main className="login-page-content">
        <div className="login-form-wrapper">
          <div className="login-card">
            <div className="login-header">
              <h2>Welcome Back!</h2>
              <p>Login to continue shopping</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password:</label>
                <div className="password-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="toggle-visibility"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Logging In...' : 'Login'}
                </button>
                <button type="button" className="cancel-btn" onClick={handleCancel}>Cancel</button>
              </div>

              <div className="signup-link">
                <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />

      {/* Centered Popup Toast */}
      {toast.show && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(2px)'
          }}
        >
          <div
            style={{
              background: '#fff7eb',
              color: '#273c2e',
              border: '1px solid rgba(182, 158, 106, 0.35)',
              borderRadius: 18,
              boxShadow: '0 18px 40px rgba(39, 60, 46, 0.18)',
              padding: '24px 28px',
              width: 'min(92vw, 440px)',
              textAlign: 'center',
              transform: 'scale(1)',
              animation: 'kpScaleIn 240ms ease-out',
              fontWeight: 700,
              position: 'relative'
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                margin: '0 auto 12px',
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                background: 'linear-gradient(135deg, #6fbf8c, #4f8f70)',
                color: '#fff7eb',
                boxShadow: '0 8px 20px rgba(111,191,140,0.35)',
                border: '2px solid rgba(255,255,255,0.55)'
              }}
            >
              ✓
            </div>
            <div style={{ fontSize: 18, letterSpacing: 0.2, marginBottom: 4 }}>
              {toast.message}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#4f6354' }}>
              Redirecting to home...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
