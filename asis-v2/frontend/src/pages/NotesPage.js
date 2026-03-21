import { useState, useRef } from 'react';
import { useApp } from '../AppContext';

const EMOJIS = ['📁','📚','🎓','🔬','📐','🧪','💡','✏️','🖥️','🎨','🌍','📊'];
const COLORS  = ['#6ba3ff','#c8f06b','#ffb347','#ff6b6b','#cc77ff','#4dd9ac'];

export default function NotesPage() {
  const { folders, addFolder, deleteFolder, deleteSubject, deleteNote, addSubject, addNote, saveNote } = useApp();
  const [view, setView]       = useState('folders');
  const [folder, setFolder]   = useState(null);
  const [subject, setSubject] = useState(null);
  const [note, setNote]       = useState(null);
  const [title, setTitle]     = useState('');
  const [status, setStatus]   = useState('Saved');
  const [modal, setModal]     = useState(null);
  const [mName, setMName]     = useState('');
  const [mEmoji, setMEmoji]   = useState('📁');
  const [mColor, setMColor]   = useState(COLORS[0]);
  const saveTimer = useRef(null);

  const liveFolder  = folders.find(f => f.id === folder?.id);
  const liveSubject = liveFolder?.subjects?.find(s => s.id === subject?.id);

  function openNote(n) {
    setNote(n);
    setTitle(n.title || '');
    setTimeout(() => {
      const el = document.getElementById('editor-body');
      if (el) el.innerHTML = n.content || '';
    }, 10);
    setView('editor');
  }

  function autoSave(newTitle) {
    setStatus('Saving...');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const content = document.getElementById('editor-body')?.innerHTML || '';
      saveNote(folder.id, subject.id, note.id, newTitle ?? title, content);
      setStatus('Saved');
    }, 800);
  }

  function handleAddFolder() {
    if (!mName.trim()) return;
    addFolder(mName.trim(), mEmoji);
    setModal(null); setMName(''); setMEmoji('📁');
  }

  function handleAddSubject() {
    if (!mName.trim()) return;
    addSubject(folder.id, mName.trim(), mColor);
    setModal(null); setMName(''); setMColor(COLORS[0]);
  }

  function handleAddNote() {
    const n = addNote(folder.id, subject.id);
    openNote(n);
  }

  // FOLDERS — only folders can be deleted
  if (view === 'folders') return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h2 className="page-title">📁 Notes</h2>
        <button className="new-btn" onClick={() => setModal('folder')}>+ New Folder</button>
      </div>
      {folders.length === 0
        ? <Empty icon="📂" title="No folders yet" sub='Click "+ New Folder" to start' />
        : <div className="folder-grid">
            {folders.map(f => (
              <div key={f.id} className="folder-card" onClick={() => { setFolder(f); setView('subjects'); }}>
                {/* Delete button — folders only */}
                <button className="folder-menu-btn" onClick={e => {
                  e.stopPropagation();
                  if (window.confirm(`Delete folder "${f.name}" and all its contents?`)) deleteFolder(f.id);
                }}>×</button>
                <span className="folder-icon">{f.emoji}</span>
                <div className="folder-name">{f.name}</div>
                <div className="folder-meta">{f.subjects.length} subject{f.subjects.length !== 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>
      }
      {modal === 'folder' && (
        <Modal title="New Folder" onClose={() => setModal(null)} onConfirm={handleAddFolder} label="Create">
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
            {EMOJIS.map(e => (
              <div key={e} onClick={() => setMEmoji(e)} style={{ width:36, height:36, borderRadius:8, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${mEmoji===e?'var(--accent)':'var(--border)'}`, background: mEmoji===e?'var(--accent-dim)':'var(--bg3)' }}>{e}</div>
            ))}
          </div>
          <input className="modal-input" value={mName} onChange={e => setMName(e.target.value)} placeholder="Folder name" autoFocus onKeyDown={e => e.key==='Enter' && handleAddFolder()} />
        </Modal>
      )}
    </div>
  );

  // SUBJECTS — no delete button
  if (view === 'subjects') return (
    <div>
      <button className="back-btn" onClick={() => setView('folders')}>← All Folders</button>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h2 className="page-title">{liveFolder?.emoji} {liveFolder?.name}</h2>
        <button className="new-btn" onClick={() => setModal('subject')}>+ Subject</button>
      </div>
      {!liveFolder?.subjects?.length
        ? <Empty icon="📒" title="No subjects yet" sub='Click "+ Subject" to add one' />
        : <div className="subject-grid">
            {liveFolder.subjects.map(s => (
              <div key={s.id} className="subject-card" onClick={() => { setSubject(s); setView('notes'); }}>
                <div className="subject-dot" style={{ background: s.color }} />
                <div className="subject-info">
                  <div className="subject-name">{s.name}</div>
                  <div className="subject-pages">{s.notes?.length || 0} note{s.notes?.length !== 1 ? 's' : ''}</div>
                </div>
                <button onClick={e => {
                  e.stopPropagation();
                  if (window.confirm(`Delete subject "${s.name}" and all its notes?`)) deleteSubject(liveFolder.id, s.id);
                }} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:16, padding:'2px 6px', flexShrink:0 }}>×</button>
              </div>
            ))}
          </div>
      }
      {modal === 'subject' && (
        <Modal title="Add Subject" onClose={() => setModal(null)} onConfirm={handleAddSubject} label="Add">
          <input className="modal-input" value={mName} onChange={e => setMName(e.target.value)} placeholder="Subject name" autoFocus onKeyDown={e => e.key==='Enter' && handleAddSubject()} />
          <div style={{ display:'flex', gap:8, marginTop:6 }}>
            {COLORS.map(c => (<div key={c} onClick={() => setMColor(c)} style={{ width:24, height:24, borderRadius:'50%', background:c, cursor:'pointer', border:`2px solid ${mColor===c?'var(--text)':'transparent'}` }} />))}
          </div>
        </Modal>
      )}
    </div>
  );

  // NOTES LIST — no delete button
  if (view === 'notes') return (
    <div>
      <button className="back-btn" onClick={() => setView('subjects')}>← {liveFolder?.name}</button>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h2 className="page-title">{liveSubject?.name}</h2>
          <div style={{ fontSize:13, color:'var(--text2)' }}>{liveSubject?.notes?.length || 0} notes</div>
        </div>
        <button className="new-btn" onClick={handleAddNote}>+ New Note</button>
      </div>
      {!liveSubject?.notes?.length
        ? <Empty icon="📝" title="No notes yet" sub='Click "+ New Note" to write your first note' />
        : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {liveSubject.notes.map(n => (
              <div key={n.id} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'14px 18px', display:'flex', alignItems:'center', gap:14, transition:'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor='var(--border2)'}
                onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
                <div onClick={() => openNote(n)} style={{ display:'flex', alignItems:'center', gap:14, flex:1, cursor:'pointer', minWidth:0 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:'var(--bg3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>📄</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:500, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.title || 'Untitled note'}</div>
                    <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{n.content ? n.content.replace(/<[^>]+>/g,'').substring(0,60)+'...' : 'Empty note'}</div>
                    <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{n.created}</div>
                  </div>
                  <span style={{ color:'var(--text3)', fontSize:13 }}>→</span>
                </div>
                <button onClick={e => {
                  e.stopPropagation();
                  if (window.confirm(`Delete note "${n.title || 'Untitled'}"?`)) {
                    deleteNote(liveFolder.id, liveSubject.id, n.id);
                  }
                }} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:18, padding:'2px 6px', flexShrink:0 }}>×</button>
              </div>
            ))}
          </div>
      }
    </div>
  );

  // EDITOR — no delete button
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
        <button className="back-btn" style={{ marginBottom:0 }} onClick={() => setView('notes')}>← {liveSubject?.name}</button>
        <button className="new-btn" style={{ fontSize:12, padding:'4px 10px', marginLeft:'auto' }} onClick={handleAddNote}>+ New Note</button>
      </div>
      <input className="editor-title-input" value={title} placeholder="Untitled note..." onChange={e => { setTitle(e.target.value); autoSave(e.target.value); }} />
      <div style={{ display:'flex', gap:12, fontSize:12, color:'var(--text3)', marginBottom:12 }}>
        <span>{note?.created}</span>
        <span style={{ color:'var(--accent)' }}>{status}</span>
      </div>
      <div className="editor-toolbar">
        {[['B','bold'],['I','italic'],['U','underline']].map(([l,c]) => (
          <button key={c} className="tool-btn" onClick={() => { document.execCommand(c); document.getElementById('editor-body').focus(); }}>
            <span style={c==='bold'?{fontWeight:700}:c==='italic'?{fontStyle:'italic'}:{textDecoration:'underline'}}>{l}</span>
          </button>
        ))}
        <div className="tool-sep" />
        <button className="tool-btn" onClick={() => document.execCommand('insertUnorderedList')}>•≡</button>
        <button className="tool-btn" onClick={() => document.execCommand('insertOrderedList')}>1≡</button>
        <div className="tool-sep" />
        <button className="tool-btn" onClick={() => document.execCommand('undo')}>↩</button>
        <button className="tool-btn" onClick={() => document.execCommand('redo')}>↪</button>
      </div>
      <div id="editor-body" className="editor-body" contentEditable suppressContentEditableWarning onInput={() => autoSave(null)} style={{ minHeight:300, outline:'none', flex:1 }} />
    </div>
  );
}

function Empty({ icon, title, sub }) {
  return (
    <div className="empty-state">
      <div style={{ fontSize:48, marginBottom:14, opacity:0.4 }}>{icon}</div>
      <div style={{ fontSize:16, fontWeight:500, color:'var(--text2)', marginBottom:6 }}>{title}</div>
      <div style={{ fontSize:13, color:'var(--text3)' }}>{sub}</div>
    </div>
  );
}

function Modal({ title, onClose, onConfirm, label, children }) {
  return (
    <div className="modal-overlay open" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{title}</div>
        {children}
        <div className="modal-actions">
          <button className="modal-cancel" onClick={onClose}>Cancel</button>
          <button className="modal-confirm" onClick={onConfirm}>{label}</button>
        </div>
      </div>
    </div>
  );
}