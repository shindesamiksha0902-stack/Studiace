// All backend calls in one place

async function call(method, path, body) 
  const BASE_URL = "https://studiace-1.onrender.com";

async function call(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ── AI ────────────────────────────────────────────────────────────────────────
export const AI = {
  chat:         (messages, folders)                                      => call('POST', '/ai/chat',          { messages, folders }),
  examStrategy: (folders, opts)                                          => call('POST', '/ai/exam-strategy', { folders, ...opts }),
  generateQP:   (folders, selectedNotes, opts)                          => call('POST', '/ai/generate-qp',   { folders, selectedNotes, ...opts }),
  checkAnswers: (questions, studentAnswers)                              => call('POST', '/ai/check-answers', { questions, studentAnswers }),
  analyzeGaps:  (questionPaperText, imageBase64, imageType, folders, marksHistory) =>
    call('POST', '/ai/analyze-gaps', { questionPaperText, imageBase64, imageType, folders, marksHistory }),
  burnoutTips:  (checkin, score, workPct, history, folders)             => call('POST', '/ai/burnout-tips',  { checkin, score, workPct, history, folders }),
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
  saveCheckin: (uid, data) => call('POST', `/burnout/${uid}`, data),
};

// Named exports — match exactly how OtherPages.js calls them
export const chatAI       = (messages, folders) => AI.chat(messages, folders);
export const examStrategy = (folders, opts)     => AI.examStrategy(folders, opts);
export const generateQP   = (folders, selectedNotes, opts) => AI.generateQP(folders, selectedNotes, opts);
export const checkAnswers = (questions, studentAnswers)    => AI.checkAnswers(questions, studentAnswers);
export const analyzeGaps  = (questionPaperText, imageBase64, imageType, folders, marksHistory) =>
  AI.analyzeGaps(questionPaperText, imageBase64, imageType, folders, marksHistory);
export const burnoutTips  = (checkin, score, workPct, history, folders) =>
  AI.burnoutTips(checkin, score, workPct, history, folders);