const express = require('express');
const router = express.Router();

const db = new Map(); // userId -> checkins[]
const today = () => new Date().toLocaleDateString('en-CA');

router.get('/:uid', (req, res) => res.json(db.get(req.params.uid) || []));

router.post('/:uid', (req, res) => {
  const data = { ...req.body, date: today() };
  const history = (db.get(req.params.uid) || []).filter(e => e.date !== today());
  history.push(data);
  db.set(req.params.uid, history.slice(-30));
  res.json({ ok: true, entry: data });
});

module.exports = router;
