import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="login-container">
      {/* Left Panel */}
      <div className="login-left">
        <div className="login-branding">
          <div className="login-logo-mark">S</div>
          <div>
            <div className="login-brand-title">SmartPrinter</div>
            <div className="login-brand-sub">Partner & CRM Portal</div>
          </div>
        </div>

        <div className="login-illustration">
          <div className="login-glass-card">
            <div className="login-glass-title">Welcome Back</div>
            <p className="login-glass-text">
              Manage your college referrals, track installations, and monitor your sales pipeline — all in one place.
            </p>
          </div>
        </div>

        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
          © 2024 SmartPrinter. All rights reserved.
        </div>
      </div>

      {/* Right Panel */}
      <div className="login-right">
        <div className="login-form-container">
          <h2 className="login-form-title">Sign in to your account</h2>
          <p className="login-form-sub">Enter your credentials to access the CRM dashboard</p>

          {error && <div className="login-error" style={{ marginBottom: 20 }}>{error}</div>}

          <form className="login-form" onSubmit={handleLogin}>
            <div className="login-field">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="admin@smartprinter.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="login-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Password</label>
                <span className="login-forgot">Forgot password?</span>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="login-checkbox-wrap">
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">Remember me for 30 days</label>
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div className="login-footer">
            Want to register a student?{' '}
            <a onClick={() => navigate('/register')} style={{ color: 'var(--red)', fontWeight: 600, cursor: 'pointer' }}>
              Open registration form
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
