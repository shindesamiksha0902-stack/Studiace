// backend/server.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const app     = express();

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json({ limit: '10mb' }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',    require('./routes/auth'));     // ← login / signup
app.use('/api/ai',      require('./routes/ai'));
app.use('/api/marks',   require('./routes/marks'));
app.use('/api/burnout', require('./routes/burnout'));

app.get('/api/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`ASIS backend → http://localhost:${PORT}`));