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

function passwordIssue(pw) {
  if (!pw || pw.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter.';
  if (!/[0-9]/.test(pw)) return 'Password must contain at least one number.';
  return null;
}

function token(user) {
  return jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

async function safeJson(res) {
  try { return await res.json(); } catch { return {}; }
}

// Mirror a freshly-created portal user into the matching sub-app so the
// downstream app has a real account to log into.
async function mirrorSignup({ role, name, email, password, schoolName, grade }) {
  try {
    if (role === 'student') {
      const r = await fetch(`${STUDENT_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, grade }),
      });
      const data = await safeJson(r);
      return r.ok ? { token: data.token, user: data.user } : null;
    }
    if (role === 'teacher') {
      const r = await fetch(`${TEACHER_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, school_name: schoolName }),
      });
      const data = await safeJson(r);
      return r.ok ? { token: data.token, user: data.user } : null;
    }
    if (role === 'admin') {
      const r = await fetch(`${ADMIN_URL}/api/auth/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, password, school: schoolName, setupKey: ADMIN_SETUP_KEY,
        }),
      });
      const data = await safeJson(r);
      return r.ok ? { token: data.token, user: data.admin } : null;
    }
  } catch (e) {
    console.warn(`mirrorSignup(${role}) failed:`, e.message);
  }
  return null;
}

async function mirrorLogin({ role, email, password }) {
  try {
    if (role === 'student') {
      const r = await fetch(`${STUDENT_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await safeJson(r);
      return r.ok ? { token: data.token, user: data.user } : null;
    }
    if (role === 'teacher') {
      const r = await fetch(`${TEACHER_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await safeJson(r);
      return r.ok ? { token: data.token, user: data.user } : null;
    }
    if (role === 'admin') {
      const r = await fetch(`${ADMIN_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await safeJson(r);
      return r.ok ? { token: data.token, user: data.admin } : null;
    }
  } catch (e) {
    console.warn(`mirrorLogin(${role}) failed:`, e.message);
  }
  return null;
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

    const handoff = await mirrorSignup({
      role,
      name: name.trim(),
      email: cleanEmail,
      password,
      schoolName: schoolName.trim(),
      grade: role === 'student' ? Number(grade) : undefined,
    });

    return res.status(201).json({
      token: token(user),
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

    let handoff = await mirrorLogin({ role: user.role, email: cleanEmail, password });

    // If sub-app login fails (e.g. user existed in portal but never mirrored),
    // try to mirror-create them now and log in again.
    if (!handoff) {
      await mirrorSignup({
        role: user.role,
        name: user.name,
        email: cleanEmail,
        password,
        schoolName: user.schoolName,
        grade: user.grade,
      });
      handoff = await mirrorLogin({ role: user.role, email: cleanEmail, password });
    }

    return res.json({ token: token(user), user: user.toPublic(), handoff });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    return res.json({ user: user.toPublic() });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
