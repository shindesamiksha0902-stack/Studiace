import { useState } from 'react';
import { useApp } from '../AppContext';
import { chatAI, analyzeGaps, burnoutTips, examStrategy, generateQP, checkAnswers } from '../api';

// ─── Shared Spinner ───────────────────────────────────────────────────────────
function Spinner({ text }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'50px 20px', gap:14 }}>
      <div className="gen-spinner" />
      <div style={{ fontSize:14, color:'var(--text2)' }}>{text || 'Thinking...'}</div>
    </div>
  );
}

// ─── ExamPage ─────────────────────────────────────────────────────────────────
export function ExamPage() {
  const { folders } = useApp();
  const [step, setStep]       = useState(1);
  const [selected, setSelected] = useState([]);
  const [opts, setOpts]       = useState({ examName:'', examDate:'', hoursPerDay:'4', difficulty:'medium', syllabusText:'' });
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState('');
  const [error, setError]     = useState('');

  const set = k => e => setOpts(p => ({ ...p, [k]: e.target.value }));
  const toggle = i => setSelected(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);

  async function generate() {
    setLoading(true); setError('');
    const steps = ['Reading your notes...','Detecting knowledge gaps...','Building study plan...','Finalizing schedule...'];
    let si = 0; setLoadStep(steps[0]);
    const iv = setInterval(() => { si=(si+1)%steps.length; setLoadStep(steps[si]); }, 1400);
    try {
      const selectedFolders = selected.length ? selected.map(i => folders[i]) : folders;
      const data = await examStrategy(selectedFolders, opts);

      // Sanitize — AI sometimes returns undefined for these fields
      const daysLeft = data.daysLeft && data.daysLeft !== 'undefined'
        ? data.daysLeft
        : opts.examDate ? Math.max(1, Math.ceil((new Date(opts.examDate)-new Date())/86400000)) : 14;
      const hoursPerDay = parseInt(opts.hoursPerDay) || 4;

      data.examName   = data.examName   || opts.examName   || 'Upcoming Exam';
      data.daysLeft   = daysLeft;
      data.totalHours = data.totalHours && data.totalHours !== 'undefined' ? data.totalHours : daysLeft * hoursPerDay;
      data.subjects   = data.subjects   || [];
      data.weekPlan   = data.weekPlan   || [];
      data.strengths  = data.strengths  || [];
      data.weaknesses = data.weaknesses || [];
      data.tips       = data.tips       || [];
      data.insight    = data.insight    || 'Strategy generated based on your notes.';

      setResult(data); setStep(3);
    } catch(e) {
      setError('Error: ' + e.message + '. Backend request failed.');
    } finally { clearInterval(iv); setLoading(false); }
  }

  // STEP 1 — Select folders
  if (step === 1) return (
    <div style={{ maxWidth:720 }}>
      <div className="exam-step-label">Step 1 of 2</div>
      <h2 className="page-title" style={{ fontSize:28, marginBottom:6 }}>Select folders</h2>
      <p style={{ fontSize:14, color:'var(--text2)', marginBottom:20 }}>Choose which folders to build your exam strategy from. Skip to use all folders.</p>

      {!folders.length
        ? <p style={{ color:'var(--text3)', padding:'20px 0' }}>No folders yet — add notes first.</p>
        : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10, marginBottom:20 }}>
            {folders.map((f,i) => {
              const sel = selected.includes(i);
              const noteCount = (f.subjects||[]).reduce((a,s) => a+(s.notes||[]).length, 0);
              return (
                <div key={f.id} onClick={() => toggle(i)} style={{ background:sel?'var(--accent-dim)':'var(--bg2)', border:`1px solid ${sel?'var(--accent)':'var(--border)'}`, borderRadius:'var(--radius)', padding:14, cursor:'pointer', position:'relative', transition:'all 0.15s' }}>
                  {sel && <div style={{ position:'absolute', top:8, right:8, width:18, height:18, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#1a1a1a' }}>✓</div>}
                  <div style={{ fontSize:24, marginBottom:8 }}>{f.emoji}</div>
                  <div style={{ fontSize:13, fontWeight:500 }}>{f.name}</div>
                  <div style={{ fontSize:11, color:'var(--text2)', marginTop:2 }}>{f.subjects.length} subjects · {noteCount} notes</div>
                </div>
              );
            })}
          </div>
      }
      <button className="exam-continue-btn" onClick={() => setStep(2)}>
        {selected.length ? `Continue with ${selected.length} folder${selected.length>1?'s':''} →` : 'Continue with all folders →'}
      </button>
    </div>
  );

  // STEP 2 — Exam details
  if (step === 2) return (
    <div style={{ maxWidth:720 }}>
      <div className="exam-step-label">Step 2 of 2</div>
      <h2 className="page-title" style={{ fontSize:28, marginBottom:6 }}>Exam details</h2>
      <p style={{ fontSize:14, color:'var(--text2)', marginBottom:20 }}>Tell the AI about your exam so it can build a realistic plan.</p>

      {error && <div style={{ background:'rgba(255,107,107,0.1)', border:'1px solid rgba(255,107,107,0.3)', borderRadius:'var(--radius-sm)', padding:'10px 14px', fontSize:13, color:'var(--red)', marginBottom:14 }}>{error}</div>}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
        <div>
          <div className="marks-label">Exam name</div>
          <input className="marks-input" value={opts.examName} onChange={set('examName')} placeholder="End Semester Exam" />
        </div>
        <div>
          <div className="marks-label">Exam date</div>
          <input className="marks-input" type="date" value={opts.examDate} onChange={set('examDate')} />
        </div>
        <div>
          <div className="marks-label">Hours per day</div>
          <select className="marks-input" value={opts.hoursPerDay} onChange={set('hoursPerDay')}>
            {['2','3','4','6','8'].map(h => <option key={h} value={h}>{h} hours/day</option>)}
          </select>
        </div>
        <div>
          <div className="marks-label">Difficulty</div>
          <select className="marks-input" value={opts.difficulty} onChange={set('difficulty')}>
            <option value="easy">Easy — I know most topics</option>
            <option value="medium">Medium — Some gaps exist</option>
            <option value="hard">Hard — Starting from scratch</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom:16 }}>
        <div className="marks-label">Syllabus (optional — paste for better results)</div>
        <textarea className="qp-textarea" style={{ minHeight:90, marginTop:4 }} value={opts.syllabusText}
          onChange={set('syllabusText')} placeholder="Paste your syllabus topics here... e.g. Unit 1: Newton's Laws, Unit 2: Thermodynamics..." />
      </div>

      {loading ? <Spinner text={loadStep} /> : (
        <div style={{ display:'flex', gap:10 }}>
          <button className="exam-back-btn" onClick={() => setStep(1)}>← Back</button>
          <button className="exam-continue-btn" style={{ flex:1 }} onClick={generate}>Generate Strategy →</button>
        </div>
      )}
    </div>
  );

  // STEP 3 — Results
  if (!result) return null;
  return (
    <div style={{ maxWidth:760 }}>
      <button className="back-btn" onClick={() => { setStep(1); setResult(null); setSelected([]); }}>← New Strategy</button>

      <h2 className="page-title" style={{ fontSize:26, marginBottom:8 }}>📋 {result.examName}</h2>
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        {[
          `📅 ${result.daysLeft} days left`,
          `⏱ ${result.totalHours}h total`,
          `📚 ${(result.subjects||[]).length} subjects`
        ].map(t => (
          <span key={t} style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:999, padding:'4px 12px', fontSize:12, color:'var(--text2)' }}>{t}</span>
        ))}
      </div>

      <div className="ai-insight-box" style={{ marginBottom:16 }}>
        <span style={{ fontSize:20 }}>🧠</span>
        <span style={{ fontSize:13, color:'var(--text)', marginLeft:10, lineHeight:1.6 }}>
          <strong>AI Analysis: </strong>{result.insight}
        </span>
      </div>

      {/* Strengths & Weaknesses */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
        {[
          ['Your Strengths', result.strengths, 'var(--accent)', '✓'],
          ['Focus Areas', result.weaknesses, 'var(--red)', '!']
        ].map(([title, items, c, sym]) => (
          <div key={title} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:16 }}>
            <div className="marks-label">{title}</div>
            {(items||[]).length
              ? (items||[]).map(s => <div key={s} style={{ fontSize:13, color:'var(--text2)', marginBottom:6, display:'flex', gap:8 }}><span style={{ color:c, flexShrink:0 }}>{sym}</span>{s}</div>)
              : <div style={{ fontSize:12, color:'var(--text3)' }}>Add notes for better analysis</div>
            }
          </div>
        ))}
      </div>

      {/* Subjects table */}
      {(result.subjects||[]).length > 0 && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', overflow:'hidden', marginBottom:16 }}>
          <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text3)' }}>Subject Priorities</div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead><tr>{['Subject','Priority','Hours','Why'].map(h => <th key={h} style={{ textAlign:'left', padding:'8px 12px', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--text3)', borderBottom:'1px solid var(--border)' }}>{h}</th>)}</tr></thead>
            <tbody>
              {(result.subjects||[]).map(s => {
                const pc = s.priority==='high'?{bg:'rgba(255,107,107,0.15)',c:'var(--red)'}:s.priority==='low'?{bg:'rgba(200,240,107,0.15)',c:'var(--accent)'}:{bg:'rgba(255,179,71,0.15)',c:'var(--amber)'};
                return (
                  <tr key={s.name}>
                    <td style={{ padding:'10px 12px', borderBottom:'1px solid var(--border)', color:'var(--text)' }}><strong>{s.name}</strong><br/><span style={{ fontSize:11, color:'var(--text3)' }}>{s.folder}</span></td>
                    <td style={{ padding:'10px 12px', borderBottom:'1px solid var(--border)' }}><span style={{ background:pc.bg, color:pc.c, padding:'2px 10px', borderRadius:999, fontSize:11, fontWeight:600 }}>{s.priority}</span></td>
                    <td style={{ padding:'10px 12px', borderBottom:'1px solid var(--border)', color:'var(--text2)' }}>{s.hoursAllocated}h</td>
                    <td style={{ padding:'10px 12px', borderBottom:'1px solid var(--border)', fontSize:12, color:'var(--text3)' }}>{s.reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Day plan */}
      {(result.weekPlan||[]).slice(0,5).map(d => (
        <div key={d.day} style={{ marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'8px 8px 0 0', fontSize:13, fontWeight:500 }}>
            <span>📅 {d.day}</span>
            <span style={{ marginLeft:'auto', color:'var(--accent)', fontSize:12 }}>{d.focus}</span>
          </div>
          <div style={{ border:'1px solid var(--border)', borderTop:'none', borderRadius:'0 0 8px 8px' }}>
            {(d.tasks||[]).map((t,i) => (
              <div key={i} style={{ display:'flex', gap:12, padding:'10px 14px', borderBottom:'1px solid var(--border)', fontSize:13, color:'var(--text2)', alignItems:'center' }}>
                <span style={{ fontSize:11, color:'var(--text3)', minWidth:75, flexShrink:0 }}>{t.time}</span>
                <span style={{ flex:1 }}>{t.task}</span>
                <span style={{ fontSize:11, color:'var(--text3)' }}>{t.subject}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Tips */}
      {(result.tips||[]).length > 0 && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'16px 20px', marginBottom:24 }}>
          <div className="marks-label" style={{ marginBottom:10 }}>AI Study Tips</div>
          <ul style={{ paddingLeft:16 }}>
            {result.tips.map((t,i) => <li key={i} style={{ fontSize:13, color:'var(--text2)', marginBottom:8, lineHeight:1.5 }}>{t}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── QPPage ───────────────────────────────────────────────────────────────────
export function QPPage() {
  const { folders } = useApp();
  const [view, setView]           = useState('setup');
  const [opts, setOpts]           = useState({ qtype:'mixed', difficulty:'medium', count:'10', totalMarks:'100', syllabusText:'' });
  const [paper, setPaper]         = useState(null);
  const [answers, setAnswers]     = useState({});
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [loadMsg, setLoadMsg]     = useState('');
  const [error, setError]         = useState('');
  const [selectedNotes, setSelectedNotes] = useState({});  // key: "fi-si-ni" → note data
  const [expandedFolders, setExpandedFolders] = useState({});

  const set = k => e => setOpts(p => ({ ...p, [k]: e.target.value }));

  function toggleFolder(fi) {
    setExpandedFolders(p => ({ ...p, [fi]: !p[fi] }));
  }

  function toggleFolderSelect(fi) {
    const folder = folders[fi];
    const allKeys = [];
    (folder.subjects||[]).forEach((s,si) => (s.notes||[]).forEach((_,ni) => allKeys.push(`${fi}-${si}-${ni}`)));
    const allSelected = allKeys.every(k => selectedNotes[k]);
    const next = { ...selectedNotes };
    if (allSelected) {
      allKeys.forEach(k => delete next[k]);
    } else {
      (folder.subjects||[]).forEach((s,si) => (s.notes||[]).forEach((n,ni) => {
        next[`${fi}-${si}-${ni}`] = { subject: s.name, title: n.title||'Untitled', content: (n.content||'').replace(/<[^>]+>/g,'').substring(0,200) };
      }));
    }
    setSelectedNotes(next);
    setExpandedFolders(p => ({ ...p, [fi]: true }));
  }

  function toggleNoteSelect(fi, si, ni) {
    const key = `${fi}-${si}-${ni}`;
    const folder = folders[fi];
    const s = folder.subjects[si];
    const n = s.notes[ni];
    const next = { ...selectedNotes };
    if (next[key]) delete next[key];
    else next[key] = { subject: s.name, title: n.title||'Untitled', content: (n.content||'').replace(/<[^>]+>/g,'').substring(0,200) };
    setSelectedNotes(next);
  }

  function isFolderChecked(fi) {
    const folder = folders[fi];
    const allKeys = [];
    (folder.subjects||[]).forEach((s,si) => (s.notes||[]).forEach((_,ni) => allKeys.push(`${fi}-${si}-${ni}`)));
    if (!allKeys.length) return false;
    return allKeys.every(k => selectedNotes[k]);
  }

  function isFolderPartial(fi) {
    const folder = folders[fi];
    const allKeys = [];
    (folder.subjects||[]).forEach((s,si) => (s.notes||[]).forEach((_,ni) => allKeys.push(`${fi}-${si}-${ni}`)));
    const count = allKeys.filter(k => selectedNotes[k]).length;
    return count > 0 && count < allKeys.length;
  }

  const selectedCount = Object.keys(selectedNotes).length;

  async function generate() {
    setLoading(true); setError('');
    setLoadMsg('Generating your question paper...');
    const notesToUse = selectedCount > 0 ? Object.values(selectedNotes) : null;
    try {
      const data = await generateQP(folders, notesToUse, opts);
      if (!data.questions || !data.questions.length) throw new Error('No questions returned. Try again.');

      // Sanitize fields so paper header never shows blank
      data.title       = data.title       || 'Question Paper';
      data.subject     = data.subject     || 'General';
      data.timeMinutes = data.timeMinutes || 120;
      data.totalMarks  = data.totalMarks  || parseInt(opts.totalMarks) || 100;
      data.instructions = data.instructions || 'Attempt all questions.';

      // Ensure every question has a number
      data.questions = data.questions.map((q, i) => ({
        ...q,
        number: q.number || `Q${i + 1}`,
        marks:  q.marks  || Math.round(data.totalMarks / data.questions.length),
        options: q.options || [],
      }));

      setPaper(data); setView('paper');
    } catch(e) {
      setError('Error: ' + e.message);
    } finally { setLoading(false); }
  }

  async function check() {
    setLoading(true); setLoadMsg('Evaluating your answers...');
    setView('results');
    try { setResult(await checkAnswers(paper.questions, answers)); }
    catch(e) { setResult({ error: e.message }); }
    finally { setLoading(false); }
  }

  const gradeColor = p => p >= 75 ? 'var(--accent)' : p >= 50 ? 'var(--amber)' : 'var(--red)';
  const [showAnswers, setShowAnswers] = useState(false);

  // SETUP
  if (view === 'setup') return (
    <div style={{ maxWidth:700 }}>
      <div className="exam-step-label">Question Papers</div>
      <h2 className="page-title" style={{ fontSize:28, marginBottom:6 }}>Generate a question paper</h2>
      <p style={{ fontSize:14, color:'var(--text2)', marginBottom:20 }}>AI will create questions directly from your notes.</p>

      {error && <div style={{ background:'rgba(255,107,107,0.1)', border:'1px solid rgba(255,107,107,0.3)', borderRadius:'var(--radius-sm)', padding:'10px 14px', fontSize:13, color:'var(--red)', marginBottom:14 }}>{error}</div>}

      {/* Note selector */}
      <div className="marks-label" style={{ marginBottom:8 }}>
        Select notes to generate from
        <span style={{ marginLeft:8, color:'var(--text3)', fontWeight:400, textTransform:'none', letterSpacing:0 }}>
          {selectedCount > 0 ? `(${selectedCount} note${selectedCount>1?'s':''} selected)` : '(all notes will be used if none selected)'}
        </span>
      </div>

      {!folders.length
        ? <div style={{ padding:'14px 16px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', fontSize:13, color:'var(--text3)', marginBottom:16 }}>No folders yet — add notes first.</div>
        : <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:18 }}>
            {folders.map((f, fi) => {
              const totalNotes = (f.subjects||[]).reduce((a,s) => a+(s.notes||[]).length, 0);
              if (!totalNotes) return null;
              const checked = isFolderChecked(fi);
              const partial = isFolderPartial(fi);
              const expanded = expandedFolders[fi];
              return (
                <div key={f.id} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', overflow:'hidden' }}>
                  {/* Folder header */}
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', cursor:'pointer', userSelect:'none' }}
                    onClick={() => toggleFolder(fi)}>
                    {/* Folder checkbox */}
                    <div onClick={e => { e.stopPropagation(); toggleFolderSelect(fi); }} style={{ width:18, height:18, borderRadius:5, border:`1.5px solid ${checked||partial?'var(--accent)':'var(--border2)'}`, background:checked?'var(--accent)':partial?'var(--accent-dim)':'var(--bg3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s', cursor:'pointer' }}>
                      {checked && <span style={{ fontSize:10, color:'#1a1a1a', fontWeight:700 }}>✓</span>}
                      {partial && <span style={{ fontSize:10, color:'var(--accent)', fontWeight:700 }}>–</span>}
                    </div>
                    <span style={{ fontSize:18 }}>{f.emoji}</span>
                    <span style={{ fontSize:14, fontWeight:500, color:'var(--text)', flex:1 }}>{f.name}</span>
                    <span style={{ fontSize:11, color:'var(--text3)' }}>{totalNotes} notes</span>
                    <span style={{ fontSize:12, color:'var(--text3)', transform:expanded?'rotate(90deg)':'none', transition:'transform 0.2s', display:'inline-block' }}>▶</span>
                  </div>

                  {/* Notes list */}
                  {expanded && (
                    <div style={{ borderTop:'1px solid var(--border)', padding:'8px 12px' }}>
                      {(f.subjects||[]).map((s, si) => (
                        <div key={s.id}>
                          {s.notes?.length > 0 && (
                            <>
                              <div style={{ fontSize:11, fontWeight:600, color:'var(--text3)', letterSpacing:'0.05em', textTransform:'uppercase', padding:'6px 4px 3px' }}>{s.name}</div>
                              {s.notes.map((n, ni) => {
                                const key = `${fi}-${si}-${ni}`;
                                const sel = !!selectedNotes[key];
                                return (
                                  <div key={key} onClick={() => toggleNoteSelect(fi, si, ni)} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 8px', borderRadius:'var(--radius-sm)', cursor:'pointer', background:sel?'var(--accent-dim)':'transparent', transition:'background 0.12s' }}
                                    onMouseEnter={e => { if(!sel) e.currentTarget.style.background='var(--bg3)'; }}
                                    onMouseLeave={e => { if(!sel) e.currentTarget.style.background='transparent'; }}>
                                    <div style={{ width:15, height:15, borderRadius:4, border:`1.5px solid ${sel?'var(--accent)':'var(--border2)'}`, background:sel?'var(--accent)':'var(--bg3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, flexShrink:0, transition:'all 0.15s' }}>
                                      {sel && <span style={{ color:'#1a1a1a', fontWeight:700 }}>✓</span>}
                                    </div>
                                    <span style={{ fontSize:13, color:sel?'var(--text)':'var(--text2)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.title || 'Untitled note'}</span>
                                  </div>
                                );
                              })}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
      }

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:14 }}>
        {[
          ['Type','qtype',[['mixed','Mixed (MCQ + Theory)'],['mcq','MCQ Only'],['theory','Theory Only'],['short','Short Answer'],['truefalse','True / False']]],
          ['Difficulty','difficulty',[['easy','Easy'],['medium','Medium'],['hard','Hard']]],
          ['Questions','count',[['5','5 questions'],['10','10 questions'],['15','15 questions'],['20','20 questions']]],
        ].map(([l,k,os]) => (
          <div key={k}>
            <div className="marks-label">{l}</div>
            <select className="marks-input" value={opts[k]} onChange={set(k)}>
              {os.map(([v,lbl]) => <option key={v} value={v}>{lbl}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div style={{ marginBottom:14 }}>
        <div className="marks-label">Total Marks</div>
        <select className="marks-input" style={{ width:200 }} value={opts.totalMarks} onChange={set('totalMarks')}>
          {['25','50','100'].map(v => <option key={v} value={v}>{v} marks</option>)}
        </select>
      </div>

      <div style={{ marginBottom:16 }}>
        <div className="marks-label">Additional syllabus / topics (optional)</div>
        <textarea className="qp-textarea" style={{ minHeight:80, marginTop:4 }} value={opts.syllabusText}
          onChange={set('syllabusText')} placeholder="Paste extra syllabus topics or specific chapters you want questions from..." />
      </div>

      {loading ? <Spinner text={loadMsg} />
        : <button className="exam-continue-btn" style={{ width:'100%', padding:13, fontSize:15 }} onClick={generate}>✨ Generate Question Paper</button>
      }
    </div>
  );

  // PAPER VIEW
  if (view === 'paper' && paper) return (
    <div style={{ maxWidth:780 }}>
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'16px 24px', marginBottom:20, textAlign:'center' }}>
        <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text3)', marginBottom:6 }}>{paper.subject}</div>
        <div style={{ fontFamily:'DM Serif Display,serif', fontSize:22, color:'var(--text)', marginBottom:8 }}>{paper.title}</div>
        <div style={{ fontSize:13, color:'var(--text2)' }}>⏱ {paper.timeMinutes} min · 📝 {paper.totalMarks} marks</div>
        {paper.instructions && <div style={{ fontSize:12, color:'var(--text3)', marginTop:8, fontStyle:'italic' }}>{paper.instructions}</div>}
      </div>

      {(paper.questions||[]).map((q,i) => (
        <div key={i} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'14px 16px', marginBottom:12 }}>
          <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom: q.options?.length ? 12 : 0 }}>
            <div style={{ width:28, height:28, borderRadius:7, background:'var(--bg3)', border:'1px solid var(--border2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, color:'var(--text2)', flexShrink:0 }}>{q.number||`Q${i+1}`}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, color:'var(--text)', lineHeight:1.6, marginBottom:6 }}>{q.question}</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {q.type && <span style={{ fontSize:10, background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:999, padding:'2px 8px', color:'var(--text3)' }}>{q.type}</span>}
                <span style={{ fontSize:10, background:'var(--accent-dim)', border:'1px solid var(--accent-dim2)', borderRadius:999, padding:'2px 8px', color:'var(--accent)' }}>{q.marks} marks</span>
                {q.topic && <span style={{ fontSize:10, background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:999, padding:'2px 8px', color:'var(--text3)' }}>{q.topic}</span>}
              </div>
            </div>
          </div>
          {q.options && q.options.length > 0 && (
            <div style={{ paddingLeft:40, display:'flex', flexDirection:'column', gap:6 }}>
              {q.options.map(o => <div key={o} style={{ fontSize:13, color:'var(--text2)', padding:'6px 10px', background:'var(--bg3)', borderRadius:6 }}>{o}</div>)}
            </div>
          )}
        </div>
      ))}

      <div style={{ display:'flex', gap:10, marginTop:20, paddingTop:16, borderTop:'1px solid var(--border)' }}>
        <button className="exam-back-btn" onClick={() => setView('setup')}>← New Paper</button>
        <button className="exam-continue-btn" style={{ flex:1 }} onClick={() => { setAnswers({}); setView('answer'); }}>📝 Answer this Paper</button>
        <button onClick={() => setShowAnswers(s => !s)} style={{ padding:'10px 16px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'none', fontFamily:'DM Sans,sans-serif', fontSize:13, color:'var(--text2)', cursor:'pointer', whiteSpace:'nowrap' }}>
          {showAnswers ? '🙈 Hide Answers' : '💡 Show Answers'}
        </button>
      </div>

      {/* Answer key panel */}
      {showAnswers && (
        <div style={{ marginTop:16, background:'var(--accent-dim)', border:'1px solid var(--accent-dim2)', borderRadius:'var(--radius)', padding:'14px 18px' }}>
          <div style={{ fontSize:12, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--accent)', marginBottom:12 }}>💡 Answer Key</div>
          {(paper.questions||[]).map((q,i) => (
            <div key={i} style={{ marginBottom:12, paddingBottom:12, borderBottom:'1px solid var(--accent-dim2)' }}>
              <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', marginBottom:4 }}>{q.number||`Q${i+1}`}: {q.question}</div>
              <div style={{ fontSize:13, color:'var(--accent)' }}>✓ {q.answer || 'See notes'}</div>
              {q.topic && <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>Topic: {q.topic}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ANSWER VIEW
  if (view === 'answer') return (
    <div style={{ maxWidth:780 }}>
      <button className="back-btn" onClick={() => setView('paper')}>← Back to Paper</button>
      <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:24, marginBottom:16 }}>Write your answers</h2>

      {(paper.questions||[]).map((q,i) => {
        const isMCQ = q.type==='mcq' || q.type==='truefalse';
        return (
          <div key={i} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:16, marginBottom:14 }}>
            <div style={{ display:'flex', gap:12, marginBottom:12 }}>
              <div style={{ width:28, height:28, borderRadius:7, background:'var(--bg3)', border:'1px solid var(--border2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, color:'var(--text2)', flexShrink:0 }}>{q.number||`Q${i+1}`}</div>
              <div>
                <div style={{ fontSize:14, color:'var(--text)', lineHeight:1.6 }}>{q.question}</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:3 }}>{q.marks} marks</div>
              </div>
            </div>
            {isMCQ
              ? <div style={{ paddingLeft:40, display:'flex', flexDirection:'column', gap:8 }}>
                  {(q.options||[]).map((opt,oi) => (
                    <label key={oi} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:'var(--radius-sm)', border:`1px solid ${answers[i]===opt?'var(--accent)':'var(--border)'}`, background:answers[i]===opt?'var(--accent-dim)':'var(--bg3)', cursor:'pointer', transition:'all 0.15s' }}>
                      <input type="radio" name={`q${i}`} style={{ accentColor:'var(--accent)' }} checked={answers[i]===opt} onChange={() => setAnswers(p => ({...p,[i]:opt}))} />
                      <span style={{ fontSize:13, color:'var(--text2)' }}>{opt}</span>
                    </label>
                  ))}
                </div>
              : <textarea style={{ width:'calc(100% - 40px)', marginLeft:40, background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'10px 12px', fontFamily:'DM Sans,sans-serif', fontSize:13, color:'var(--text)', outline:'none', resize:'vertical', minHeight:80, lineHeight:1.6, transition:'border-color 0.2s' }}
                  placeholder="Write your answer here..." value={answers[i]||''}
                  onChange={e => setAnswers(p => ({...p,[i]:e.target.value}))}
                  onFocus={e => e.target.style.borderColor='var(--accent)'}
                  onBlur={e => e.target.style.borderColor='var(--border)'} />
            }
          </div>
        );
      })}

      <button className="exam-continue-btn" style={{ width:'100%', padding:13 }} onClick={check}>🔍 Check My Answers</button>
    </div>
  );

  // RESULTS VIEW
  if (view === 'results') return (
    <div style={{ maxWidth:780 }}>
      <button className="back-btn" onClick={() => { setView('setup'); setPaper(null); setResult(null); }}>← New Paper</button>
      <h2 style={{ fontFamily:'DM Serif Display,serif', fontSize:24, marginBottom:16 }}>📊 Your Results</h2>

      {loading ? <Spinner text={loadMsg} />
        : result?.error ? <div className="ai-insight-box">⚠️ {result.error}</div>
        : result && <>
            <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:20, display:'flex', alignItems:'center', gap:20, marginBottom:16 }}>
              <div style={{ textAlign:'center', flexShrink:0 }}>
                <div style={{ fontSize:40, fontWeight:700, fontFamily:'DM Serif Display,serif', color:gradeColor(result.percentage) }}>{result.grade}</div>
                <div style={{ fontSize:12, color:'var(--text3)' }}>Grade</div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:22, fontWeight:600, color:gradeColor(result.percentage) }}>{result.totalObtained} / {result.totalPossible}</div>
                <div style={{ fontSize:13, color:'var(--text2)', marginTop:2 }}>{result.percentage}% · {result.feedback}</div>
                <div style={{ background:'var(--bg3)', borderRadius:999, height:6, marginTop:10, overflow:'hidden' }}>
                  <div style={{ width:result.percentage+'%', height:'100%', background:gradeColor(result.percentage), borderRadius:999, transition:'width 0.8s ease' }} />
                </div>
              </div>
            </div>

            {(result.evaluations||[]).map((ev,i) => (
              <div key={i} style={{ background:'var(--bg2)', border:`1px solid ${ev.correct?'rgba(200,240,107,0.3)':ev.marksObtained>0?'rgba(255,179,71,0.3)':'rgba(255,107,107,0.3)'}`, borderRadius:'var(--radius)', padding:'12px 16px', marginBottom:10 }}>
                <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                  <span style={{ fontSize:18, flexShrink:0 }}>{ev.correct?'✅':ev.marksObtained>0?'⚡':'❌'}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', marginBottom:3 }}>{ev.number}: {paper?.questions[i]?.question}</div>
                    <div style={{ fontSize:12, color:'var(--text2)', marginBottom:4 }}>Your answer: <em>{answers[i]||'(no answer)'}</em></div>
                    <div style={{ fontSize:12, color:'var(--text3)' }}>{ev.feedback}</div>
                  </div>
                  <span style={{ fontSize:14, fontWeight:600, color:ev.correct?'var(--accent)':ev.marksObtained>0?'var(--amber)':'var(--red)', flexShrink:0 }}>{ev.marksObtained}/{ev.marksPossible}</span>
                </div>
              </div>
            ))}
          </>
      }
    </div>
  );
}

// ─── GapsPage ─────────────────────────────────────────────────────────────────
export function GapsPage() {
  const { user, folders, marks, addMark, removeMark } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]   = useState({ subject:'', exam:'', got:'', total:'' });
  const [format, setFormat] = useState('text');   // text | image | doc
  const [qpText, setQpText]   = useState('');
  const [imgData, setImgData] = useState(null);
  const [imgType, setImgType] = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const [docText, setDocText]  = useState('');
  const [docName, setDocName]  = useState('');
  const [result, setResult]   = useState(null);
  const [reveal, setReveal]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [addMarksEntry, setAddMarksEntry] = useState(false);
  const [entryForm, setEntryForm] = useState({ subject:'', exam:'', got:'', total:'' });

  const setF  = k => e => setForm(p => ({...p,[k]:e.target.value}));
  const setEF = k => e => setEntryForm(p => ({...p,[k]:e.target.value}));

  function handleAdd() {
    if (!form.subject || !form.got || !form.total) return;
    addMark(form.subject, form.exam, +form.got, +form.total);
    setForm({ subject:'', exam:'', got:'', total:'' }); setShowForm(false);
  }

  function handleImageUpload(e) {
    const file = e.target.files[0]; if (!file) return;
    setImgType(file.type);
    const reader = new FileReader();
    reader.onload = ev => {
      setImgPreview(ev.target.result);
      setImgData(ev.target.result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  }

  function handleDocUpload(e) {
    const file = e.target.files[0]; if (!file) return;
    setDocName(file.name);
    const reader = new FileReader();
    reader.onload = ev => setDocText(ev.target.result.substring(0, 4000));
    reader.readAsText(file);
  }

  async function analyze() {
    const text = format==='text' ? qpText : format==='doc' ? docText : '';
    const img  = format==='image' ? imgData : null;
    const type = format==='image' ? imgType : null;
    if (!text && !img) { setError('Please add a question paper first'); return; }
    setLoading(true); setResult(null); setReveal(null); setError('');
    try {
      // Save marks entry first if checkbox is checked
      if (addMarksEntry && entryForm.subject && entryForm.got && entryForm.total) {
        addMark(entryForm.subject, entryForm.exam, +entryForm.got, +entryForm.total);
        setEntryForm({ subject:'', exam:'', got:'', total:'' });
        setAddMarksEntry(false);
      }
      const paperText = text || '(Student uploaded a question paper image. Please analyze knowledge gaps based on their notes and marks history.)';
      const data = await analyzeGaps(paperText, null, null, folders, marks);
      setResult(data);
    } catch(e) { setError('Error: ' + e.message); }
    finally { setLoading(false); }
  }

  const hasInput = (format==='text' && qpText.trim()) || (format==='image' && imgData) || (format==='doc' && docText);
  const getTrend = (m,i) => { const prev=marks.slice(0,i).filter(p=>p.subject===m.subject).slice(-1)[0]; return prev ? m.pct-prev.pct : null; };
  const scoreColor = p => p>=75?'var(--accent)':p>=50?'var(--amber)':'var(--red)';

  return (
    <div style={{ maxWidth:820 }}>
      <div className="exam-step-label">Knowledge Gaps</div>
      <h2 className="page-title" style={{ fontSize:28, marginBottom:16 }}>Track your growth & gaps</h2>

      {/* Marks Tracker */}
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:20, marginBottom:16 }}>
        <div style={{ fontSize:15, fontWeight:500, marginBottom:14 }}>📈 Marks Tracker</div>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr auto', gap:10, marginBottom:14, alignItems:'end' }}>
          {[['Subject','subject','text','Physics'],['Test','exam','text','Mid sem'],['Got','got','number','72'],['Total','total','number','100']].map(([l,k,t,ph]) => (
            <div key={k}><div className="marks-label">{l}</div><input className="marks-input" type={t} value={form[k]} onChange={setF(k)} placeholder={ph} /></div>
          ))}
          <button className="add-entry-btn" onClick={handleAdd} style={{ background:'var(--accent)', color:'#1a1a1a', border:'none', borderRadius:'var(--radius-sm)', padding:'9px 14px', fontFamily:'DM Sans,sans-serif', fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>Add →</button>
        </div>
        {!marks.length
          ? <div style={{ textAlign:'center', color:'var(--text3)', padding:20, fontSize:13 }}>No marks yet. Add your first entry above.</div>
          : <table className="marks-table" style={{ width:'100%' }}>
              <thead><tr>{['Subject','Test','Score','%','Trend',''].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {marks.map((m,i) => {
                  const diff = getTrend(m,i);
                  const pill = m.pct>=75?'score-high':m.pct>=50?'score-mid':'score-low';
                  return (
                    <tr key={m.id}>
                      <td><strong style={{ color:'var(--text)' }}>{m.subject}</strong></td>
                      <td>{m.exam}</td>
                      <td>{m.got}/{m.total}</td>
                      <td><span className={`score-pill ${pill}`}>{m.pct}%</span></td>
                      <td>{diff===null?<span style={{color:'var(--text3)'}}>—</span>:diff>0?<span style={{color:'var(--accent)',fontWeight:600}}>↑ +{diff}%</span>:<span style={{color:'var(--red)',fontWeight:600}}>↓ {diff}%</span>}</td>
                      <td><button onClick={() => removeMark(m.id)} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:16 }}>×</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
        }
      </div>

      {/* QP Analysis with text / image / doc tabs */}
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:20, marginBottom:16 }}>
        <div style={{ fontSize:15, fontWeight:500, marginBottom:14 }}>🔍 Question Paper Analysis</div>

        {/* Format tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:14 }}>
          {[['text','✏️ Text'],['image','🖼️ Image'],['doc','📄 Doc / PDF']].map(([v,lbl]) => (
            <button key={v} onClick={() => setFormat(v)} style={{ padding:'7px 16px', border:`1px solid ${format===v?'var(--accent)':'var(--border)'}`, borderRadius:999, background:format===v?'var(--accent-dim)':'var(--bg3)', color:format===v?'var(--accent)':'var(--text2)', cursor:'pointer', fontSize:13, fontFamily:'DM Sans,sans-serif', transition:'all 0.15s' }}>{lbl}</button>
          ))}
        </div>

        {/* Text input */}
        {format==='text' && (
          <textarea className="qp-textarea" style={{ minHeight:120, marginBottom:10 }} value={qpText}
            onChange={e => setQpText(e.target.value)}
            placeholder="Paste your question paper here... The AI will identify which topics are strong and which need work." />
        )}

        {/* Image upload */}
        {format==='image' && (
          <div>
            <div onClick={() => document.getElementById('gap-img').click()} style={{ border:'1.5px dashed var(--border2)', borderRadius:'var(--radius)', padding:32, textAlign:'center', cursor:'pointer', background:'var(--bg3)', marginBottom:10, transition:'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='var(--border2)'}>
              <div style={{ fontSize:32, marginBottom:8 }}>🖼️</div>
              <div style={{ fontSize:14, color:'var(--text2)' }}>Click to upload question paper image</div>
              <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>JPG, PNG, WEBP supported</div>
            </div>
            <input id="gap-img" type="file" accept="image/*" style={{ display:'none' }} onChange={handleImageUpload} />
            {imgPreview && <img src={imgPreview} alt="preview" style={{ maxWidth:'100%', maxHeight:200, borderRadius:'var(--radius-sm)', objectFit:'contain', marginBottom:10 }} />}
          </div>
        )}

        {/* Doc upload */}
        {format==='doc' && (
          <div>
            <div onClick={() => document.getElementById('gap-doc').click()} style={{ border:'1.5px dashed var(--border2)', borderRadius:'var(--radius)', padding:32, textAlign:'center', cursor:'pointer', background:'var(--bg3)', marginBottom:10, transition:'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='var(--border2)'}>
              <div style={{ fontSize:32, marginBottom:8 }}>📄</div>
              <div style={{ fontSize:14, color:'var(--text2)' }}>{docName ? `✅ ${docName}` : 'Click to upload PDF or TXT'}</div>
              <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>TXT files work best. For PDF, copy-paste the text into the Text tab.</div>
            </div>
            <input id="gap-doc" type="file" accept=".txt,.text" style={{ display:'none' }} onChange={handleDocUpload} />
          </div>
        )}

        {/* Optional marks entry */}
        <div style={{ marginTop:12, marginBottom:12 }}>
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'var(--text2)' }}>
            <input type="checkbox" checked={addMarksEntry} onChange={e => setAddMarksEntry(e.target.checked)}
              style={{ accentColor:'var(--accent)', width:15, height:15, cursor:'pointer' }} />
            Also add marks for this paper to Marks Tracker
          </label>
          {addMarksEntry && (
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:10, marginTop:10 }}>
              {[['Subject','subject','text','e.g. English'],['Test','exam','text','e.g. Sem 1'],['Got','got','number','36'],['Total','total','number','50']].map(([l,k,t,ph]) => (
                <div key={k}>
                  <div className="marks-label">{l}</div>
                  <input className="marks-input" type={t} value={entryForm[k]} onChange={setEF(k)} placeholder={ph} />
                </div>
              ))}
            </div>
          )}
        </div>

        {loading ? <Spinner text="Analyzing knowledge gaps..." />
          : <>
              {error && <div style={{ fontSize:13, color:'var(--red)', marginBottom:8 }}>{error}</div>}
              <button className="gaps-analyze-btn" onClick={analyze} disabled={!hasInput} style={{ opacity: hasInput ? 1 : 0.5 }}>🔬 Analyze Gaps</button>
            </>
        }
      </div>

      {/* Results */}
      {result && (
        <div>
          <div style={{ display:'flex', gap:12, marginBottom:14, flexWrap:'wrap' }}>
            {[
              [result.overallScore+'%','Score',scoreColor(result.overallScore)],
              [result.trend,'Trend','var(--amber)'],
              [(result.strongAreas||[]).length,'Strong','var(--accent)'],
              [(result.weakAreas||[]).length,'Weak','var(--red)'],
            ].map(([v,l,c]) => (
              <div key={l} style={{ flex:1, minWidth:80, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'12px 16px', textAlign:'center' }}>
                <div style={{ fontSize:22, fontWeight:600, color:c }}>{v}</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:3 }}>{l}</div>
              </div>
            ))}
          </div>

          <div className="ai-insight-box" style={{ marginBottom:14 }}>
            <span style={{ fontSize:20 }}>🧠</span>
            <span style={{ fontSize:13, color:'var(--text)', marginLeft:10, lineHeight:1.6 }}>{result.insight}</span>
          </div>

          <div style={{ display:'flex', gap:10, marginBottom:reveal ? 12 : 0 }}>
            <button className="reveal-btn reveal-strong" onClick={() => setReveal(r => r==='strong'?null:'strong')}>✅ {reveal==='strong'?'Hide':'Show'} Strong Areas</button>
            <button className="reveal-btn reveal-weak" onClick={() => setReveal(r => r==='weak'?null:'weak')}>⚠️ {reveal==='weak'?'Hide':'Show'} Weak Areas</button>
          </div>

          {reveal && (
            <div style={{ background:'var(--bg2)', border:`1px solid ${reveal==='strong'?'rgba(200,240,107,0.3)':'rgba(255,107,107,0.3)'}`, borderRadius:'var(--radius)', padding:16, marginBottom:14 }}>
              <div style={{ fontSize:12, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:reveal==='strong'?'var(--accent)':'var(--red)', marginBottom:12 }}>
                {reveal==='strong'?'✅ Strong Areas':'⚠️ Weak Areas — Study these'}
              </div>
              {(reveal==='strong'?result.strongAreas:result.weakAreas)?.map((a,i) => (
                <div key={i} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ fontSize:13, color:'var(--text2)', minWidth:110 }}>{a.topic}</div>
                    <div style={{ flex:1, background:'var(--bg3)', borderRadius:999, height:5, overflow:'hidden' }}>
                      <div style={{ width:a.score+'%', height:'100%', background:reveal==='strong'?'var(--accent)':'var(--red)', borderRadius:999 }} />
                    </div>
                    <div style={{ fontSize:12, color:'var(--text3)', minWidth:36, textAlign:'right' }}>{a.score}%</div>
                  </div>
                  {a.reason && <div style={{ fontSize:11, color:'var(--text3)', marginTop:3, paddingLeft:120 }}>{a.reason}</div>}
                </div>
              ))}
            </div>
          )}

          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'16px 20px' }}>
            <div className="marks-label" style={{ marginBottom:10 }}>Recommendations</div>
            <ul style={{ paddingLeft:16 }}>
              {(result.recommendations||[]).map((r,i) => <li key={i} style={{ fontSize:13, color:'var(--text2)', marginBottom:8, lineHeight:1.5 }}>{r}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BurnoutPage ──────────────────────────────────────────────────────────────
export function BurnoutPage() {
  const { user, folders, burnoutHistory, saveCheckin } = useApp();
  const [step, setStep] = useState(0);
  const [d, setD] = useState({ hours:4, sleep:7, energy:6, focus:6, stress:4, mood:3, breaks:'none', meals:'skipped', symptoms:[] });
  const [result, setResult] = useState(() => {
    const today = new Date().toLocaleDateString('en-CA');
    return burnoutHistory.find(e => e.date === today) || null;
  });
  const [tips, setTips]         = useState(null);
  const [loadingTips, setLoadingTips] = useState(false);
  const [submitting, setSubmitting]   = useState(false);

  const setV = k => v => setD(p => ({ ...p, [k]: v }));
  const toggleSymptom = s => setD(p => ({ ...p, symptoms: p.symptoms.includes(s) ? p.symptoms.filter(x => x!==s) : [...p.symptoms,s] }));

  function calcScore(d) {
    let s = 0;
    if (d.hours>12) s+=28; else if (d.hours>9) s+=18; else if (d.hours>8) s+=10;
    if (d.sleep<=3) s+=28; else if (d.sleep<=5) s+=18; else if (d.sleep<=6) s+=8;
    s += Math.round((10-d.energy)*2.2) + Math.round((10-d.focus)*1.5) + Math.round(d.stress*2.2) + Math.round((5-d.mood)*3.5);
    if (d.breaks==='none') s+=12; else if (d.breaks==='some') s+=5;
    if (d.meals==='skipped') s+=10; else if (d.meals==='junk') s+=7;
    s += d.symptoms.filter(x => x!=='No symptoms today').length * 4;
    return Math.min(100, Math.max(0, Math.round(s)));
  }

  function calcWork(d) {
    let p = Math.round((d.hours/16)*100);
    if (d.breaks==='regular') p-=10; if (d.breaks==='none') p+=8;
    if (d.sleep<5) p+=10; if (d.stress>=7) p+=8;
    return Math.min(100, Math.max(0, Math.round(p)));
  }

  const scoreColor = s => s<=25?'var(--accent)':s<=50?'#7ee8a2':s<=65?'var(--amber)':s<=80?'#ff9a3c':'var(--red)';
  const workLabel = p => p<20?'Underworking':p<35?'Below Optimal':p<=65?'Optimal Zone':p<=80?'Overworking':'Severely Overworked';
  const tagColors = { 'Do now':'var(--red)','Tonight':'var(--blue)','This week':'var(--amber)','Habit':'var(--accent)' };

  async function submit() {
    setSubmitting(true);
    try {
      const score   = calcScore(d);
      const workPct = calcWork(d);
      const entry   = { ...d, score, workPct, date: new Date().toLocaleDateString('en-CA') };

      // Save check-in to backend (marks it as done for today)
      try { await saveCheckin(entry); } catch(e) { console.error('Save error:', e.message); }

      // Show results immediately — don't wait for tips
      setResult(entry);
      setSubmitting(false);

      // Fetch AI tips in background
      setLoadingTips(true);
      try {
        const res = await burnoutTips(entry, score, workPct, burnoutHistory.slice(-5), folders);
        if (res && res.tips && res.tips.length) setTips(res.tips);
        else setTips(null); // will show fallback tips
      } catch(e) {
        console.error('Tips error:', e.message);
        setTips(null); // fallback tips will be shown
      } finally { setLoadingTips(false); }

    } catch(e) {
      console.error('Submit error:', e.message);
      setSubmitting(false);
    }
  }

  const STEPS   = ['Work & Sleep','Energy & Focus','Mood & Stress','Breaks & Meals','Symptoms'];
  const MOODS   = [[1,'😫','Awful'],[2,'😔','Low'],[3,'😐','Okay'],[4,'😊','Good'],[5,'🤩','Great']];
  const SYMPTOMS = ['Headache','Eye strain','Brain fog','Trouble sleeping','Irritable / anxious','Feel numb','Procrastinating','No symptoms today'];

  function SliderField({ label, value, min, max, step:st, suffix, onChange, desc }) {
    const isGood = suffix==='h'?(label.includes('Sleep')?value>=6:value>=2&&value<=8):(label.includes('Stress')?value<=4:value>=6);
    return (
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:16, padding:20, marginBottom:12 }}>
        <div className="marks-label">{label}</div>
        <input type="range" min={min} max={max} step={st} value={value} onChange={e => onChange(+e.target.value)}
          style={{ width:'100%', margin:'10px 0 8px', accentColor:'var(--accent)' }} />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:28, fontWeight:600, color:isGood?'var(--accent)':'var(--amber)', fontFamily:'DM Serif Display,serif' }}>{value}{suffix}</span>
          <span style={{ fontSize:13, color:'var(--text2)' }}>{desc}</span>
        </div>
      </div>
    );
  }

  function ChipSelect({ label, value, onChange, options }) {
    return (
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:16, padding:20, marginBottom:12 }}>
        <div className="marks-label">{label}</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:10 }}>
          {options.map(([v,lbl]) => (
            <button key={v} onClick={() => onChange(v)} style={{ padding:'8px 16px', border:`1.5px solid ${value===v?'var(--accent)':'var(--border)'}`, borderRadius:999, background:value===v?'var(--accent-dim)':'var(--bg3)', color:value===v?'var(--accent)':'var(--text2)', cursor:'pointer', fontSize:13, fontFamily:'DM Sans,sans-serif', transition:'all 0.15s' }}>{lbl}</button>
          ))}
        </div>
      </div>
    );
  }

  const fallbackTips = [
    { icon:'💡', title:'Take a proper break', desc:'Step away for 30 minutes. Walk outside, eat something, avoid your phone.', tag:'Do now' },
    { icon:'😴', title:'Prioritize sleep tonight', desc:'Aim for 7-8 hours. Sleep is when memory consolidation happens.', tag:'Tonight' },
    { icon:'⏱️', title:'Use Pomodoro technique', desc:'25 min study, 5 min break. Prevents mental fatigue from building up.', tag:'Habit' },
    { icon:'🥗', title:'Eat a proper meal', desc:'Skipping meals tanks concentration by up to 30%. Fuel your brain now.', tag:'Do now' },
  ];

  // RESULTS VIEW
  if (result) return (
    <div style={{ maxWidth:820 }}>
      <button className="back-btn" onClick={() => { setResult(null); setStep(0); setTips(null); }}>← Check Again</button>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
        {/* Burnout gauge */}
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:16, padding:20, textAlign:'center' }}>
          <div className="marks-label">Burnout Risk</div>
          <div style={{ fontSize:60, fontWeight:700, color:scoreColor(result.score), fontFamily:'DM Serif Display,serif', lineHeight:1.1, marginTop:8 }}>{result.score}%</div>
          <div style={{ background:'var(--bg3)', borderRadius:6, height:8, margin:'12px 0 8px', overflow:'hidden' }}>
            <div style={{ height:'100%', width:result.score+'%', background:scoreColor(result.score), borderRadius:6, transition:'width 1s ease' }} />
          </div>
          <div style={{ fontSize:14, color:scoreColor(result.score), fontWeight:500 }}>
            {result.score<=25?'🌱 Thriving':result.score<=45?'✅ Healthy':result.score<=60?'😓 Tired':result.score<=75?'⚠️ At Risk':'🚨 Critical'}
          </div>
        </div>

        {/* Work balance */}
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:16, padding:20 }}>
          <div className="marks-label">Work Balance</div>
          <div style={{ fontSize:46, fontWeight:700, fontFamily:'DM Serif Display,serif', color:scoreColor(result.score), marginTop:8 }}>{result.workPct}%</div>
          <div style={{ fontSize:13, fontWeight:500, color:scoreColor(result.score), marginBottom:10 }}>{workLabel(result.workPct)}</div>
          <div style={{ position:'relative', height:10, background:'var(--bg3)', borderRadius:5, overflow:'hidden', marginBottom:6 }}>
            <div style={{ height:'100%', width:result.workPct+'%', background:scoreColor(result.score), borderRadius:5, transition:'width 1s ease' }} />
            <div style={{ position:'absolute', top:0, left:'50%', width:2, height:'100%', background:'var(--border2)' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text3)' }}><span>Under</span><span>Optimal</span><span>Over</span></div>
        </div>
      </div>

      {/* Vitals */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
        {[
          [result.hours+'h','Study',result.hours<=8?'var(--accent)':'var(--red)'],
          [result.sleep+'h','Sleep',result.sleep>=6?'var(--accent)':'var(--red)'],
          [result.energy+'/10','Energy',result.energy>=6?'var(--accent)':'var(--amber)'],
          [result.focus+'/10','Focus',result.focus>=6?'var(--accent)':'var(--amber)'],
          [result.stress+'/10','Stress',result.stress<=4?'var(--accent)':'var(--red)'],
          [['','😫','😔','😐','😊','🤩'][result.mood]||'😐','Mood',result.mood>=3?'var(--accent)':'var(--red)'],
        ].map(([v,l,c]) => (
          <div key={l} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:14, textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:600, color:c, fontFamily:'DM Serif Display,serif' }}>{v}</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:3 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Recovery plan */}
      <div className="marks-label" style={{ marginBottom:10 }}>Recovery Plan</div>
      {loadingTips ? <Spinner text="Building your personalized recovery plan..." />
        : (tips || fallbackTips).map((t,i) => (
          <div key={i} className="bo-tip">
            <div style={{ fontSize:22, flexShrink:0 }}>{t.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                <span style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>{t.title}</span>
                <span style={{ fontSize:10, padding:'2px 8px', borderRadius:999, fontWeight:600, background:(tagColors[t.tag]||'var(--accent)')+'22', color:tagColors[t.tag]||'var(--accent)' }}>{t.tag}</span>
              </div>
              <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.55 }}>{t.desc}</div>
            </div>
          </div>
        ))
      }
    </div>
  );

  // CHECKIN FORM
  return (
    <div style={{ maxWidth:640 }}>
      <div className="exam-step-label">Burnout Check</div>
      <h2 className="page-title" style={{ fontSize:28, marginBottom:16 }}>How are you holding up?</h2>

      <div style={{ display:'flex', gap:6, marginBottom:8 }}>
        {STEPS.map((_,i) => <div key={i} style={{ flex:1, height:4, borderRadius:2, background:i<step?'var(--accent)':i===step?'rgba(200,240,107,0.5)':'var(--bg3)' }} />)}
      </div>
      <div style={{ fontSize:12, color:'var(--text3)', marginBottom:18 }}>Step {step+1} of 5 — {STEPS[step]}</div>

      {step===0 && <>
        <SliderField label="Study Hours Today" value={d.hours} min={0} max={16} step={0.5} suffix="h" onChange={setV('hours')} desc={d.hours<=4?'Normal day':d.hours<=8?'Heavy session':'Overworking zone'} />
        <SliderField label="Sleep Last Night" value={d.sleep} min={0} max={12} step={0.5} suffix="h" onChange={setV('sleep')} desc={d.sleep<=5?'Not enough':d.sleep<=7?'Well rested':'Long recovery'} />
      </>}

      {step===1 && <>
        <SliderField label="Energy Level" value={d.energy} min={1} max={10} step={1} suffix="/10" onChange={setV('energy')} desc={d.energy<=4?'Low energy':d.energy<=7?'Decent energy':'Full energy'} />
        <SliderField label="Focus Quality" value={d.focus} min={1} max={10} step={1} suffix="/10" onChange={setV('focus')} desc={d.focus<=4?'Hard to focus':d.focus<=7?'Reasonably focused':'Deep focus'} />
      </>}

      {step===2 && <>
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:16, padding:20, marginBottom:12 }}>
          <div className="marks-label">Your Mood Right Now</div>
          <div style={{ display:'flex', gap:10, marginTop:10 }}>
            {MOODS.map(([v,emoji,lbl]) => (
              <div key={v} onClick={() => setV('mood')(v)} style={{ flex:1, padding:'12px 6px', border:`1.5px solid ${d.mood===v?'var(--accent)':'var(--border)'}`, borderRadius:12, background:d.mood===v?'var(--accent-dim)':'var(--bg3)', cursor:'pointer', textAlign:'center', transition:'all 0.15s' }}>
                <div style={{ fontSize:26 }}>{emoji}</div>
                <div style={{ fontSize:11, color:'var(--text2)', marginTop:3 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
        <SliderField label="Stress Level" value={d.stress} min={1} max={10} step={1} suffix="/10" onChange={setV('stress')} desc={d.stress<=3?'Relaxed':d.stress<=6?'Some stress':'Overwhelmed'} />
      </>}

      {step===3 && <>
        <ChipSelect label="Breaks Today" value={d.breaks} onChange={setV('breaks')} options={[['regular','Regular breaks'],['some','A few short ones'],['none','Barely any'],['too-many','Too many']]} />
        <ChipSelect label="Meals & Hydration" value={d.meals} onChange={setV('meals')} options={[['great','Ate well'],['okay','Ate something'],['skipped','Skipped meal(s)'],['junk','Mostly junk']]} />
      </>}

      {step===4 && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:16, padding:20, marginBottom:12 }}>
          <div className="marks-label">Physical & Mental Symptoms</div>
          <p style={{ fontSize:13, color:'var(--text2)', margin:'6px 0 14px' }}>Select everything you are experiencing today.</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {SYMPTOMS.map(s => (
              <button key={s} onClick={() => toggleSymptom(s)} style={{ padding:'7px 14px', border:`1.5px solid ${d.symptoms.includes(s)?'rgba(255,107,107,0.6)':'var(--border)'}`, borderRadius:999, background:d.symptoms.includes(s)?'rgba(255,107,107,0.1)':'var(--bg3)', color:d.symptoms.includes(s)?'var(--red)':'var(--text2)', cursor:'pointer', fontSize:13, fontFamily:'DM Sans,sans-serif', transition:'all 0.15s' }}>{s}</button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:'flex', gap:10, marginTop:8 }}>
        {step>0 && <button className="exam-back-btn" onClick={() => setStep(s=>s-1)}>← Back</button>}
        {step<4
          ? <button className="exam-continue-btn" style={{ flex:1 }} onClick={() => setStep(s=>s+1)}>Continue →</button>
          : submitting
            ? <button className="exam-continue-btn" style={{ flex:1, opacity:0.7 }} disabled>Analyzing...</button>
            : <button className="exam-continue-btn" style={{ flex:1 }} onClick={submit}>Analyze My Burnout →</button>
        }
      </div>
    </div>
  );
}