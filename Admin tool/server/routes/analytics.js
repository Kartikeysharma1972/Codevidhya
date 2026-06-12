const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const { getDb } = require('../lib/sqlite');
const { getMongoDB } = require('../lib/mongodb');

const router = express.Router();

router.use(auth);

// GET /api/analytics/usage-over-time - Daily lesson count, last 30 days
router.get('/usage-over-time', (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.json({ usage: [] });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sinceDate = thirtyDaysAgo.toISOString().split('T')[0];

    const usage = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM chat_history
      WHERE created_at >= ?
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all(sinceDate);

    res.json({ usage });
  } catch (err) {
    console.error('Usage over time error:', err);
    res.status(500).json({ error: 'Failed to load usage data' });
  }
});

// GET /api/analytics/tool-popularity - Tool usage breakdown
router.get('/tool-popularity', (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.json({ tools: [] });
    }

    const tools = db.prepare(`
      SELECT tool_name, COUNT(*) as count
      FROM chat_history
      GROUP BY tool_name
      ORDER BY count DESC
    `).all();

    res.json({ tools });
  } catch (err) {
    console.error('Tool popularity error:', err);
    res.status(500).json({ error: 'Failed to load tool data' });
  }
});

// GET /api/analytics/grade-performance - Average accuracy by grade from MongoDB
router.get('/grade-performance', async (req, res) => {
  try {
    const mongodb = getMongoDB();
    if (!mongodb) {
      return res.json({ grades: [] });
    }
    const testAttemptsCol = mongodb.collection('testattempts');

    const gradePerformance = await testAttemptsCol.aggregate([
      { $match: { accuracy: { $exists: true } } },
      {
        $group: {
          _id: '$grade',
          avg_accuracy: { $avg: '$accuracy' },
          total_tests: { $sum: 1 },
          avg_score: { $avg: '$score' },
        },
      },
      { $sort: { _id: 1 } },
    ]).toArray();

    res.json({
      grades: gradePerformance.map(g => ({
        grade: g._id,
        avg_accuracy: Math.round((g.avg_accuracy || 0) * 100) / 100,
        total_tests: g.total_tests,
        avg_score: Math.round((g.avg_score || 0) * 100) / 100,
      })),
    });
  } catch (err) {
    console.error('Grade performance error:', err);
    res.status(500).json({ error: 'Failed to load grade performance' });
  }
});

// GET /api/analytics/active-classes - Student count by grade with activity
router.get('/active-classes', async (req, res) => {
  try {
    const db = getDb();
    const mongodb = getMongoDB();

    let sqliteClasses = [];
    if (db) {
      try {
        sqliteClasses = db.prepare(`
          SELECT grade_level, COUNT(*) as count
          FROM students
          GROUP BY grade_level
          ORDER BY grade_level
        `).all();
      } catch (sqlErr) {
        console.error('SQLite active-classes error:', sqlErr.message);
      }
    }

    let mongoClasses = [];
    let sessionsByGrade = [];

    if (mongodb) {
      const usersCol = mongodb.collection('users');
      const sessionsCol = mongodb.collection('sessions');

      mongoClasses = await usersCol.aggregate([
        { $group: { _id: '$grade', student_count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]).toArray();

      sessionsByGrade = await sessionsCol.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $group: {
            _id: '$user.grade',
            session_count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]).toArray();
    }

    const sessionMap = {};
    sessionsByGrade.forEach(s => { sessionMap[s._id] = s.session_count; });

    res.json({
      sqlite_classes: sqliteClasses,
      mongo_classes: mongoClasses.map(c => ({
        grade: c._id,
        student_count: c.student_count,
        session_count: sessionMap[c._id] || 0,
      })),
    });
  } catch (err) {
    console.error('Active classes error:', err);
    res.status(500).json({ error: 'Failed to load active classes' });
  }
});

// GET /api/analytics/top-teachers - Top 10 teachers by content generated
router.get('/top-teachers', (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.json({ teachers: [] });
    }

    const teachers = db.prepare(`
      SELECT ch.teacher_id, u.name, u.email, u.school_name,
             COUNT(*) as total_lessons,
             COUNT(DISTINCT ch.tool_name) as tools_used,
             MAX(ch.created_at) as last_activity
      FROM chat_history ch
      LEFT JOIN users u ON ch.teacher_id = CAST(u.id AS TEXT)
      GROUP BY ch.teacher_id
      ORDER BY total_lessons DESC
      LIMIT 10
    `).all();

    res.json({ teachers });
  } catch (err) {
    console.error('Top teachers error:', err);
    res.status(500).json({ error: 'Failed to load top teachers' });
  }
});

