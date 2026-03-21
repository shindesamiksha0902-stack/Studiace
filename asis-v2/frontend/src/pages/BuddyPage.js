import { useState, useRef, useEffect } from 'react';
import { useApp } from '../AppContext';
import { AI } from '../api';

const SUGGESTIONS = ['Explain Newton\'s laws simply', 'Quiz me on my notes', 'Make a study plan for tomorrow', 'What should I revise first?'];

function md(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, s => `<ul>${s}</ul>`)
    .replace(/\n/g, '<br/>');
}

export default function BuddyPage() {
  const { folders, user } = useApp();
  const [msgs, setMsgs] = useState([
    { role: 'assistant', text: "Hey! I'm your **Study Buddy** 🤖\n\nI can explain concepts, quiz you, summarize notes, or build a study plan. What do you need?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const bottom = useRef(null);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  async function send(text) {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput(''); setStarted(true);
    const history = [...msgs, { role: 'user', text: msg }];
    setMsgs(history);
    setLoading(true);
    try {
      // Filter to only user+assistant pairs, skip initial greeting if first msg is assistant
      const apiMsgs = history
        .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text || m.content || '' }))
        .filter(m => m.content.trim());
      // Anthropic requires first message to be user role
      const firstUserIdx = apiMsgs.findIndex(m => m.role === 'user');
      const trimmedMsgs = firstUserIdx > 0 ? apiMsgs.slice(firstUserIdx) : apiMsgs;
      const { reply } = await AI.chat(trimmedMsgs, folders);
      setMsgs(p => [...p, { role: 'assistant', text: reply }]);
    } catch (e) {
      setMsgs(p => [...p, { role: 'assistant', text: `Error: ${e.message}` }]);
    } finally { setLoading(false); }
  }

  return (
    <div className="buddy-page">
      <div className="buddy-header">
        <div className="buddy-avatar">🤖</div>
        <div>
          <div className="buddy-title">Study Buddy</div>
          <div className="buddy-status">AI · ready</div>
        </div>
        <button className="clear-btn" onClick={() => { setMsgs([]); setStarted(false); }}>Clear</button>
      </div>

      <div className="chat-messages">
        {msgs.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role === 'user' ? 'user' : 'ai'}`}>
            <div className="msg-avatar">{m.role === 'assistant' ? '🤖' : user?.name?.[0]?.toUpperCase()}</div>
            <div className={`msg-bubble ${m.role}`} dangerouslySetInnerHTML={{ __html: md(m.text) }} />
          </div>
        ))}
        {loading && (
          <div className="chat-msg ai">
            <div className="msg-avatar">🤖</div>
            <div className="msg-bubble ai"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></div>
          </div>
        )}
        <div ref={bottom} />
      </div>

      {!started && (
        <div className="suggestions">
          {SUGGESTIONS.map(s => <button key={s} className="suggestion-chip" onClick={() => send(s)}>{s}</button>)}
        </div>
      )}

      <div className="chat-input-row">
        <textarea className="chat-input" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask anything..." rows={1} />
        <button className="chat-send-btn" onClick={() => send()} disabled={loading}>→</button>
      </div>
    </div>
  );
}