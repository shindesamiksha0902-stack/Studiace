const express = require('express');
const router = express.Router();

// Simple in-memory store — replace with MongoDB/PostgreSQL in production
const db = new Map(); // userId -> marks[]

const get = id => db.get(id) || [];

router.get('/:uid', (req, res) => res.json(get(req.params.uid)));

router.post('/:uid', (req, res) => {
  const { subject, exam, got, total } = req.body;
  if (!subject || got == null || !total) return res.status(400).json({ error: 'subject, got, total required' });
  const entry = { id: Date.now().toString(), subject, exam: exam || 'Test', got: +got, total: +total, pct: Math.round((+got / +total) * 100), date: new Date().toLocaleDateString() };
  db.set(req.params.uid, [...get(req.params.uid), entry]);
  res.json(entry);
});

router.delete('/:uid/:id', (req, res) => {
  db.set(req.params.uid, get(req.params.uid).filter(m => m.id !== req.params.id));
  res.json({ ok: true });
});

module.exports = router;
