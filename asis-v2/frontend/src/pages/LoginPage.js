// frontend/src/pages/LoginPage.js
import { useState } from 'react';
import { useApp } from '../AppContext';

export default function LoginPage() {
  const { login } = useApp();
  const [tab, setTab]         = useState('login');
  const [err, setErr]         = useState('');
  const [loading, setLoading] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPw, setLoginPw]       = useState('');

  // Signup form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [college, setCollege]     = useState('');
  const [year, setYear]           = useState('');
  const [signupPw, setSignupPw]   = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  // ── API call helper ──────────────────────────────────────────────────────────
  async function authCall(endpoint, body) {
    const res  = await fetch(`/api/auth/${endpoint}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong');
    return data;
  }

  // ── Login ────────────────────────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault();
    setErr('');
    if (!loginEmail.trim()) { setErr('Please enter your email'); return; }
    if (!loginPw)           { setErr('Please enter your password'); return; }

    setLoading(true);
    try {
      const { user } = await authCall('login', {
        email:    loginEmail.trim(),
        password: loginPw,
      });
      localStorage.setItem('msm_session', JSON.stringify(user));
      login(user);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Signup ───────────────────────────────────────────────────────────────────
  async function handleSignup(e) {
    e.preventDefault();
    setErr('');
    if (!firstName.trim())      { setErr('First name is required'); return; }
    if (!email.trim())          { setErr('Email is required'); return; }
    if (!signupPw)              { setErr('Password is required'); return; }
    if (signupPw.length < 6)   { setErr('Password must be at least 6 characters'); return; }
    if (signupPw !== confirmPw) { setErr('Passwords do not match'); return; }

    setLoading(true);
    try {
      const { user } = await authCall('signup', {
        firstName, lastName, email: email.trim(),
        college, year, password: signupPw,
      });
      localStorage.setItem('msm_session', JSON.stringify(user));
      login(user);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-left">
        <div className="brand">
          <div className="brand-logo">🎓</div>
          <div className="brand-name">ASIS</div>
          <div className="brand-sub">AI Student Intelligence System</div>
        </div>
        <div className="feature-pills">
          {[
            'Notion-style smart notes',
            'AI Study Buddy chat',
            'Exam strategy generator',
            'Question paper AI',
            'Knowledge gap finder',
            'Burnout checker',
          ].map(f => (
            <div key={f} className="pill">
              <div className="pill-dot" />{f}
            </div>
          ))}
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-box">

          {/* Tab switcher */}
          <div className="tab-row">
            <button
              className={`tab ${tab === 'login' ? 'active' : ''}`}
              onClick={() => { setTab('login'); setErr(''); }}
            >Sign In</button>
            <button
              className={`tab ${tab === 'signup' ? 'active' : ''}`}
              onClick={() => { setTab('signup'); setErr(''); }}
            >Create Account</button>
          </div>

          {/* Error message */}
          {err && <div className="error-msg">{err}</div>}

          {/* ── LOGIN FORM ── */}
          {tab === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="field">
                <label>Email Address</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="riya@college.edu"
                  autoFocus
                />
              </div>
              <div className="field">
                <label>Password</label>
                <input
                  type="password"
                  value={loginPw}
                  onChange={e => setLoginPw(e.target.value)}
                  placeholder="Your password"
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In →'}
              </button>
              <div style={{ textAlign:'center', marginTop:12, fontSize:13, color:'var(--text3)' }}>
                No account?{' '}
                <span
                  style={{ color:'var(--accent)', cursor:'pointer' }}
                  onClick={() => { setTab('signup'); setErr(''); }}
                >Create one free →</span>
              </div>
            </form>

          ) : (

            /* ── SIGNUP FORM ── */
            <form onSubmit={handleSignup}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div className="field">
                  <label>First Name *</label>
                  <input
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Riya"
                    autoFocus
                  />
                </div>
                <div className="field">
                  <label>Last Name</label>
                  <input
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Sharma"
                  />
                </div>
              </div>

              <div className="field">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="riya@college.edu"
                />
              </div>

              <div className="field">
                <label>College / Institution</label>
                <input
                  value={college}
                  onChange={e => setCollege(e.target.value)}
                  placeholder="e.g. IIT Bombay"
                />
              </div>

              <div className="field">
                <label>Year of Study</label>
                <select
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  style={{
                    width:'100%', background:'var(--bg2)',
                    border:'1px solid var(--border)',
                    borderRadius:'var(--radius-sm)',
                    padding:'10px 14px',
                    fontFamily:'DM Sans,sans-serif',
                    fontSize:14, color:'var(--text)', outline:'none',
                  }}
                >
                  <option value="">Select year</option>
                  {['1st Year','2nd Year','3rd Year','4th Year','Postgraduate','PhD'].map(y =>
                    <option key={y}>{y}</option>
                  )}
                </select>
              </div>

              <div className="field">
                <label>Password * (min 6 characters)</label>
                <input
                  type="password"
                  value={signupPw}
                  onChange={e => setSignupPw(e.target.value)}
                  placeholder="Create a strong password"
                />
              </div>

              <div className="field">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  placeholder="Repeat your password"
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account →'}
              </button>

              <div style={{ textAlign:'center', marginTop:12, fontSize:13, color:'var(--text3)' }}>
                Already have an account?{' '}
                <span
                  style={{ color:'var(--accent)', cursor:'pointer' }}
                  onClick={() => { setTab('login'); setErr(''); }}
                >Sign in →</span>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}