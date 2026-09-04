import React, { useState } from 'react';
import { LogIn, UserPlus, GraduationCap, ShieldCheck, Sparkles, BookOpen, AlertCircle, ArrowRight } from 'lucide-react';
import { loginUser, registerUser, DEPARTMENTS } from '../services/auth';
import './AuthPage.css';

export default function AuthPage({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupId, setSignupId] = useState('');
  const [signupDept, setSignupDept] = useState('CSE');
  const [signupName, setSignupName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Quick Demo fill helper
  const handleDemoFill = () => {
    setLoginEmail('student@aust.edu');
    setLoginPassword('password123');
    setError('');
  };

  // Submit Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await loginUser(loginEmail, loginPassword);
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Sign Up
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await registerUser({
        eduMail: signupEmail,
        studentId: signupId,
        dept: signupDept,
        name: signupName,
        password: signupPassword
      });
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err) {
      setError(err.message || 'Sign up failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Decorative backdrop elements */}
      <div className="auth-bg-blob auth-blob-1"></div>
      <div className="auth-bg-blob auth-blob-2"></div>

      <div className="auth-card">
        {/* Left Side: Brand Showcase */}
        <div className="auth-brand-side">
          <div className="brand-header">
            <div className="brand-badge">
              <GraduationCap size={18} />
              <span>CampusOS Official Portal</span>
            </div>
            <h1 className="brand-title">
              Campus<span>OS</span>
            </h1>
            <p className="brand-tagline">
              Intelligent University Platform for Students & Faculty
            </p>
          </div>

          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-icon"><BookOpen size={16} /></div>
              <div>
                <h4>Live Schedules & Deadlines</h4>
                <p>Real-time class timetable and assignment tracking</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><ShieldCheck size={16} /></div>
              <div>
                <h4>Room & Event Booking</h4>
                <p>Instant lab reservation and campus event registrations</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon"><Sparkles size={16} /></div>
              <div>
                <h4>Senior AI Assistant</h4>
                <p>24/7 intelligent agent with full campus data awareness</p>
              </div>
            </div>
          </div>

          <div className="auth-footer-note">
            <span>CSE Carnival 8.0 · AI Build Hackathon</span>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="auth-form-side">
          {/* Mode Switcher Tabs */}
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError(''); }}
            >
              <LogIn size={16} />
              <span>Log In</span>
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => { setMode('signup'); setError(''); }}
            >
              <UserPlus size={16} />
              <span>Sign Up</span>
            </button>
          </div>

          {/* Form Header */}
          <div className="form-header">
            <h2>{mode === 'login' ? 'Welcome Back' : 'Create Student Account'}</h2>
            <p>
              {mode === 'login'
                ? 'Sign in with your institutional edu mail and password'
                : 'Enter your edu mail, student ID, department, and password'}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="auth-error-box">
              <AlertCircle size={18} className="error-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="login-email">Edu Mail</label>
                <input
                  id="login-email"
                  type="email"
                  required
                  placeholder="e.g. student@aust.edu"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="login-password">Password</label>
                </div>
                <input
                  id="login-password"
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                className="btn-auth-primary"
                disabled={loading}
              >
                <span>{loading ? 'Signing in...' : 'Sign In to CampusOS'}</span>
                <ArrowRight size={16} />
              </button>

              <div className="demo-fill-card">
                <div className="demo-info">
                  <span className="demo-title">Quick Demo Login:</span>
                  <span className="demo-details">student@aust.edu / password123</span>
                </div>
                <button
                  type="button"
                  className="btn-demo-fill"
                  onClick={handleDemoFill}
                >
                  Fill Demo
                </button>
              </div>

              <div className="switch-mode-hint">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => { setMode('signup'); setError(''); }}
                >
                  Create one now
                </button>
              </div>
            </form>
          ) : (
            /* SIGN UP FORM */
            <form onSubmit={handleSignupSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="signup-email">Edu Mail *</label>
                <input
                  id="signup-email"
                  type="email"
                  required
                  placeholder="e.g. 20210104050@aust.edu"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  autoComplete="email"
                />
                <span className="input-hint">Use your university/institutional email address</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="signup-id">Student ID *</label>
                  <input
                    id="signup-id"
                    type="text"
                    required
                    placeholder="e.g. 20210104050"
                    value={signupId}
                    onChange={(e) => setSignupId(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="signup-dept">Department *</label>
                  <select
                    id="signup-dept"
                    value={signupDept}
                    onChange={(e) => setSignupDept(e.target.value)}
                    required
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d.code} value={d.code}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="signup-name">Full Name (Optional)</label>
                <input
                  id="signup-name"
                  type="text"
                  placeholder="e.g. Fahim Morshed"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="signup-password">Password *</label>
                <input
                  id="signup-password"
                  type="password"
                  required
                  minLength={4}
                  placeholder="At least 4 characters"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                className="btn-auth-primary"
                disabled={loading}
              >
                <span>{loading ? 'Creating account...' : 'Create Account & Continue'}</span>
                <ArrowRight size={16} />
              </button>

              <div className="switch-mode-hint">
                Already have an account?{' '}
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => { setMode('login'); setError(''); }}
                >
                  Sign in here
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