// GET /api/analytics/student-performance - Aggregate test stats by subject
router.get('/student-performance', async (req, res) => {
  try {
    const mongodb = getMongoDB();
    if (!mongodb) {
      return res.json({ subjects: [] });
    }
    const testAttemptsCol = mongodb.collection('testattempts');

    const performance = await testAttemptsCol.aggregate([
      {
        $group: {
          _id: '$subject',
          avg_accuracy: { $avg: '$accuracy' },
          total_tests: { $sum: 1 },
          avg_score: { $avg: '$score' },
          total_questions: { $sum: '$totalQuestions' },
        },
      },
      { $sort: { total_tests: -1 } },
    ]).toArray();

    res.json({
      subjects: performance.map(p => ({
        subject: p._id,
        avg_accuracy: Math.round((p.avg_accuracy || 0) * 100) / 100,
        total_tests: p.total_tests,
        avg_score: Math.round((p.avg_score || 0) * 100) / 100,
        total_questions: p.total_questions,
      })),
    });
  } catch (err) {
    console.error('Student performance error:', err);
    res.status(500).json({ error: 'Failed to load student performance' });
  }
});

// ============================
// FEATURE 5: Teacher Effectiveness Correlation
// ============================

// GET /api/analytics/teacher-effectiveness
router.get('/teacher-effectiveness', async (req, res) => {
  try {
    const db = getDb();
    const mongodb = getMongoDB();

    if (!db || !mongodb) {
      return res.json({ teachers: [] });
    }

    // Get all teachers with their student_ids from SQLite students table
    let teachersWithStudents = [];
    try {
      teachersWithStudents = db.prepare(`
        SELECT u.id, u.name, u.email,
               COUNT(DISTINCT ch.id) as total_lessons,
               GROUP_CONCAT(DISTINCT s.student_id) as student_ids
        FROM users u
        LEFT JOIN chat_history ch ON ch.teacher_id = CAST(u.id AS TEXT)
        LEFT JOIN students s ON s.teacher_id = CAST(u.id AS TEXT)
        WHERE u.role = 'teacher'
        GROUP BY u.id
      `).all();
    } catch (sqlErr) {
      console.error('SQLite teacher-effectiveness error:', sqlErr.message);
      return res.json({ teachers: [] });
    }

    const testAttemptsCol = mongodb.collection('testattempts');

    // Find max lessons for normalization
    const maxLessons = Math.max(...teachersWithStudents.map(t => t.total_lessons || 0), 1);

    const results = [];

    for (const teacher of teachersWithStudents) {
      const studentIdStrs = teacher.student_ids ? teacher.student_ids.split(',').filter(Boolean) : [];

      let studentAvgAccuracy = 0;
      const studentCount = studentIdStrs.length;

      if (studentCount > 0) {
        // Try to match student IDs to MongoDB ObjectIds
        const mongoIds = [];
        for (const sid of studentIdStrs) {
          try {
            mongoIds.push(new mongoose.Types.ObjectId(sid));
          } catch {
            // Skip invalid ObjectIds
          }
        }

        if (mongoIds.length > 0) {
          const avgResult = await testAttemptsCol.aggregate([
            { $match: { userId: { $in: mongoIds } } },
            { $group: { _id: null, avg_accuracy: { $avg: '$accuracy' } } },
          ]).toArray();

          studentAvgAccuracy = avgResult[0]?.avg_accuracy || 0;
        }
      }

      const correlationScore = (studentAvgAccuracy * 0.6) +
        ((teacher.total_lessons || 0) * 0.4 / maxLessons * 100);

      results.push({
        name: teacher.name,
        email: teacher.email,
        total_lessons: teacher.total_lessons || 0,
        student_count: studentCount,
        student_avg_accuracy: Math.round(studentAvgAccuracy * 100) / 100,
        correlation_score: Math.round(correlationScore * 100) / 100,
      });
    }

    // Sort by student_avg_accuracy descending
    results.sort((a, b) => b.student_avg_accuracy - a.student_avg_accuracy);

    res.json({ teachers: results });
  } catch (err) {
    console.error('Teacher effectiveness error:', err);
    res.status(500).json({ error: 'Failed to load teacher effectiveness data' });
  }
});

