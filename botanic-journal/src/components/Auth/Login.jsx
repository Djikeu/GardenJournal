import React, { useState } from 'react';
import '../../auth.css';

const Login = ({ onSwitchToRegister, onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: true,
  });
  const [showPassword, setShowPassword] = useState(false);
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

  const validateForm = () => {
    const newErrors = {};
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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const { remember, ...credentials } = formData;
      await onLogin(credentials);
    } catch (error) {
      setErrors({ submit: error.message || 'Login failed. Please try again.' });
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
            Welcome back to your <em>green sanctuary</em>.
          </h2>
          <p>
            Sign in to continue tracking your plants, completing care tasks,
            and growing your botanical knowledge — one leaf at a time.
          </p>

          <div className="brand-features">
            <div className="brand-feature">
              <div className="bf-icon"><i className="fas fa-tasks"></i></div>
              <span>Care tasks tailored to every plant</span>
            </div>
            <div className="brand-feature">
              <div className="bf-icon"><i className="fas fa-book"></i></div>
              <span>Journal growth, blooms, and milestones</span>
            </div>
            <div className="brand-feature">
              <div className="bf-icon"><i className="fas fa-fire"></i></div>
              <span>Build daily streaks. Stay consistent.</span>
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
              <i className="fas fa-leaf"></i> Sign in
            </span>
            <h2>Welcome back</h2>
            <p>Enter your details to access your garden.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {errors.submit && (
              <div className="error-message" role="alert">
                <i className="fas fa-exclamation-circle"></i>
                <span>{errors.submit}</span>
              </div>
            )}

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
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="Enter your password"
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
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="form-helper">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                />
                Remember me
              </label>
              <button type="button" className="forgot-link">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="auth-btn primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner"></i>
                  Signing in...
                </>
              ) : (
                <>
                  <i className="fas fa-arrow-right-to-bracket"></i>
                  Sign in
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              New to Botanic Journal?{' '}
              <button
                type="button"
                className="auth-link"
                onClick={onSwitchToRegister}
              >
                Create an account
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
