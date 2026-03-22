import { useState } from 'react';
import { useApp } from '../AppContext';

export default function LoginPage() {
  const { login } = useApp();

  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({
    studentId: '',
    password: '',
    firstName: '',
    email: ''
  });
  const [err, setErr] = useState('');

  const set = (k) => (e) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  // 🔐 LOGIN FIXED
  function handleLogin(e) {
    e.preventDefault();

    if (!form.studentId || !form.password) {
      setErr('Fill in Student ID and password');
      return;
    }

    // Demo credentials (you can change these)
    const VALID_ID = "admin";
    const VALID_PASSWORD = "1234";

    if (form.studentId === VALID_ID && form.password === VALID_PASSWORD) {
      login({ id: form.studentId, name: form.studentId });
      setErr('');
    } else {
      setErr('Invalid Student ID or password');
    }
  }

  // 📝 SIGNUP (simple validation)
  function handleSignup(e) {
    e.preventDefault();

    if (!form.firstName || !form.email || !form.password) {
      setErr('Fill in all required fields');
      return;
    }

    if (form.password.length < 4) {
      setErr('Password must be at least 4 characters');
      return;
    }

    // Fake signup (no database yet)
    login({ id: form.email, name: form.firstName });
    setErr('');
  }

  return (
    <div className="auth-screen">
      <div className="auth-left">
        <div className="brand">
          <div className="brand-logo">🎓</div>
          <div className="brand-name">Studiace</div>
          <div className="brand-sub">Your AI Study Companion</div>
        </div>

        <div className="feature-pills">
          {[
            'Notion-style smart notes',
            'AI Study Buddy chat',
            'Exam strategy generator',
            'Question paper AI',
            'Knowledge gap finder',
            'Burnout checker'
          ].map((f) => (
            <div key={f} className="pill">
              <div className="pill-dot" /> {f}
            </div>
          ))}
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-box">
          <div className="tab-row">
            <button
              className={`tab ${tab === 'login' ? 'active' : ''}`}
              onClick={() => setTab('login')}
            >
              Sign In
            </button>

            <button
              className={`tab ${tab === 'signup' ? 'active' : ''}`}
              onClick={() => setTab('signup')}
            >
              Create Account
            </button>
          </div>

          {err && <div className="error-msg">{err}</div>}

          {tab === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="field">
                <label>Student ID</label>
                <input
                  value={form.studentId}
                  onChange={set('studentId')}
                  placeholder="e.g. STU2024001"
                />
              </div>

              <div className="field">
                <label>Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Your password"
                />
              </div>

              <button type="submit" className="btn-primary">
                Sign In →
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup}>
              <div className="field">
                <label>First Name</label>
                <input
                  value={form.firstName}
                  onChange={set('firstName')}
                  placeholder="Riya"
                />
              </div>

              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="riya@college.edu"
                />
              </div>

              <div className="field">
                <label>Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Create password"
                />
              </div>

              <button type="submit" className="btn-primary">
                Create Account →
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}