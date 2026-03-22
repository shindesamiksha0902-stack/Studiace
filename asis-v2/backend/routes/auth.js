const express = require('express');
const router = express.Router();

// simple in-memory store (works while service is running)
global.users = global.users || [];

// SIGNUP → create user + return user (for auto-login)
router.post('/signup', (req, res) => {
  const { studentId, password } = req.body;

  if (!studentId || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const exists = global.users.find(u => u.studentId === studentId);
  if (exists) {
    return res.status(400).json({ error: 'User already exists' });
  }

  global.users.push({ studentId, password });

  return res.json({
    ok: true,
    user: { id: studentId }
  });
});

// LOGIN → only allow existing users
router.post('/login', (req, res) => {
  const { studentId, password } = req.body;

  const user = global.users.find(
    u => u.studentId === studentId && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  return res.json({
    ok: true,
    user: { id: studentId }
  });
});

module.exports = router;