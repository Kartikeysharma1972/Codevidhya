const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Admin = require('../models/Admin');
const Settings = require('../models/Settings');

const router = express.Router();

router.use(auth);

// GET /api/management/admins - List all admin users
router.get('/admins', async (req, res) => {
  try {
    const admins = await Admin.find({}, { password: 0 }).sort({ createdAt: -1 }).lean();

    res.json({ admins });
  } catch (err) {
    console.error('List admins error:', err);
    res.status(500).json({ error: 'Failed to load admins' });
  }
});

// POST /api/management/admins - Create new admin user (requires principal role)
router.post('/admins', async (req, res) => {
  try {
    if (req.admin.role !== 'principal') {
      return res.status(403).json({ error: 'Only principals can create admin users' });
    }

    const { name, email, password, school, role } = req.body;

    if (!name || !email || !password || !school) {
      return res.status(400).json({ error: 'Name, email, password, and school are required' });
    }

    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'Admin with this email already exists' });
    }

    const admin = new Admin({
      name,
      email,
      password,
      school,
      role: role || 'coordinator',
    });

    await admin.save();

    res.status(201).json({
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        school: admin.school,
        role: admin.role,
        createdAt: admin.createdAt,
      },
    });
  } catch (err) {
    console.error('Create admin error:', err);
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

// DELETE /api/management/admins/:id - Delete admin user (can't delete self)
router.delete('/admins/:id', async (req, res) => {
  try {
    if (req.admin.role !== 'principal') {
      return res.status(403).json({ error: 'Only principals can delete admin users' });
    }

    if (req.admin._id.toString() === req.params.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    let adminId;
    try {
      adminId = new mongoose.Types.ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: 'Invalid admin ID' });
    }

    const deleted = await Admin.findByIdAndDelete(adminId);

    if (!deleted) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json({ message: 'Admin deleted successfully' });
  } catch (err) {
    console.error('Delete admin error:', err);
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});

// GET /api/management/settings - Get admin portal settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json({ settings });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

// PUT /api/management/settings - Update settings
router.put('/settings', async (req, res) => {
  try {
    const {
      flagging_keywords,
      daily_usage_limit,
      alert_inactive_days,
      alert_accuracy_drop,
      alert_min_accuracy,
    } = req.body;

    const updateFields = {
      updatedAt: new Date(),
      updatedBy: req.admin._id.toString(),
    };

    if (flagging_keywords !== undefined) {
      if (!Array.isArray(flagging_keywords)) {
        return res.status(400).json({ error: 'flagging_keywords must be an array' });
      }
      updateFields.flagging_keywords = flagging_keywords;
    }
    if (daily_usage_limit !== undefined) {
      updateFields.daily_usage_limit = Number(daily_usage_limit);
    }
    if (alert_inactive_days !== undefined) {
      updateFields.alert_inactive_days = Number(alert_inactive_days);
    }
    if (alert_accuracy_drop !== undefined) {
      updateFields.alert_accuracy_drop = Number(alert_accuracy_drop);
    }
    if (alert_min_accuracy !== undefined) {
      updateFields.alert_min_accuracy = Number(alert_min_accuracy);
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(updateFields);
      await settings.save();
    } else {
      Object.assign(settings, updateFields);
      await settings.save();
    }

    res.json({ settings });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