// ============================
// FEATURE 6: Curriculum Coverage Heatmap
// ============================

// GET /api/analytics/curriculum-coverage?grade=
router.get('/curriculum-coverage', async (req, res) => {
  try {
    const mongodb = getMongoDB();
    if (!mongodb) {
      return res.json({ coverage: [], test_coverage: [] });
    }

    const sessionsCol = mongodb.collection('sessions');
    const testAttemptsCol = mongodb.collection('testattempts');

    // Session coverage by grade/subject/topic from metadata
    const sessionMatch = {};
    if (req.query.grade) {
      sessionMatch['metadata.grade'] = parseInt(req.query.grade);
    }

    const sessionCoverage = await sessionsCol.aggregate([
      { $match: { metadata: { $exists: true }, ...sessionMatch } },
      {
        $group: {
          _id: {
            grade: '$metadata.grade',
            subject: '$metadata.subject',
            topic: '$metadata.chapter',
          },
          session_count: { $sum: 1 },
        },
      },
      { $sort: { '_id.grade': 1, '_id.subject': 1, session_count: -1 } },
    ]).toArray();

    const coverage = sessionCoverage.map(c => ({
      grade: c._id.grade,
      subject: c._id.subject,
      topic: c._id.topic,
      session_count: c.session_count,
    }));

    // Test coverage by grade/subject/chapters
    const testMatch = {};
    if (req.query.grade) {
      testMatch.grade = parseInt(req.query.grade);
    }

    const testCoverage = await testAttemptsCol.aggregate([
      { $match: { chapters: { $exists: true, $ne: [] }, ...testMatch } },
      { $unwind: '$chapters' },
      {
        $group: {
          _id: {
            grade: '$grade',
            subject: '$subject',
            chapter: '$chapters',
          },
          test_count: { $sum: 1 },
        },
      },
      { $sort: { '_id.grade': 1, '_id.subject': 1, test_count: -1 } },
    ]).toArray();

    const test_coverage = testCoverage.map(t => ({
      grade: t._id.grade,
      subject: t._id.subject,
      chapter: t._id.chapter,
      test_count: t.test_count,
    }));

    res.json({ coverage, test_coverage });
  } catch (err) {
    console.error('Curriculum coverage error:', err);
    res.status(500).json({ error: 'Failed to load curriculum coverage' });
  }
});

// ============================
// FEATURE 7: Engagement Depth Metrics
// ============================

// GET /api/analytics/engagement
router.get('/engagement', async (req, res) => {
  try {
    const mongodb = getMongoDB();
    if (!mongodb) {
      return res.json({
        avg_messages: 0,
        abandoned_sessions: 0,
        deep_sessions: 0,
        total_sessions: 0,
        tool_engagement: [],
        avg_test_time: 0,
        returning_users: 0,
        returning_pct: 0,
      });
    }

    const sessionsCol = mongodb.collection('sessions');
    const testAttemptsCol = mongodb.collection('testattempts');
    const usersCol = mongodb.collection('users');

    // Session engagement metrics
    const [engagementAgg, abandonedAgg, deepAgg, totalSessions, toolEngagement] = await Promise.all([
      sessionsCol.aggregate([
        { $match: { messages: { $exists: true } } },
        {
          $group: {
            _id: null,
            avg_messages: { $avg: { $size: '$messages' } },
          },
        },
      ]).toArray(),
      sessionsCol.countDocuments({
        messages: { $exists: true },
        $expr: { $lte: [{ $size: '$messages' }, 1] },
      }),
      sessionsCol.countDocuments({
        messages: { $exists: true },
        $expr: { $gte: [{ $size: '$messages' }, 10] },
      }),
      sessionsCol.countDocuments(),
      sessionsCol.aggregate([
        { $match: { messages: { $exists: true }, tool: { $exists: true } } },
        {
          $group: {
            _id: '$tool',
            avg_messages: { $avg: { $size: '$messages' } },
            session_count: { $sum: 1 },
          },
        },
        { $sort: { session_count: -1 } },
      ]).toArray(),
    ]);

    const avgMessages = engagementAgg[0]?.avg_messages || 0;

    // Avg test time
    const testTimeAgg = await testAttemptsCol.aggregate([
      { $match: { timeTaken: { $exists: true, $gt: 0 } } },
      { $group: { _id: null, avg_time: { $avg: '$timeTaken' } } },
    ]).toArray();

    const avgTestTime = testTimeAgg[0]?.avg_time || 0;

    // Returning users: users who have sessions on at least 3 different days
    const returningAgg = await sessionsCol.aggregate([
      { $match: { userId: { $exists: true } } },
      {
        $group: {
          _id: {
            userId: '$userId',
            day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          },
        },
      },
      {
        $group: {
          _id: '$_id.userId',
          unique_days: { $sum: 1 },
        },
      },
      { $match: { unique_days: { $gte: 3 } } },
      { $count: 'count' },
    ]).toArray();

    const returningUsers = returningAgg[0]?.count || 0;
    const totalUsers = await usersCol.countDocuments();
    const returningPct = totalUsers > 0
      ? Math.round((returningUsers / totalUsers) * 10000) / 100
      : 0;

    res.json({
      avg_messages: Math.round(avgMessages * 100) / 100,
      abandoned_sessions: abandonedAgg,
      deep_sessions: deepAgg,
      total_sessions: totalSessions,
      tool_engagement: toolEngagement.map(t => ({
        tool: t._id,
        avg_messages: Math.round(t.avg_messages * 100) / 100,
        session_count: t.session_count,
      })),
      avg_test_time: Math.round(avgTestTime * 100) / 100,
      returning_users: returningUsers,
      returning_pct: returningPct,
    });
  } catch (err) {
    console.error('Engagement metrics error:', err);
    res.status(500).json({ error: 'Failed to load engagement metrics' });
  }
});

