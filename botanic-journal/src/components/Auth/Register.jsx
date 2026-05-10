import React, { useState, useMemo } from 'react';
import '../../auth.css';

// Score password 0–4 based on length + class variety
const scorePassword = (pw) => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
};

const STRENGTH_LABELS = ['Too short', 'Weak', 'Okay', 'Strong', 'Excellent'];

const Register = ({ onSwitchToLogin, onRegister }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agree: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const passwordScore = useMemo(() => scorePassword(formData.password), [formData.password]);
  const passwordLabel = STRENGTH_LABELS[passwordScore];

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.agree) {
      newErrors.agree = 'You must agree to the terms';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const { agree, ...payload } = formData;
      await onRegister(payload);
    } catch (error) {
      setErrors({ submit: error.message || 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* ── Brand panel ─────────────────────────── */}
      <aside className="auth-brand">
        <i className="fas fa-leaf brand-leaf l1"></i>
        <i className="fas fa-seedling brand-leaf l2"></i>
        <i className="fas fa-pagelines brand-leaf l3"></i>
        <i className="fas fa-spa brand-leaf l4"></i>

        <div className="brand-top">
          <div className="brand-logo">
            <i className="fas fa-seedling"></i>
          </div>
          <div>
            <h1 className="brand-title">
              Botanic Journal
              <small>Your garden, your story</small>
            </h1>
          </div>
        </div>

        <div className="brand-hero">
          <h2>
            Plant the seed of a <em>greener routine</em>.
          </h2>
          <p>
            Create your free account and start documenting every watering,
            new leaf, and bloom — with reminders that keep your plants thriving.
          </p>

          <div className="brand-features">
            <div className="brand-feature">
              <div className="bf-icon"><i className="fas fa-tint"></i></div>
              <span>Smart reminders for every plant</span>
            </div>
            <div className="brand-feature">
              <div className="bf-icon"><i className="fas fa-book-open"></i></div>
              <span>Personal encyclopedia &amp; care guides</span>
            </div>
            <div className="brand-feature">
              <div className="bf-icon"><i className="fas fa-users"></i></div>
              <span>Community of fellow plant lovers</span>
            </div>
          </div>
        </div>

        <div className="brand-bottom">
          &copy; {new Date().getFullYear()} Botanic Journal — Cultivate calmly.
        </div>
      </aside>

      {/* ── Form panel ──────────────────────────── */}
      <main className="auth-panel">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-eyebrow">
              <i className="fas fa-seedling"></i> Get started
            </span>
            <h2>Create your account</h2>
            <p>Free forever. No credit card required.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {errors.submit && (
              <div className="error-message" role="alert">
                <i className="fas fa-exclamation-circle"></i>
                <span>{errors.submit}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Full name
              </label>
              <div className="input-wrap">
                <i className="fas fa-user input-icon"></i>
                <input
                  type="text"
                  id="name"
                  name="name"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  placeholder="Jane Botanist"
                />
              </div>
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <div className="input-wrap">
                <i className="fas fa-envelope input-icon"></i>
                <input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="input-wrap">
                <i className="fas fa-lock input-icon"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  className="input-toggle"
                  onClick={() => setShowPassword(s => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>

              {/* Strength meter — only show once user starts typing */}
              {formData.password && (
                <div className="password-strength">
                  <div className="strength-track">
                    {[1, 2, 3, 4].map(n => (
                      <div
                        key={n}
                        className={`strength-bar ${passwordScore >= n ? `active s${passwordScore}` : ''}`}
                      />
                    ))}
                  </div>
                  <div className="strength-text">
                    <span>Password strength</span>
                    <strong>{passwordLabel}</strong>
                  </div>
                </div>
              )}

              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm password
              </label>
              <div className="input-wrap">
                <i className="fas fa-shield-halved input-icon"></i>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder="Re-enter your password"
                />
                <button
                  type="button"
                  className="input-toggle"
                  onClick={() => setShowConfirm(s => !s)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  <i className={`fas ${showConfirm ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
            </div>

            <label className="checkbox-label" style={{ marginTop: '4px' }}>
              <input
                type="checkbox"
                name="agree"
                checked={formData.agree}
                onChange={handleChange}
              />
              <span style={{ fontSize: '0.85rem' }}>
                I agree to the{' '}
                <a href="#terms" onClick={(e) => e.preventDefault()}>Terms</a>
                {' '}and{' '}
                <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
              </span>
            </label>
            {errors.agree && <span className="field-error">{errors.agree}</span>}

            <button
              type="submit"
              className="auth-btn primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner"></i>
                  Creating account...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus"></i>
                  Create account
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already growing with us?{' '}
              <button
                type="button"
                className="auth-link"
                onClick={onSwitchToLogin}
              >
                Sign in instead
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Register;
