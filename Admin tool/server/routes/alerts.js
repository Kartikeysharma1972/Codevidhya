const express = require('express');
const auth = require('../middleware/auth');
const { getMongoDB } = require('../lib/mongodb');

const router = express.Router();

router.use(auth);

// GET /api/alerts/at-risk
router.get('/at-risk', async (req, res) => {
  try {
    const mongodb = getMongoDB();
    if (!mongodb) {
      return res.json({
        declining: [],
        inactive: [],
        struggling: [],
        summary: { total_at_risk: 0, declining_count: 0, inactive_count: 0, struggling_count: 0 },
        message: 'Student database not available',
      });
    }

    const usersCol = mongodb.collection('users');
    const testAttemptsCol = mongodb.collection('testattempts');

    // --- a) Declining Performance ---
    // Students whose avg accuracy in last 3 tests is lower than previous 3 tests by >= 10 points
    const allStudentsWithTests = await testAttemptsCol.aggregate([
      { $sort: { userId: 1, createdAt: -1 } },
      {
        $group: {
          _id: '$userId',
          tests: {
            $push: { accuracy: '$accuracy', createdAt: '$createdAt' },
          },
        },
      },
      { $match: { 'tests.5': { $exists: true } } }, // at least 6 tests needed
    ]).toArray();

    const decliningStudentIds = [];
    const decliningMap = {};

    for (const student of allStudentsWithTests) {
      const tests = student.tests; // already sorted desc by createdAt
      const recent3 = tests.slice(0, 3);
      const previous3 = tests.slice(3, 6);

      const recentAvg = recent3.reduce((sum, t) => sum + (t.accuracy || 0), 0) / 3;
      const previousAvg = previous3.reduce((sum, t) => sum + (t.accuracy || 0), 0) / 3;
      const drop = previousAvg - recentAvg;

      if (drop >= 10) {
        decliningStudentIds.push(student._id);
        decliningMap[student._id.toString()] = {
          recent_avg: Math.round(recentAvg * 100) / 100,
          previous_avg: Math.round(previousAvg * 100) / 100,
          drop: Math.round(drop * 100) / 100,
        };
      }
    }

    let declining = [];
    if (decliningStudentIds.length > 0) {
      const users = await usersCol.find(
        { _id: { $in: decliningStudentIds } },
        { projection: { name: 1, email: 1, grade: 1 } }
      ).toArray();

      declining = users.map(u => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        grade: u.grade,
        ...decliningMap[u._id.toString()],
      }));
    }

    // --- b) Inactive Students ---
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const inactiveUsers = await usersCol.find(
      { updatedAt: { $lt: sevenDaysAgo } },
      { projection: { name: 1, email: 1, grade: 1, updatedAt: 1 } }
    ).toArray();

    const inactive = inactiveUsers.map(u => {
      const daysInactive = Math.floor((Date.now() - new Date(u.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        grade: u.grade,
        last_active: u.updatedAt,
        days_inactive: daysInactive,
      };
    });

    // --- c) Consistently Struggling ---
    const strugglingAgg = await testAttemptsCol.aggregate([
      {
        $group: {
          _id: '$userId',
          avg_accuracy: { $avg: '$accuracy' },
          total_tests: { $sum: 1 },
        },
      },
      { $match: { avg_accuracy: { $lt: 40 } } },
    ]).toArray();

    let struggling = [];
    if (strugglingAgg.length > 0) {
      const strugglingIds = strugglingAgg.map(s => s._id);
      const strugglingUsers = await usersCol.find(
        { _id: { $in: strugglingIds } },
        { projection: { name: 1, email: 1, grade: 1 } }
      ).toArray();

      const userMap = {};
      strugglingUsers.forEach(u => { userMap[u._id.toString()] = u; });

      struggling = strugglingAgg.map(s => {
        const user = userMap[s._id.toString()] || {};
        return {
          _id: s._id,
          name: user.name || 'Unknown',
          email: user.email || '',
          grade: user.grade,
          avg_accuracy: Math.round(s.avg_accuracy * 100) / 100,
          total_tests: s.total_tests,
        };
      });
    }

    // Deduplicate for total at-risk count
    const atRiskIds = new Set();
    declining.forEach(s => atRiskIds.add(s._id.toString()));
    inactive.forEach(s => atRiskIds.add(s._id.toString()));
    struggling.forEach(s => atRiskIds.add(s._id.toString()));

    res.json({
      declining,
      inactive,
      struggling,
      summary: {
        total_at_risk: atRiskIds.size,
        declining_count: declining.length,
        inactive_count: inactive.length,
        struggling_count: struggling.length,
      },
    });
  } catch (err) {
    console.error('Alerts error:', err);
    res.status(500).json({ error: 'Failed to load at-risk alerts' });
  }
});

module.exports = router;
