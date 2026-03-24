// backend/routes/auth.js
// Uses localStorage-compatible approach — stores users in a JSON file
// so they persist across server restarts

const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');

const DB_FILE = path.join(__dirname, '../users.json');

// ── Helper: load/save users ───────────────────────────────────────────────────
function loadUsers() {
  try {
    if (!fs.existsSync(DB_FILE)) return {};
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch { return {}; }
}

function saveUsers(users) {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

// ── POST /api/auth/signup ─────────────────────────────────────────────────────
router.post('/signup', (req, res) => {
  const { firstName, lastName, email, college, year, password } = req.body;

  if (!firstName || !email || !password) {
    return res.status(400).json({ error: 'First name, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const users = loadUsers();
  const key   = email.trim().toLowerCase();

  if (users[key]) {
    return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
  }

  const newUser = {
    id:       key,
    name:     `${firstName.trim()} ${lastName?.trim() || ''}`.trim(),
    email:    email.trim(),
    college:  college?.trim() || '',
    year:     year || '',
    password,
    created:  new Date().toLocaleDateString(),
  };

  users[key] = newUser;
  saveUsers(users);

  // Return user without password
  const { password: _, ...safeUser } = newUser;
  res.json({ ok: true, user: safeUser });
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const users = loadUsers();
  const key   = email.trim().toLowerCase();
  const user  = users[key];

  if (!user) {
    return res.status(401).json({ error: 'No account found with this email. Please sign up first.' });
  }
  if (user.password !== password) {
    return res.status(401).json({ error: 'Incorrect password. Please try again.' });
  }

  const { password: _, ...safeUser } = user;
  res.json({ ok: true, user: safeUser });
});

module.exports = router;