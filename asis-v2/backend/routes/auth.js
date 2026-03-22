const express = require('express');
const router = express.Router();

// 🔥 GLOBAL USERS STORE (shared)
let users = [];

// SIGNUP
router.post('/signup', (req, res) => {
  const { studentId, password } = req.body;

  if (!studentId || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const exists = users.find(u => u.studentId === studentId);
  if (exists) {
    return res.status(400).json({ error: 'User already exists' });
  }

  users.push({ studentId, password });

  console.log('USERS:', users); // debug

  res.json({
    ok: true,
    user: { id: studentId }
  });
});

// LOGIN
router.post('/login', (req, res) => {
  const { studentId, password } = req.body;

  const user = users.find(
    u => u.studentId === studentId && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({
    ok: true,
    user: { id: studentId }
  });
});

module.exports = router;