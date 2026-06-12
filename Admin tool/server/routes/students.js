const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const { getMongoDB } = require('../lib/mongodb');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const mongodb = getMongoDB();
    if (!mongodb) {
      return res.json({ students: [], total: 0, page: 1, pages: 1, message: 'Student database not available' });
    }

    const usersCol = mongodb.collection('users');
    const sessionsCol = mongodb.collection('sessions');
    const testAttemptsCol = mongodb.collection('testattempts');

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.grade) {
      filter.grade = parseInt(req.query.grade);
    }
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    const [students, total] = await Promise.all([
      usersCol.find(filter, { projection: { password: 0 } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      usersCol.countDocuments(filter),
    ]);

    const studentIds = students.map(s => s._id);

    const [sessionCounts, testCounts] = await Promise.all([
      sessionsCol.aggregate([
        { $match: { userId: { $in: studentIds } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
      ]).toArray(),
      testAttemptsCol.aggregate([
        { $match: { userId: { $in: studentIds } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
      ]).toArray(),
    ]);

    const sessionMap = {};
    sessionCounts.forEach(s => { sessionMap[s._id.toString()] = s.count; });

    const testMap = {};
    testCounts.forEach(t => { testMap[t._id.toString()] = t.count; });

    const enrichedStudents = students.map(s => ({
      ...s,
      session_count: sessionMap[s._id.toString()] || 0,
      test_count: testMap[s._id.toString()] || 0,
    }));

    res.json({
      students: enrichedStudents,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    console.error('Students list error:', err);
    res.status(500).json({ error: 'Failed to load students' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const mongodb = getMongoDB();
    if (!mongodb) {
      return res.status(503).json({ error: 'Student database not available' });
    }

    const usersCol = mongodb.collection('users');
    const sessionsCol = mongodb.collection('sessions');
    const testAttemptsCol = mongodb.collection('testattempts');

    let studentId;
    try {
      studentId = new mongoose.Types.ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: 'Invalid student ID' });
    }

    const student = await usersCol.findOne(
      { _id: studentId },
      { projection: { password: 0 } }
    );

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const [sessions, test_history, performanceAgg, weakAreasAgg, toolUsageAgg] =
      await Promise.all([
        sessionsCol.find({ userId: studentId })
          .sort({ updatedAt: -1 })
          .limit(20)
          .project({ messages: 0 })
          .toArray(),
        testAttemptsCol.find({ userId: studentId })
          .sort({ createdAt: -1 })
          .limit(20)
          .project({ questions: 0 })
          .toArray(),
        testAttemptsCol.aggregate([
          { $match: { userId: studentId } },
          {
            $group: {
              _id: null,
              avgAccuracy: { $avg: '$accuracy' },
              totalTests: { $sum: 1 },
              avgScore: { $avg: '$score' },
            },
          },
        ]).toArray(),
        testAttemptsCol.aggregate([
          { $match: { userId: studentId, weakAreas: { $exists: true, $ne: [] } } },
          { $unwind: '$weakAreas' },
          { $group: { _id: '$weakAreas', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]).toArray(),
        sessionsCol.aggregate([
          { $match: { userId: studentId } },
          { $group: { _id: '$tool', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]).toArray(),
      ]);

    const performance = performanceAgg[0] || { avgAccuracy: 0, totalTests: 0, avgScore: 0 };
    const weak_areas = weakAreasAgg.map(w => ({ area: w._id, count: w.count }));
    const tool_usage = toolUsageAgg.map(t => ({ tool: t._id, count: t.count }));

    res.json({
      student,
      sessions,
      test_history,
      performance: {
        avg_accuracy: performance.avgAccuracy,
        total_tests: performance.totalTests,
        avg_score: performance.avgScore,
      },
      weak_areas,
      tool_usage,
    });
  } catch (err) {
    console.error('Student detail error:', err);
    res.status(500).json({ error: 'Failed to load student details' });
  }
});

module.exports = router;
