import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

import authRoutes from './routes/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5174';

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/codevidhya-portal';
console.log('Connecting to MongoDB…', mongoUri.replace(/\/\/.*:.*@/, '//<credentials>@'));
mongoose
  .connect(mongoUri)
  .then(() => console.log('MongoDB connected.'))
  .catch((err) => console.error('MongoDB connection error:', err.message));

// Portal API
app.use('/api/auth', authRoutes);
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'codevidhya-portal' }));

// ─── Sub-app warm-up ──────────────────────────────────────────────────────
// Render free tier sleeps services after 15 min of inactivity. A cold wake
// can be 30–60 s, which kills the first signup that has to mirror into a
// sleeping sub-app. We poke each sub-app's health endpoint on portal startup
// and again whenever the landing page is loaded, so by the time a user
// finishes the signup form, the targets are already awake.
const SUB_APPS = [
  { name: 'student', url: process.env.STUDENT_APP_URL || 'http://localhost:5000', path: '/api/health' },
  { name: 'teacher', url: process.env.TEACHER_APP_URL || 'http://localhost:8001', path: '/api/health' },
  { name: 'admin',   url: process.env.ADMIN_APP_URL   || 'http://localhost:5001', path: '/api/auth/me' },
];

async function warmupAll() {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 60_000);
  const results = await Promise.allSettled(
    SUB_APPS.map((s) =>
      fetch(`${s.url}${s.path}`, { signal: ac.signal })
        .then((r) => ({ name: s.name, status: r.status }))
        .catch((e) => ({ name: s.name, status: 0, error: e.message }))
    )
  );
  clearTimeout(timer);
  return results.map((r) => (r.status === 'fulfilled' ? r.value : { error: String(r.reason) }));
}

app.get('/api/warmup', async (req, res) => {
  const out = await warmupAll();
  res.json({ warmed: out });
});

// First warmup on boot.
warmupAll().then((out) => {
  const summary = out.map((o) => `${o.name}:${o.status ?? '?'}`).join(' ');
  console.log('Warmed sub-apps →', summary);
});

// ─── Gateway proxy for the unified single-portal deployment ────────────────
// In production a single domain serves everything. We mount the three
// existing apps under /student, /teacher and /admin so users never hop
// between portals.
const proxies = [
  { mount: '/student', target: process.env.STUDENT_APP_URL || 'http://localhost:5000' },
  { mount: '/teacher', target: process.env.TEACHER_APP_URL || 'http://localhost:8000' },
  { mount: '/admin',   target: process.env.ADMIN_APP_URL   || 'http://localhost:5001' },
];

for (const { mount, target } of proxies) {
  app.use(
    mount,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      ws: true,
      pathRewrite: (p) => p.replace(new RegExp(`^${mount}`), '') || '/',
      logLevel: 'warn',
    })
  );
}

// ─── Serve portal client (Vite build) ──────────────────────────────────────
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => console.log(`Codevidhya portal running on http://localhost:${PORT}`));
