import { useState } from 'react';
import { useApp } from '../AppContext';

export default function LoginPage() {
  const { login } = useApp();
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ studentId: '', password: '', firstName: '', email: '' });
  const [err, setErr] = useState('');

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  function handleLogin(e) {
    e.preventDefault();
    if (!form.studentId || !form.password) { setErr('Fill in Student ID and password'); return; }
    // Demo: no real auth — just log in with whatever is typed
    login({ id: form.studentId, name: form.studentId });
  }

  async function handleLogin(e) {
  e.preventDefault();

  if (!form.studentId || !form.password) {
    setErr('Fill in Student ID and password');
    return;
  }

  try {
    const res = await fetch('https://studiace-3.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: form.studentId,
        password: form.password
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }

    login(data.user); // ✅ now only logs in if backend says OK

  } catch (err) {
    setErr(err.message);
  }
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
          {['Notion-style smart notes', 'AI Study Buddy chat', 'Exam strategy generator', 'Question paper AI', 'Knowledge gap finder', 'Burnout checker'].map(f => (
            <div key={f} className="pill"><div className="pill-dot" />  {f}</div>
          ))}
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-box">
          <div className="tab-row">
            <button className={`tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Sign In</button>
            <button className={`tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => setTab('signup')}>Create Account</button>
          </div>
          {err && <div className="error-msg">{err}</div>}

          {tab === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="field"><label>Student ID</label><input value={form.studentId} onChange={set('studentId')} placeholder="e.g. STU2024001" /></div>
              <div className="field"><label>Password</label><input type="password" value={form.password} onChange={set('password')} placeholder="Your password" /></div>
              <button type="submit" className="btn-primary">Sign In →</button>
            </form>
          ) : (
            <form onSubmit={handleSignup}>
              <div className="field"><label>First Name</label><input value={form.firstName} onChange={set('firstName')} placeholder="Riya" /></div>
              <div className="field"><label>Email</label><input type="email" value={form.email} onChange={set('email')} placeholder="riya@college.edu" /></div>
              <div className="field"><label>Password</label><input type="password" value={form.password} onChange={set('password')} placeholder="Create password" /></div>
              <button type="submit" className="btn-primary">Create Account →</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}