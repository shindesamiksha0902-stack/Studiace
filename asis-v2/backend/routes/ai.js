const express = require('express');
const router = express.Router();

// ── Supports BOTH Groq and Anthropic ─────────────────────────────────────────
// Set GROQ_API_KEY in .env to use Groq (free), otherwise uses Anthropic
const USE_GROQ = !!process.env.GROQ_API_KEY;
let callAI;

if (USE_GROQ) {
  const Groq = require('groq-sdk');
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  callAI = async (prompt, system) => {
    const messages = [];
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: prompt });
    const res = await groq.chat.completions.create({ model: MODEL, messages, max_tokens: 4096 });
    return res.choices[0].message.content;
  };
  console.log('AI: Groq (' + MODEL + ')');
} else {
  const Anthropic = require('@anthropic-ai/sdk');
  const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const MODEL = 'claude-sonnet-4-5';
  callAI = async (prompt, system) => {
    const res = await ai.messages.create({
      model: MODEL, max_tokens: 4096,
      ...(system ? { system } : {}),
      messages: [{ role: 'user', content: prompt }],
    });
    return res.content[0].text;
  };
  console.log('AI: Anthropic (' + MODEL + ')');
}

// Robustly extract JSON from AI response
function parseJSON(raw) {
  const clean = raw.replace(/```json|```/g, '').trim();
  const start = clean.search(/[{[]/);
  const end = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'));
  if (start === -1 || end === -1) throw new Error('No JSON in AI response: ' + clean.substring(0, 100));
  return JSON.parse(clean.slice(start, end + 1));
}

// Strip HTML from note content
const stripHtml = (s = '') => s.replace(/<[^>]+>/g, '');

// Build readable notes digest
function notesDigest(folders = []) {
  if (!folders || !folders.length) return 'No notes yet.';
  return folders.map(f =>
    `Folder: ${f.name}\n` +
    (f.subjects || []).map(s =>
      `  Subject: ${s.name}\n` +
      (s.notes || []).map(n =>
        `    Note "${n.title || 'Untitled'}": ${stripHtml(n.content || '').substring(0, 300)}`
      ).join('\n')
    ).join('\n')
  ).join('\n');
}

// ── POST /api/ai/chat  (Study Buddy) ─────────────────────────────────────────
router.post('/chat', async (req, res) => {
  const { messages, folders } = req.body;
  if (!messages || !messages.length) return res.status(400).json({ error: 'messages required' });

  const system = `You are Study Buddy, a warm encouraging AI tutor inside ASIS (AI Student Intelligence System). You have access to the student notes below. Be helpful, clear and use markdown formatting (bold, lists) naturally.\n\nSTUDENT NOTES:\n${notesDigest(folders)}`;

  // Build conversation history as one prompt
  const history = messages.map(m => `${m.role === 'user' ? 'Student' : 'Buddy'}: ${m.content}`).join('\n\n');
  const prompt = `${history}\n\nBuddy:`;

  try {
    const reply = await callAI(prompt, system);
    res.json({ reply: reply.replace(/^Buddy:\s*/i, '').trim() });
  } catch (e) {
    console.error('Chat error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/ai/exam-strategy ────────────────────────────────────────────────
router.post('/exam-strategy', async (req, res) => {
  const { folders, examName, examDate, hoursPerDay, difficulty, syllabusText } = req.body;
  const daysLeft = examDate
    ? Math.max(1, Math.ceil((new Date(examDate) - new Date()) / 86400000))
    : 14;
  const hoursPerDayNum = parseInt(hoursPerDay) || 4;
  const totalHours = daysLeft * hoursPerDayNum;

  // Build explicit subject list from folders to force AI to use them
  const subjectList = [];
  (folders || []).forEach(f => {
    (f.subjects || []).forEach(s => {
      subjectList.push({ folder: f.name, subject: s.name, noteCount: (s.notes || []).length });
    });
  });
  const subjectListStr = subjectList.length
    ? subjectList.map(s => `- "${s.subject}" in folder "${s.folder}" (${s.noteCount} notes)`).join('\n')
    : '- No subjects added yet';

  const prompt = `You are an expert exam strategy AI. Generate a full personalized study plan.

STUDENT SUBJECTS (you MUST include ALL of these in your response):
${subjectListStr}

NOTES CONTENT:
${notesDigest(folders)}

EXAM: ${examName || 'Upcoming Exam'} | Days left: ${daysLeft} | Hours/day: ${hoursPerDayNum} | Total: ${totalHours}h | Difficulty: ${difficulty || 'medium'}
${syllabusText ? 'Syllabus: ' + syllabusText.substring(0, 500) : ''}

STRICT RULES — you must follow all of these:
1. Include EVERY subject from the list above in the subjects array
2. strengths and weaknesses must each have at least 2 items — infer from subject names if notes are minimal
3. weekPlan must have at least 3 days with real tasks
4. Return ONLY valid JSON — no markdown fences, no explanation text

{
  "examName": "${examName || 'Upcoming Exam'}",
  "daysLeft": ${daysLeft},
  "totalHours": ${totalHours},
  "insight": "2-3 sentences about readiness and focus areas",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "subjects": [
    { "name": "exact subject name", "folder": "exact folder name", "priority": "high|medium|low", "reason": "why", "hoursAllocated": 10, "coverage": 60 }
  ],
  "weekPlan": [
    { "day": "Day 1", "focus": "focus area", "tasks": [{ "time": "9:00-10:30", "task": "task description", "subject": "subject name" }] }
  ],
  "tips": ["tip 1", "tip 2", "tip 3"]
}`;

  try {
    const raw = await callAI(prompt, null);
    const data = parseJSON(raw);

    // Hard fallbacks — never send empty/undefined to frontend
    data.examName   = data.examName   || examName   || 'Upcoming Exam';
    data.daysLeft   = data.daysLeft   || daysLeft;
    data.totalHours = data.totalHours || totalHours;
    data.insight    = data.insight    || 'Strategy generated based on your subjects.';
    data.strengths  = data.strengths  && data.strengths.length  ? data.strengths  : subjectList.slice(0, 2).map(s => s.subject + ' — covered in notes');
    data.weaknesses = data.weaknesses && data.weaknesses.length ? data.weaknesses : subjectList.slice(-2).map(s => s.subject + ' — needs more revision');
    data.tips       = data.tips       && data.tips.length       ? data.tips       : ['Review notes daily', 'Practice past papers', 'Take regular breaks'];
    data.weekPlan   = data.weekPlan   && data.weekPlan.length   ? data.weekPlan   : [];

    // If AI still returned empty subjects, build from folder data directly
    if (!data.subjects || !data.subjects.length) {
      data.subjects = subjectList.map((s, i) => ({
        name: s.subject,
        folder: s.folder,
        priority: i === 0 ? 'high' : i === 1 ? 'medium' : 'low',
        reason: 'Based on your enrolled subjects',
        hoursAllocated: Math.round(totalHours / Math.max(subjectList.length, 1)),
        coverage: s.noteCount > 0 ? 60 : 30,
      }));
    }

    res.json(data);
  } catch (e) {
    console.error('Exam strategy error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/ai/generate-qp ──────────────────────────────────────────────────
router.post('/generate-qp', async (req, res) => {
  const { folders, selectedNotes, qtype, difficulty, count, totalMarks, syllabusText } = req.body;
  const ctx = selectedNotes && selectedNotes.length
    ? selectedNotes.map(n => `[${n.subject}] ${n.title}: ${n.content}`).join('\n')
    : notesDigest(folders);

  const prompt = `You are an expert exam paper setter. Create exactly ${count || 10} questions.

SOURCE MATERIAL:
${ctx}
${syllabusText ? `\nSYLLABUS:\n${syllabusText.substring(0, 500)}` : ''}

REQUIREMENTS:
- Number of questions: ${count || 10}
- Question type: ${qtype || 'mixed'} (mixed means variety of MCQ and theory)
- Difficulty: ${difficulty || 'medium'}
- Total marks: ${totalMarks || 100}
- All marks must add up to exactly ${totalMarks || 100}

Return ONLY this exact JSON, no extra text:
{
  "title": "Question Paper Title",
  "subject": "Subject Name",
  "totalMarks": ${totalMarks || 100},
  "timeMinutes": 120,
  "instructions": "Attempt all questions. Write clearly.",
  "questions": [
    {
      "number": "Q1",
      "type": "mcq",
      "question": "Question text here?",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "marks": 5,
      "topic": "Topic name",
      "answer": "A) Option 1"
    }
  ]
}

RULES:
- MCQ type: must have exactly 4 options array
- theory or short type: options must be empty array []
- truefalse type: options must be ["True", "False"]
- Generate exactly ${count || 10} questions
- Marks must sum to exactly ${totalMarks || 100}`;

  try {
    const raw = await callAI(prompt, null);
    const data = parseJSON(raw);
    if (!data.questions || !data.questions.length) {
      throw new Error('AI did not return valid questions');
    }
    res.json(data);
  } catch (e) {
    console.error('QP error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/ai/check-answers ────────────────────────────────────────────────
router.post('/check-answers', async (req, res) => {
  const { questions, studentAnswers } = req.body;
  const qa = questions.map((q, i) => ({
    number: q.number,
    question: q.question,
    modelAnswer: q.answer,
    studentAnswer: studentAnswers[i] || '(no answer)',
    marks: q.marks,
    type: q.type,
    topic: q.topic,
  }));

  const totalPossible = questions.reduce((a, q) => a + (q.marks || 0), 0);

  const prompt = `You are a fair exam evaluator. Evaluate each student answer.

Questions and Answers:
${JSON.stringify(qa, null, 2)}

Rules:
- MCQ/TrueFalse: full marks if correct, 0 if wrong
- Theory/Short: award partial marks based on quality (0 to full marks)
- Be fair and encouraging

Return ONLY this exact JSON:
{
  "totalObtained": 0,
  "totalPossible": ${totalPossible},
  "percentage": 0,
  "grade": "A",
  "feedback": "One sentence overall feedback",
  "evaluations": [
    {
      "number": "Q1",
      "marksObtained": 0,
      "marksPossible": 5,
      "correct": true,
      "feedback": "Short feedback on this answer",
      "topic": "Topic name"
    }
  ]
}`;

  try {
    const raw = await callAI(prompt, null);
    const data = parseJSON(raw);
    res.json(data);
  } catch (e) {
    console.error('Check answers error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/ai/analyze-gaps ─────────────────────────────────────────────────
router.post('/analyze-gaps', async (req, res) => {
  const { questionPaperText, imageBase64, imageType, folders, marksHistory } = req.body;
  const marksCtx = marksHistory && marksHistory.length
    ? 'Student marks history: ' + marksHistory.map(m => `${m.subject}: ${m.pct}%`).join(', ')
    : 'No marks history available.';

  const buildPrompt = (paperText) => `Analyze this student's knowledge gaps.

QUESTION PAPER:
${paperText || 'No question paper provided — analyze based on notes and marks history only.'}

STUDENT NOTES:
${notesDigest(folders)}

${marksCtx}

Return ONLY valid JSON:
{
  "strongAreas": [{"topic": "Topic name", "score": 85, "reason": "Why this is strong"}],
  "weakAreas": [{"topic": "Topic name", "score": 35, "reason": "Why this needs work"}],
  "overallScore": 65,
  "trend": "improving|declining|stable",
  "insight": "2-3 sentences about performance and what to focus on",
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
}`;

  try {
    let raw;

    if (imageBase64 && !USE_GROQ) {
      // Anthropic supports vision — use it
      const Anthropic = require('@anthropic-ai/sdk');
      const anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const res2 = await anthropicClient.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: imageType || 'image/jpeg', data: imageBase64 }},
          { type: 'text', text: buildPrompt('(analyze the question paper shown in the image above)') }
        ]}],
      });
      raw = res2.content[0].text;
    } else {
      // Groq (text only) or plain text input
      const paperText = questionPaperText && questionPaperText.trim()
        ? questionPaperText
        : imageBase64
          ? '(Image was uploaded. Analyzing from student notes and marks history since image analysis requires Anthropic API.)'
          : 'No question paper provided.';
      raw = await callAI(buildPrompt(paperText), null);
    }

    const data = parseJSON(raw);

    // Fallbacks
    data.strongAreas     = data.strongAreas     && data.strongAreas.length     ? data.strongAreas     : [{ topic: 'General Knowledge', score: 60, reason: 'Based on available notes' }];
    data.weakAreas       = data.weakAreas       && data.weakAreas.length       ? data.weakAreas       : [{ topic: 'Needs more study', score: 40, reason: 'Add more notes for detailed analysis' }];
    data.overallScore    = data.overallScore    || 50;
    data.trend           = data.trend           || 'stable';
    data.insight         = data.insight         || 'Analysis complete. Add more notes for deeper insights.';
    data.recommendations = data.recommendations && data.recommendations.length ? data.recommendations : ['Review all subjects regularly', 'Practice past papers', 'Focus on weak areas first'];

    res.json(data);
  } catch (e) {
    console.error('Gaps error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/ai/burnout-tips ─────────────────────────────────────────────────
router.post('/burnout-tips', async (req, res) => {
  const { checkin, score, workPct, history, folders } = req.body;
  const trend = history && history.length >= 3
    ? `Recent 5 burnout scores: ${history.slice(-5).map(e => e.score + '%').join(', ')}`
    : 'This is one of first few check-ins.';

  const moodLabels = ['', 'Awful', 'Low', 'Okay', 'Good', 'Great'];
  const workStatus = workPct < 35 ? 'underworking' : workPct > 65 ? 'overworking' : 'balanced';

  const prompt = `You are a student wellness coach. Generate 4 personalized recovery tips.

STUDENT CHECK-IN DATA:
- Burnout risk score: ${score}% (${score <= 25 ? 'Thriving' : score <= 45 ? 'Healthy' : score <= 60 ? 'Tired' : score <= 75 ? 'At Risk' : 'Critical'})
- Work balance: ${workPct}% (${workStatus})
- Study hours today: ${checkin.hours}h
- Sleep last night: ${checkin.sleep}h
- Energy: ${checkin.energy}/10
- Focus: ${checkin.focus}/10
- Stress: ${checkin.stress}/10
- Mood: ${moodLabels[checkin.mood] || 'Okay'}
- Breaks taken: ${checkin.breaks}
- Meals today: ${checkin.meals}
- Symptoms: ${(checkin.symptoms || []).join(', ') || 'none'}
- ${trend}

Give 4 specific, actionable, warm wellness tips based on this data.
Return ONLY this exact JSON:
{
  "tips": [
    {
      "icon": "😴",
      "title": "Short title (max 5 words)",
      "desc": "Two specific sentences of advice relevant to this student's data.",
      "tag": "Do now"
    }
  ]
}

Tags must be one of: "Do now", "Tonight", "This week", "Habit"
Use different tags for variety. Make tips highly specific to their score and symptoms.`;

  try {
    const raw = await callAI(prompt, null);
    const data = parseJSON(raw);
    res.json(data);
  } catch (e) {
    console.error('Burnout tips error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;