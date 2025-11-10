import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import './SignupPage.css';
import './Footer.css';

const COUNTRY_OPTIONS = [
  { value: '+1', label: '🇺🇸 +1 (US)', pattern: '[0-9]{10}', description: '10-digit number' },
  { value: '+91', label: '🇮🇳 +91 (IN)', pattern: '[0-9]{10}', description: '10-digit number' },
  { value: '+44', label: '🇬🇧 +44 (UK)', pattern: '[0-9]{10}', description: '10-digit number' },
  { value: '+61', label: '🇦🇺 +61 (AU)', pattern: '[0-9]{9}', description: '9-digit number' },
  { value: '+971', label: '🇦🇪 +971 (AE)', pattern: '[0-9]{9}', description: '9-digit number' }
];

const SignupPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    countryCode: COUNTRY_OPTIONS[0].value,
    mobileNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedCountry =
    COUNTRY_OPTIONS.find((option) => option.value === formData.countryCode) || COUNTRY_OPTIONS[0];

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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    const sanitizedMobile = formData.mobileNumber.trim();
    const mobileRegex = new RegExp(`^${selectedCountry.pattern}$`);
    if (!mobileRegex.test(sanitizedMobile)) {
      setError(`Please enter a valid mobile number (${selectedCountry.description}) for ${selectedCountry.label}.`);
      return;
    }

    const passwordPolicy = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-={}:";'<>?,.]{8,}$/;
    if (!passwordPolicy.test(formData.password)) {
      setError('Password must be at least 8 characters long, include one uppercase letter, and one number.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          countryCode: formData.countryCode,
          mobileNumber: sanitizedMobile,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        //localStorage.setItem('user', JSON.stringify(data.user));
        
        alert('Signup successful!');
        navigate('/login');
      } else {
        setError(data.message || 'Signup failed. Please try again.');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="signup-page">
      <Header />
      <main className="signup-page-content">
        <div className="signup-form-wrapper">
          <div className="signup-card">
            <div className="signup-header">
              <h2>Sign Up</h2>
              <p>Create your account to start shopping</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="signup-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name:</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name:</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email:</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group phone-group">
                  <label htmlFor="mobileNumber">Mobile Number:</label>
                  <div className="phone-inputs">
                    <select
                      id="countryCode"
                      name="countryCode"
                      value={formData.countryCode}
                      onChange={handleChange}
                      aria-label="Country code"
                      required
                    >
                      {COUNTRY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      id="mobileNumber"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      pattern={selectedCountry.pattern}
                      inputMode="numeric"
                      placeholder={selectedCountry.description}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Password:</label>
                  <div className="password-field">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
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

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password:</label>
                  <div className="password-field">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="toggle-visibility"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Signing Up...' : 'Sign Up'}
                </button>
                <button type="button" className="cancel-btn" onClick={handleCancel}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SignupPage;
