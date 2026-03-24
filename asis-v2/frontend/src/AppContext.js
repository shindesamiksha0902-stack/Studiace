import { createContext, useContext, useState, useEffect } from 'react';
import { Burnout } from './api';

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('msm_session');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  // Notes stay in localStorage (no auth backend needed for demo)
  const [folders, setFolders] = useState(() =>
    JSON.parse(localStorage.getItem('asis_folders') || '[]')
  );

  const [marks, setMarks] = useState(() =>
    JSON.parse(localStorage.getItem('asis_marks') || '[]')
  );
  const [burnoutHistory, setBurnout]    = useState([]);

  // Persist folders
  useEffect(() => {
    localStorage.setItem('asis_folders', JSON.stringify(folders));
  }, [folders]);

  // Load server data when user logs in
  useEffect(() => {
    if (!user) return;
    // marks loaded from localStorage directly
    Burnout.getHistory(user.id).then(setBurnout).catch(() => {});
  }, [user]);

  // ── Notes helpers ────────────────────────────────────────────────────────────
  const addFolder = (name, emoji) => {
    const f = { id: Date.now().toString(), name, emoji: emoji || '📁', subjects: [] };
    setFolders(p => [...p, f]);
    return f;
  };

  const deleteFolder = id => setFolders(p => p.filter(f => f.id !== id));

  const deleteSubject = (folderId, subjectId) =>
    setFolders(p => p.map(f =>
      f.id !== folderId ? f : { ...f, subjects: f.subjects.filter(s => s.id !== subjectId) }
    ));

  const deleteNote = (folderId, subjectId, noteId) =>
    setFolders(p => p.map(f =>
      f.id !== folderId ? f : {
        ...f, subjects: f.subjects.map(s =>
          s.id !== subjectId ? s : { ...s, notes: s.notes.filter(n => n.id !== noteId) }
        )
      }
    ));

  const renameFolder = (id, name) =>
    setFolders(p => p.map(f => f.id === id ? { ...f, name } : f));

  const addSubject = (folderId, name, color) => {
    const s = { id: Date.now().toString(), name, color: color || '#6ba3ff', notes: [] };
    setFolders(p => p.map(f => f.id === folderId ? { ...f, subjects: [...f.subjects, s] } : f));
    return s;
  };

  const addNote = (folderId, subjectId) => {
    const n = { id: Date.now().toString(), title: '', content: '', created: new Date().toLocaleDateString() };
    setFolders(p => p.map(f =>
      f.id !== folderId ? f : {
        ...f, subjects: f.subjects.map(s =>
          s.id !== subjectId ? s : { ...s, notes: [...s.notes, n] }
        )
      }
    ));
    return n;
  };

  const saveNote = (folderId, subjectId, noteId, title, content) =>
    setFolders(p => p.map(f =>
      f.id !== folderId ? f : {
        ...f, subjects: f.subjects.map(s =>
          s.id !== subjectId ? s : {
            ...s, notes: s.notes.map(n =>
              n.id !== noteId ? n : { ...n, title, content }
            )
          }
        )
      }
    ));

  // ── Marks helpers ─────────────────────────────────────────────────────────────
  const addMark = (subject, exam, got, total) => {
    const entry = {
      id: Date.now().toString(),
      subject, exam: exam || 'Test',
      got: +got, total: +total,
      pct: Math.round((+got / +total) * 100),
      date: new Date().toLocaleDateString()
    };
    setMarks(p => {
      const updated = [...p, entry];
      localStorage.setItem('asis_marks', JSON.stringify(updated));
      return updated;
    });
  };

  const removeMark = (id) => {
    setMarks(p => {
      const updated = p.filter(m => m.id !== id);
      localStorage.setItem('asis_marks', JSON.stringify(updated));
      return updated;
    });
  };

  // ── Burnout helpers ───────────────────────────────────────────────────────────
  const saveCheckin = async data => {
    await Burnout.saveCheckin(user.id, data);
    const today = new Date().toLocaleDateString('en-CA');
    setBurnout(p => [...p.filter(e => e.date !== today), { ...data, date: today }]);
  };

  // ── Quick stats ───────────────────────────────────────────────────────────────
  const stats = {
    folders:  folders.length,
    subjects: folders.reduce((a, f) => a + f.subjects.length, 0),
    notes:    folders.reduce((a, f) => a + f.subjects.reduce((b, s) => b + s.notes.length, 0), 0),
  };

  const login  = u  => setUser(u);
  const logout = () => {
    localStorage.removeItem('msm_session');
    setUser(null); setMarks([]); setBurnout([]);
  };

  return (
    <Ctx.Provider value={{
      user, login, logout,
      folders, addFolder, deleteFolder, deleteSubject, deleteNote, renameFolder, addSubject, addNote, saveNote,
      marks, addMark, removeMark,
      burnoutHistory, saveCheckin,
      stats,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useApp = () => useContext(Ctx);