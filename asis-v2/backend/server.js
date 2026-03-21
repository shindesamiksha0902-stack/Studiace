require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/ai', require('./routes/ai'));
app.use('/api/marks', require('./routes/marks'));
app.use('/api/burnout', require('./routes/burnout'));

app.get('/api/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`ASIS backend → http://localhost:${PORT}`));