// ============================
// FEATURE 9: Comparative Analytics
// ============================

// GET /api/analytics/grade-comparison?grade1=&grade2=
router.get('/grade-comparison', async (req, res) => {
  try {
    const { grade1, grade2 } = req.query;

    if (!grade1 || !grade2) {
      return res.status(400).json({ error: 'grade1 and grade2 query params are required' });
    }

    const g1 = parseInt(grade1);
    const g2 = parseInt(grade2);

    const mongodb = getMongoDB();
    if (!mongodb) {
      return res.json({
        grade1: { grade: g1, students: 0, sessions: 0, tests: 0, avg_accuracy: 0 },
        grade2: { grade: g2, students: 0, sessions: 0, tests: 0, avg_accuracy: 0 },
      });
    }

    const usersCol = mongodb.collection('users');
    const sessionsCol = mongodb.collection('sessions');
    const testAttemptsCol = mongodb.collection('testattempts');

    const getGradeStats = async (grade) => {
      const studentCount = await usersCol.countDocuments({ grade });

      // Get student IDs for this grade
      const students = await usersCol.find({ grade }, { projection: { _id: 1 } }).toArray();
      const studentIds = students.map(s => s._id);

      let sessionCount = 0;
      let testCount = 0;
      let avgAccuracy = 0;

      if (studentIds.length > 0) {
        const [sessions, tests, accuracy] = await Promise.all([
          sessionsCol.countDocuments({ userId: { $in: studentIds } }),
          testAttemptsCol.countDocuments({ userId: { $in: studentIds } }),
          testAttemptsCol.aggregate([
            { $match: { userId: { $in: studentIds }, accuracy: { $exists: true } } },
            { $group: { _id: null, avg: { $avg: '$accuracy' } } },
          ]).toArray(),
        ]);

        sessionCount = sessions;
        testCount = tests;
        avgAccuracy = accuracy[0]?.avg || 0;
      }

      return {
        grade,
        students: studentCount,
        sessions: sessionCount,
        tests: testCount,
        avg_accuracy: Math.round(avgAccuracy * 100) / 100,
      };
    };

    const [stats1, stats2] = await Promise.all([
      getGradeStats(g1),
      getGradeStats(g2),
    ]);

    res.json({ grade1: stats1, grade2: stats2 });
  } catch (err) {
    console.error('Grade comparison error:', err);
    res.status(500).json({ error: 'Failed to load grade comparison' });
  }
});

