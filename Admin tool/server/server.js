require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-tutor';

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err.message));

mongoose.connection.on('error', err => {
  console.error('MongoDB runtime error:', err.message);
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/students', require('./routes/students'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/export', require('./routes/export'));
const moderationRouter = require('./routes/moderation');
app.use('/api/moderation', moderationRouter);
app.use('/api/management', require('./routes/management'));
app.use('/api/online', require('./routes/online'));

// ─── Real-time risk detection ───────────────────────────────────────────────
// Continuously scan recent student conversations for risk keywords so flagged
// chats surface on the admin dashboard without anyone pressing "scan".
const { scanForRiskyChats } = moderationRouter;
const SCAN_INTERVAL_MS = 60 * 1000;
async function runAutoScan() {
  try {
    const { new_flags } = await scanForRiskyChats({ hoursBack: 24 });
    if (new_flags > 0) console.log(`[auto-scan] flagged ${new_flags} new risky conversation(s)`);
  } catch (err) {
    console.error('[auto-scan] error:', err.message);
  }
}
// First sweep shortly after boot (give Mongo time to connect), then on a loop.
setTimeout(runAutoScan, 15000);
setInterval(runAutoScan, SCAN_INTERVAL_MS);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Admin server running on port ${PORT}`);
});
