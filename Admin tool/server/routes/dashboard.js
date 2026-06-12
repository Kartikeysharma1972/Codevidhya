const express = require('express');
const auth = require('../middleware/auth');
const { getDb } = require('../lib/sqlite');
const { getMongoDB } = require('../lib/mongodb');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    let teacherTotal = 0;
    let lessonTotal = 0;
    let activeTeachersToday = 0;
    let toolUsage = [];
    let recentActivity = [];

    const db = getDb();
    if (db) {
      try {
        const today = new Date().toISOString().split('T')[0];

        const tc = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'teacher'").get();
        teacherTotal = tc?.count || 0;

        const lc = db.prepare('SELECT COUNT(*) as count FROM chat_history').get();
        lessonTotal = lc?.count || 0;

        const at = db.prepare(
          'SELECT COUNT(DISTINCT teacher_id) as count FROM chat_history WHERE created_at >= ?'
        ).get(today);
        activeTeachersToday = at?.count || 0;

        toolUsage = db.prepare(
          'SELECT tool_name, COUNT(*) as count FROM chat_history GROUP BY tool_name ORDER BY count DESC'
        ).all();

        recentActivity = db.prepare(`
          SELECT ch.id, ch.teacher_id, ch.tool_name, ch.topic, ch.grade_level, ch.subject,
                 ch.response_preview, ch.created_at, u.name as teacher_name, u.email as teacher_email
          FROM chat_history ch
          LEFT JOIN users u ON ch.teacher_id = CAST(u.id AS TEXT)
          ORDER BY ch.created_at DESC
          LIMIT 10
        `).all();
      } catch (sqlErr) {
        console.error('SQLite query error:', sqlErr.message);
      }
    }

    let totalStudents = 0, totalSessions = 0, totalTests = 0, activeStudentsToday = 0;
    const gradeDistMap = {};
    const toolUsageMap = {};
    toolUsage.forEach(t => { toolUsageMap[t.tool_name] = t.count; });

    // Trends - time-based comparisons
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const calcChangePct = (current, previous) => {
      const denom = Math.max(previous, 1);
      return Math.round(((current - previous) / denom) * 1000) / 10;
    };

    let newTeachersThisWeek = 0, newTeachersPrevWeek = 0;
    let lessonsThisWeek = 0, lessonsPrevWeek = 0;

    if (db) {
      try {
        const sevenDaysAgoStr = sevenDaysAgo.toISOString();
        const fourteenDaysAgoStr = fourteenDaysAgo.toISOString();

        const ntw = db.prepare(
          "SELECT COUNT(*) as count FROM users WHERE role = 'teacher' AND created_at >= ?"
        ).get(sevenDaysAgoStr);
        newTeachersThisWeek = ntw?.count || 0;

        const ntpw = db.prepare(
          "SELECT COUNT(*) as count FROM users WHERE role = 'teacher' AND created_at >= ? AND created_at < ?"
        ).get(fourteenDaysAgoStr, sevenDaysAgoStr);
        newTeachersPrevWeek = ntpw?.count || 0;

        const ltw = db.prepare(
          'SELECT COUNT(*) as count FROM chat_history WHERE created_at >= ?'
        ).get(sevenDaysAgoStr);
        lessonsThisWeek = ltw?.count || 0;

        const lpw = db.prepare(
          'SELECT COUNT(*) as count FROM chat_history WHERE created_at >= ? AND created_at < ?'
        ).get(fourteenDaysAgoStr, sevenDaysAgoStr);
        lessonsPrevWeek = lpw?.count || 0;
      } catch (sqlTrendErr) {
        console.error('SQLite trends error:', sqlTrendErr.message);
      }
    }

    let newStudentsThisWeek = 0, newStudentsPrevWeek = 0;
    let testsThisWeek = 0, testsPrevWeek = 0;

    const mongodb = getMongoDB();
    if (mongodb) {
      try {
        const usersCol = mongodb.collection('users');
        const sessionsCol = mongodb.collection('sessions');
        const testAttemptsCol = mongodb.collection('testattempts');

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [ts, ss, tt, ast, gd] = await Promise.all([
          usersCol.countDocuments(),
          sessionsCol.countDocuments(),
          testAttemptsCol.countDocuments(),
          usersCol.countDocuments({ updatedAt: { $gte: todayStart } }),
          usersCol.aggregate([
            { $group: { _id: '$grade', count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ]).toArray(),
        ]);

        totalStudents = ts;
        totalSessions = ss;
        totalTests = tt;
        activeStudentsToday = ast;
        gd.forEach(g => { gradeDistMap[g._id] = g.count; });

        // Trends - students and tests
        const [nstw, nspw, ttw, tpw] = await Promise.all([
          usersCol.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
          usersCol.countDocuments({ createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),
          testAttemptsCol.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
          testAttemptsCol.countDocuments({ createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),
        ]);

        newStudentsThisWeek = nstw;
        newStudentsPrevWeek = nspw;
        testsThisWeek = ttw;
        testsPrevWeek = tpw;
      } catch (mongoErr) {
        console.error('MongoDB query error:', mongoErr.message);
      }
    }

    const trends = {
      teachers: {
        current: newTeachersThisWeek,
        previous: newTeachersPrevWeek,
        change_pct: calcChangePct(newTeachersThisWeek, newTeachersPrevWeek),
      },
      students: {
        current: newStudentsThisWeek,
        previous: newStudentsPrevWeek,
        change_pct: calcChangePct(newStudentsThisWeek, newStudentsPrevWeek),
      },
      lessons: {
        current: lessonsThisWeek,
        previous: lessonsPrevWeek,
        change_pct: calcChangePct(lessonsThisWeek, lessonsPrevWeek),
      },
      tests: {
        current: testsThisWeek,
        previous: testsPrevWeek,
        change_pct: calcChangePct(testsThisWeek, testsPrevWeek),
      },
    };

    res.json({
      teachers: {
        total: teacherTotal,
        active_today: activeTeachersToday,
      },
      students: {
        total: totalStudents,
        active_today: activeStudentsToday,
        grade_distribution: gradeDistMap,
      },
      lessons: {
        total: lessonTotal,
        tool_usage: toolUsageMap,
      },
      tests: {
        total: totalTests,
      },
      trends,
      recent_activity: recentActivity,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

module.exports = router;
