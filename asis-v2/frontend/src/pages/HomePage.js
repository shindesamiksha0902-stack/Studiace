import { useApp } from '../AppContext';

const MODULES = [
  { id: 'notes',   icon: '📁', title: 'Notes',           desc: 'Folders, subjects & rich text notes' },
  { id: 'buddy',   icon: '🤖', title: 'Study Buddy',     desc: 'AI chat that knows your notes' },
  { id: 'exam',    icon: '📋', title: 'Exam Strategy',   desc: 'AI study plan from your notes' },
  { id: 'qp',      icon: '📝', title: 'Question Papers', desc: 'Generate papers & get graded' },
  { id: 'gaps',    icon: '📊', title: 'Knowledge Gaps',  desc: 'Track marks & find weak areas' },
  { id: 'burnout', icon: '❤️', title: 'Burnout Check',   desc: 'Daily check-in & recovery plan' },
];

export default function HomePage({ onNav }) {
  const { user, stats } = useApp();
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <div className="welcome-banner">
        <div>
          <h2>{greet}, {user?.name?.split(' ')[0]} 👋</h2>
          <p>Your AI study companion is ready.</p>
        </div>
        <span style={{ fontSize: 44, opacity: 0.4 }}>🎓</span>
      </div>

      <div className="module-cards-grid">
        {MODULES.map(m => (
          <div key={m.id} className="mod-card" onClick={() => onNav(m.id)}>
            <div className="mod-card-icon">{m.icon}</div>
            <div className="mod-card-body">
              <div className="mod-card-title">{m.title}</div>
              <div className="mod-card-desc">{m.desc}</div>
            </div>
            <span className="mod-card-arrow">→</span>
          </div>
        ))}
      </div>

      <div className="stats-row">
        {[['Folders', stats.folders, 'var(--accent)'], ['Subjects', stats.subjects, 'var(--blue)'], ['Notes', stats.notes, 'var(--amber)']].map(([l, v, c]) => (
          <div key={l} className="stat-box">
            <div style={{ fontSize: 22, fontWeight: 600, color: c }}>{v}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