// GET /api/analytics/subject-benchmarks
router.get('/subject-benchmarks', async (req, res) => {
  try {
    const mongodb = getMongoDB();
    if (!mongodb) {
      return res.json({ benchmarks: [] });
    }

    const testAttemptsCol = mongodb.collection('testattempts');

    const subjectStats = await testAttemptsCol.aggregate([
      { $match: { subject: { $exists: true }, accuracy: { $exists: true } } },
      {
        $group: {
          _id: '$subject',
          avg_accuracy: { $avg: '$accuracy' },
          total_tests: { $sum: 1 },
          avg_difficulty: { $avg: '$difficulty' },
        },
      },
      { $sort: { avg_accuracy: 1 } }, // lowest accuracy = hardest subject first
    ]).toArray();

    const benchmarks = subjectStats.map((s, index) => ({
      subject: s._id,
      avg_accuracy: Math.round((s.avg_accuracy || 0) * 100) / 100,
      total_tests: s.total_tests,
      difficulty_rank: index + 1,
    }));

    res.json({ benchmarks });
  } catch (err) {
    console.error('Subject benchmarks error:', err);
    res.status(500).json({ error: 'Failed to load subject benchmarks' });
  }
});

// ============================
// FEATURE 10: API Cost Tracking
// ============================

// GET /api/analytics/cost-tracking?days=30
router.get('/cost-tracking', async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, parseInt(req.query.days) || 30));
    const db = getDb();
    const mongodb = getMongoDB();

    const dailyCosts = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Cost constants
    const TOKENS_PER_LESSON = 2000;
    const TOKENS_PER_MESSAGE = 1500;
    const TOKENS_PER_TEST = 3000;
    const COST_PER_TOKEN = 0.0001;

    // Get daily lesson counts from SQLite
    const lessonsByDay = {};
    if (db) {
      try {
        const sinceDate = startDate.toISOString().split('T')[0];
        const rows = db.prepare(`
          SELECT DATE(created_at) as date, COUNT(*) as count
          FROM chat_history
          WHERE created_at >= ?
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `).all(sinceDate);

        rows.forEach(r => { lessonsByDay[r.date] = r.count; });
      } catch (sqlErr) {
        console.error('SQLite cost tracking error:', sqlErr.message);
      }
    }

    // Get daily message & test counts from MongoDB
    const messagesByDay = {};
    const testsByDay = {};

    if (mongodb) {
      try {
        const sessionsCol = mongodb.collection('sessions');
        const testAttemptsCol = mongodb.collection('testattempts');

        const [msgAgg, testAgg] = await Promise.all([
          sessionsCol.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                total_messages: { $sum: { $size: { $ifNull: ['$messages', []] } } },
              },
            },
            { $sort: { _id: 1 } },
          ]).toArray(),
          testAttemptsCol.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ]).toArray(),
        ]);

        msgAgg.forEach(m => { messagesByDay[m._id] = m.total_messages; });
        testAgg.forEach(t => { testsByDay[t._id] = t.count; });
      } catch (mongoErr) {
        console.error('MongoDB cost tracking error:', mongoErr.message);
      }
    }

    // Build daily breakdown
    let totalCost = 0;
    let totalClassroomAiCost = 0;
    let totalAiTutorCost = 0;

    const currentDate = new Date(startDate);
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];

      const lessons = lessonsByDay[dateStr] || 0;
      const messages = messagesByDay[dateStr] || 0;
      const tests = testsByDay[dateStr] || 0;

      const lessonCost = lessons * TOKENS_PER_LESSON * COST_PER_TOKEN;
      const messageCost = messages * TOKENS_PER_MESSAGE * COST_PER_TOKEN;
      const testCost = tests * TOKENS_PER_TEST * COST_PER_TOKEN;
      const dayCost = lessonCost + messageCost + testCost;

      totalCost += dayCost;
      totalClassroomAiCost += lessonCost;
      totalAiTutorCost += messageCost + testCost;

      if (lessons > 0 || messages > 0 || tests > 0) {
        dailyCosts.push({
          date: dateStr,
          lessons,
          messages,
          tests,
          total_calls: lessons + messages + tests,
          estimated_cost: Math.round(dayCost * 10000) / 10000,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const activeDays = dailyCosts.length || 1;

    res.json({
      daily_costs: dailyCosts,
      total_cost_period: Math.round(totalCost * 10000) / 10000,
      avg_daily_cost: Math.round((totalCost / activeDays) * 10000) / 10000,
      cost_by_platform: {
        classroom_ai: Math.round(totalClassroomAiCost * 10000) / 10000,
        ai_tutor: Math.round(totalAiTutorCost * 10000) / 10000,
      },
    });
  } catch (err) {
    console.error('Cost tracking error:', err);
    res.status(500).json({ error: 'Failed to load cost tracking data' });
  }
});

module.exports = router;
