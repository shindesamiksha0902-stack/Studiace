const express = require('express');
const router = express.Router();

// Demo login (hardcoded)
router.post('/login', (req, res) => {
  const { studentId, password } = req.body;

  if (studentId === 'admin' && password === '1234') {
    return res.json({
      ok: true,
      user: { id: studentId, name: 'Admin User' }
    });
  }

  res.status(401).json({ error: 'Invalid credentials' });
});

module.exports = router;