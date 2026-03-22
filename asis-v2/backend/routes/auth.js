const express = require('express');
const router = express.Router();

// Keep users in memory (works while service is running)
global.users = global.users || [];

// SIGNUP
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

  console.log('USERS AFTER SIGNUP:', global.users);

  res.json({
    ok: true,
    user: { id: studentId }
  });
});

// LOGIN
router.post('/login', (req, res) => {
  const { studentId, password } = req.body;

  const user = global.users.find(
    u => u.studentId === studentId && u.password === password
  );

  console.log('LOGIN ATTEMPT:', studentId, password);
  console.log('CURRENT USERS:', global.users);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({
    ok: true,
    user: { id: studentId }
  });
});

module.exports = router;