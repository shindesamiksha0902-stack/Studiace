// frontend/src/api/index.js
// ── Points to your Render backend (not localhost) ─────────────────────────────

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

async function call(method, path, body) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const Auth = {
  login:  (email, password)                          => call('POST', '/auth/login',  { email, password }),
  signup: (firstName, lastName, email, college, year, password) =>
                                                        call('POST', '/auth/signup', { firstName, lastName, email, college, year, password }),
};

// ── AI ────────────────────────────────────────────────────────────────────────
export const AI = {
  chat:         (messages, folders)                        => call('POST', '/ai/chat',          { messages, folders }),
  examStrategy: (folders, opts)                            => call('POST', '/ai/exam-strategy',  { folders, ...opts }),
  generateQP:   (folders, selectedNotes, opts)             => call('POST', '/ai/generate-qp',   { folders, selectedNotes, ...opts }),
  checkAnswers: (questions, studentAnswers)                => call('POST', '/ai/check-answers',  { questions, studentAnswers }),
  analyzeGaps:  (questionPaperText, folders, marksHistory) => call('POST', '/ai/analyze-gaps',  { questionPaperText, folders, marksHistory }),
  burnoutTips:  (checkin, score, workPct, history, folders)=> call('POST', '/ai/burnout-tips',  { checkin, score, workPct, history, folders }),
};

// ── Marks ─────────────────────────────────────────────────────────────────────
export const Marks = {
  getAll: (uid)                          => call('GET',    `/marks/${uid}`),
  add:    (uid, subject, exam, got, tot) => call('POST',   `/marks/${uid}`, { subject, exam, got, total: tot }),
  remove: (uid, id)                      => call('DELETE', `/marks/${uid}/${id}`),
};

// ── Burnout ───────────────────────────────────────────────────────────────────
export const Burnout = {
  getHistory:  uid        => call('GET',  `/burnout/${uid}`),
  saveCheckin: (uid, data)=> call('POST', `/burnout/${uid}`, data),
};