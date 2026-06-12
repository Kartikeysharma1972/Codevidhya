const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const auth = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'admin_secret_change_in_production';

// POST /api/auth/setup - First-time admin creation
router.post('/setup', async (req, res) => {
  try {
    const { name, email, password, school, role, setupKey } = req.body;

    // Verify setup key
    const ADMIN_SETUP_KEY = process.env.ADMIN_SETUP_KEY || 'codevidhya_admin_2024';
    if (setupKey !== ADMIN_SETUP_KEY) {
      return res.status(403).json({ error: 'Invalid setup key' });
    }

    // Check if admin already exists with this email
    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'Admin with this email already exists' });
    }

    const admin = new Admin({
      name,
      email,
      password,
      school,
      role: role || 'principal',
    });

    await admin.save();

    const token = jwt.sign({ id: admin._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        school: admin.school,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error('Setup error:', err);
    res.status(500).json({ error: 'Server error during setup' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: admin._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        school: admin.school,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      admin: {
        id: req.admin._id,
        name: req.admin.name,
        email: req.admin.email,
        school: req.admin.school,
        role: req.admin.role,
      },
    });
  } catch (err) {
    console.error('Auth me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
