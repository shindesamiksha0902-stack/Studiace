import { useState } from 'react';
import { useApp } from '../AppContext';
import HomePage    from '../pages/HomePage';
import NotesPage   from '../pages/NotesPage';
import BuddyPage   from '../pages/BuddyPage';
import ExamPage    from '../pages/ExamPage';
import QPPage      from '../pages/QPPage';
import GapsPage    from '../pages/GapsPage';
import BurnoutPage from '../pages/BurnoutPage';

const PAGES = [
  { id: 'home',    label: 'Home',           icon: '🏠' },
  { id: 'notes',   label: 'Notes',          icon: '📁', section: 'Workspace' },
  { id: 'buddy',   label: 'Study Buddy',    icon: '🤖', section: 'Modules' },
  { id: 'exam',    label: 'Exam Strategy',  icon: '📋' },
  { id: 'qp',      label: 'Question Papers',icon: '📝' },
  { id: 'gaps',    label: 'Knowledge Gaps', icon: '📊' },
  { id: 'burnout', label: 'Burnout Check',  icon: '❤️' },
];

const PAGE_MAP = { home: HomePage, notes: NotesPage, buddy: BuddyPage, exam: ExamPage, qp: QPPage, gaps: GapsPage, burnout: BurnoutPage };

export default function AppShell() {
  const { user, logout } = useApp();
  const [active, setActive] = useState('home');
  const Page = PAGE_MAP[active] || HomePage;

  return (
    <div className="app-screen">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div className="s-logo">🎓</div>
            <span className="s-brand-name">Studiace</span>
          </div>
          <div className="user-chip">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <span className="user-name">{user?.name}</span>
          </div>
        </div>

        <nav className="nav-section">
          {PAGES.map((p, i) => (
            <div key={p.id}>
              {p.section && <div className="nav-label" style={{ marginTop: i > 0 ? 14 : 0 }}>{p.section}</div>}
              <button
                className={`nav-item ${active === p.id ? 'active' : ''}`}
                onClick={() => setActive(p.id)}
              >
                <span>{p.icon}</span> {p.label}
              </button>
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="nav-item" onClick={logout}>
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <span style={{ fontSize: 14, color: 'var(--text2)' }}>{PAGES.find(p => p.id === active)?.label}</span>
        </div>
        <div className="content">
          <Page onNav={setActive} />
        </div>
      </main>
    </div>
  );
}