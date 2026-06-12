import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

const VALID_ROLES = ['student', 'teacher', 'admin'];

const STUDENT_URL = process.env.STUDENT_APP_URL || 'http://localhost:5000';
const TEACHER_URL = process.env.TEACHER_APP_URL || 'http://localhost:8001';
const ADMIN_URL   = process.env.ADMIN_APP_URL   || 'http://localhost:5001';
const ADMIN_SETUP_KEY = process.env.ADMIN_SETUP_KEY || 'codevidhya_admin_2024';

// Render free tier spins services down after 15 min of inactivity. A cold
// wake takes 20–60 s, so we patiently wait up to 90 s for the mirror call to
// succeed before giving up.
const MIRROR_TIMEOUT_MS = 90_000;

function passwordIssue(pw) {
  if (!pw || pw.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter.';
  if (!/[0-9]/.test(pw)) return 'Password must contain at least one number.';
  return null;
}

function portalToken(user) {
  return jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

async function safeFetchJson(url, init) {
  const ac = new AbortController();
  const t  = setTimeout(() => ac.abort(), MIRROR_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: ac.signal });
    let data = null;
    try { data = await res.json(); } catch { /* non-json */ }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, error: e.message };
  } finally {
    clearTimeout(t);
  }
}

async function mirrorSignup({ role, name, email, password, schoolName, grade }) {
  if (role === 'student') {
    const r = await safeFetchJson(`${STUDENT_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, grade }),
    });
    if (r.ok && r.data?.token) return { token: r.data.token, user: r.data.user };
  }
  if (role === 'teacher') {
    const r = await safeFetchJson(`${TEACHER_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, school_name: schoolName }),
    });
    if (r.ok && r.data?.token) return { token: r.data.token, user: r.data.user };
  }
  if (role === 'admin') {
    const r = await safeFetchJson(`${ADMIN_URL}/api/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, school: schoolName, setupKey: ADMIN_SETUP_KEY }),
    });
    if (r.ok && r.data?.token) return { token: r.data.token, user: r.data.admin };
  }
  return null;
}

async function mirrorLogin({ role, email, password }) {
  const urlByRole = { student: STUDENT_URL, teacher: TEACHER_URL, admin: ADMIN_URL };
  const url = urlByRole[role];
  if (!url) return null;
  const r = await safeFetchJson(`${url}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok || !r.data?.token) return null;
  return { token: r.data.token, user: r.data.user || r.data.admin };
}

// Try the cheapest path first: log in. If that fails, sign up (creates user
// in sub-app), then log in again to get a token. Self-heals across all the
// "user exists in portal but not in sub-app" and reverse cases.
async function mirrorAuth(payload) {
  const tryLogin = await mirrorLogin({ role: payload.role, email: payload.email, password: payload.password });
  if (tryLogin) return tryLogin;
  const trySignup = await mirrorSignup(payload);
  if (trySignup) return trySignup;
  // Last attempt: sub-app might have created the user during signup but
  // returned a non-2xx; try login one more time.
  return await mirrorLogin({ role: payload.role, email: payload.email, password: payload.password });
}

async function persistMirror(user, handoff) {
  if (!handoff || !handoff.token) return;
  user.subAppToken = handoff.token;
  user.subAppUser  = handoff.user || null;
  await user.save();
}

router.post('/signup', async (req, res) => {
  try {
    const { name, email, schoolName, role, grade, password } = req.body || {};

    if (!name || !email || !schoolName || !role || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }
    if (role === 'student') {
      const g = Number(grade);
      if (!g || g < 1 || g > 12) {
        return res.status(400).json({ error: 'Students must select a grade between 1 and 12.' });
      }
    }
    const pwIssue = passwordIssue(password);
    if (pwIssue) return res.status(400).json({ error: pwIssue });

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) return res.status(400).json({ error: 'Email already registered.' });

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      schoolName: schoolName.trim(),
      role,
      grade: role === 'student' ? Number(grade) : undefined,
      password,
    });

    const handoff = await mirrorAuth({
      role, name: name.trim(), email: cleanEmail, password,
      schoolName: schoolName.trim(),
      grade: role === 'student' ? Number(grade) : undefined,
    });
    await persistMirror(user, handoff);

    return res.status(201).json({
      token: portalToken(user),
      user: user.toPublic(),
      handoff,
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials.' });

    const handoff = await mirrorAuth({
      role: user.role, name: user.name, email: cleanEmail, password,
      schoolName: user.schoolName, grade: user.grade,
    });
    await persistMirror(user, handoff);

    return res.json({
      token: portalToken(user),
      user: user.toPublic(),
      handoff,
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Hand back the most recent sub-app token alongside the portal user, so
    // an iframe refresh (or fresh tab) can re-mount the embedded dashboard
    // without bouncing through login again.
    const handoff = user.subAppToken
      ? { token: user.subAppToken, user: user.subAppUser }
      : null;

    return res.json({ user: user.toPublic(), handoff });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
