import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

function generateToken(user) {
  return jwt.sign({ userId: user._id, grade: user.grade }, JWT_SECRET, { expiresIn: '7d' });
}

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, grade } = req.body;
    if (!name || !email || !password || !grade) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (grade < 1 || grade > 12) {
      return res.status(400).json({ error: 'Grade must be between 1 and 12' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const user = await User.create({ name, email, password, grade });
    const token = generateToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, grade: user.grade, language: user.language || 'English' }
    });
  } catch (err) {
    console.error('Signup error:', err.message, err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, grade: user.grade, language: user.language || 'English' }
    });
  } catch (err) {
    console.error('Login error:', err.message, err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: user._id, name: user.name, email: user.email, grade: user.grade } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/update-grade', authMiddleware, async (req, res) => {
  try {
    const { grade } = req.body;
    if (!grade || grade < 1 || grade > 12) return res.status(400).json({ error: 'Invalid grade' });

    const user = await User.findByIdAndUpdate(req.userId, { grade }, { new: true }).select('-password');
    const token = generateToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, grade: user.grade, language: user.language || 'English' }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Allowed response languages (English name -> stored value). Keep in sync with
// the client-side list in client/src/utils/languages.js.
const SUPPORTED_LANGUAGES = [
  'English', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Gujarati',
  'Kannada', 'Malayalam', 'Punjabi', 'Odia', 'Urdu', 'Assamese',
];

router.put('/update-language', authMiddleware, async (req, res) => {
  try {
    const { language } = req.body;
    if (!language || !SUPPORTED_LANGUAGES.includes(language)) {
      return res.status(400).json({ error: 'Unsupported language' });
    }
    const user = await User.findByIdAndUpdate(req.userId, { language }, { new: true }).select('-password');
    const token = generateToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, grade: user.grade, language: user.language || 'English' }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
