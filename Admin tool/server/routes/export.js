const express = require('express');
const auth = require('../middleware/auth');
const { getDb } = require('../lib/sqlite');
const { getMongoDB } = require('../lib/mongodb');

const router = express.Router();

router.use(auth);

// Helper: escape CSV field
function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// Helper: array of objects to CSV string
function toCSV(headers, rows) {
  const headerLine = headers.map(h => csvEscape(h.label)).join(',');
  const dataLines = rows.map(row =>
    headers.map(h => csvEscape(row[h.key])).join(',')
  );
  return [headerLine, ...dataLines].join('\n');
}

// GET /api/export/teachers?format=csv
router.get('/teachers', (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.status(503).json({ error: 'Teacher database not available' });
    }

    const teachers = db.prepare(`
      SELECT u.name, u.email, u.school_name,
             COUNT(ch.id) as total_lessons,
             MAX(ch.created_at) as last_active,
             u.created_at as joined_date
      FROM users u
      LEFT JOIN chat_history ch ON ch.teacher_id = CAST(u.id AS TEXT)
      WHERE u.role = 'teacher'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `).all();

    const headers = [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'school_name', label: 'School' },
      { key: 'total_lessons', label: 'Total Lessons' },
      { key: 'last_active', label: 'Last Active' },
      { key: 'joined_date', label: 'Joined Date' },
    ];

    const csv = toCSV(headers, teachers);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="teachers_report.csv"');
    res.send(csv);
  } catch (err) {
    console.error('Export teachers error:', err);
    res.status(500).json({ error: 'Failed to export teachers' });
  }
});

// GET /api/export/students?format=csv&grade=
router.get('/students', async (req, res) => {
  try {
    const mongodb = getMongoDB();
    if (!mongodb) {
      return res.status(503).json({ error: 'Student database not available' });
    }

    const usersCol = mongodb.collection('users');
    const sessionsCol = mongodb.collection('sessions');
    const testAttemptsCol = mongodb.collection('testattempts');

    const filter = {};
    if (req.query.grade) {
      filter.grade = parseInt(req.query.grade);
    }

    const students = await usersCol.find(filter, {
      projection: { name: 1, email: 1, grade: 1, createdAt: 1 },
    }).toArray();

    const studentIds = students.map(s => s._id);

    const [sessionCounts, testStats] = await Promise.all([
      sessionsCol.aggregate([
        { $match: { userId: { $in: studentIds } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
      ]).toArray(),
      testAttemptsCol.aggregate([
        { $match: { userId: { $in: studentIds } } },
        {
          $group: {
            _id: '$userId',
            count: { $sum: 1 },
            avg_accuracy: { $avg: '$accuracy' },
          },
        },
      ]).toArray(),
    ]);

    const sessionMap = {};
    sessionCounts.forEach(s => { sessionMap[s._id.toString()] = s.count; });

    const testMap = {};
    testStats.forEach(t => {
      testMap[t._id.toString()] = {
        count: t.count,
        avg_accuracy: Math.round((t.avg_accuracy || 0) * 100) / 100,
      };
    });

    const rows = students.map(s => ({
      name: s.name,
      email: s.email,
      grade: s.grade,
      sessions: sessionMap[s._id.toString()] || 0,
      tests: (testMap[s._id.toString()] || {}).count || 0,
      avg_accuracy: (testMap[s._id.toString()] || {}).avg_accuracy || 0,
      joined: s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : '',
    }));

    const headers = [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'grade', label: 'Grade' },
      { key: 'sessions', label: 'Sessions' },
      { key: 'tests', label: 'Tests' },
      { key: 'avg_accuracy', label: 'Avg Accuracy' },
      { key: 'joined', label: 'Joined' },
    ];

    const csv = toCSV(headers, rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="students_report.csv"');
    res.send(csv);
  } catch (err) {
    console.error('Export students error:', err);
    res.status(500).json({ error: 'Failed to export students' });
  }
});

// GET /api/export/analytics?format=csv
router.get('/analytics', async (req, res) => {
  try {
    const db = getDb();
    const mongodb = getMongoDB();

    const rows = [];

    // Tool usage from SQLite
    if (db) {
      try {
        const tools = db.prepare(`
          SELECT tool_name, COUNT(*) as count
          FROM chat_history
          GROUP BY tool_name
          ORDER BY count DESC
        `).all();

        tools.forEach(t => {
          rows.push({
            category: 'Tool Usage',
            metric: t.tool_name,
            value: t.count,
          });
        });
      } catch (sqlErr) {
        console.error('SQLite analytics export error:', sqlErr.message);
      }
    }

    // Grade performance from MongoDB
    if (mongodb) {
      try {
        const testAttemptsCol = mongodb.collection('testattempts');
        const gradePerf = await testAttemptsCol.aggregate([
          { $match: { accuracy: { $exists: true } } },
          {
            $group: {
              _id: '$grade',
              avg_accuracy: { $avg: '$accuracy' },
              total_tests: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]).toArray();

        gradePerf.forEach(g => {
          rows.push({
            category: 'Grade Performance',
            metric: 'Grade ' + g._id,
            value: Math.round((g.avg_accuracy || 0) * 100) / 100 + '% avg accuracy (' + g.total_tests + ' tests)',
          });
        });
      } catch (mongoErr) {
        console.error('MongoDB analytics export error:', mongoErr.message);
      }
    }

    const headers = [
      { key: 'category', label: 'Category' },
      { key: 'metric', label: 'Metric' },
      { key: 'value', label: 'Value' },
    ];

    const csv = toCSV(headers, rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="analytics_report.csv"');
    res.send(csv);
  } catch (err) {
    console.error('Export analytics error:', err);
    res.status(500).json({ error: 'Failed to export analytics' });
  }
});

// GET /api/export/report - Full JSON summary report
router.get('/report', async (req, res) => {
  try {
    const db = getDb();
    const mongodb = getMongoDB();

    const report = {
      generated_at: new Date().toISOString(),
      overview: {
        total_teachers: 0,
        total_students: 0,
        total_lessons: 0,
        total_tests: 0,
        total_sessions: 0,
      },
      tool_usage: [],
      top_teachers: [],
      grade_performance: [],
      engagement: {
        active_teachers_today: 0,
        active_students_today: 0,
      },
      at_risk_count: 0,
    };

    // SQLite data
    if (db) {
      try {
        const tc = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'teacher'").get();
        report.overview.total_teachers = tc?.count || 0;

        const lc = db.prepare('SELECT COUNT(*) as count FROM chat_history').get();
        report.overview.total_lessons = lc?.count || 0;

        const today = new Date().toISOString().split('T')[0];
        const at = db.prepare(
          'SELECT COUNT(DISTINCT teacher_id) as count FROM chat_history WHERE created_at >= ?'
        ).get(today);
        report.engagement.active_teachers_today = at?.count || 0;

        report.tool_usage = db.prepare(
          'SELECT tool_name, COUNT(*) as count FROM chat_history GROUP BY tool_name ORDER BY count DESC'
        ).all();

        report.top_teachers = db.prepare(`
          SELECT ch.teacher_id, u.name, u.email, u.school_name,
                 COUNT(*) as total_lessons,
                 MAX(ch.created_at) as last_activity
          FROM chat_history ch
          LEFT JOIN users u ON ch.teacher_id = CAST(u.id AS TEXT)
          GROUP BY ch.teacher_id
          ORDER BY total_lessons DESC
          LIMIT 10
        `).all();
      } catch (sqlErr) {
        console.error('SQLite report error:', sqlErr.message);
      }
    }

    // MongoDB data
    if (mongodb) {
      try {
        const usersCol = mongodb.collection('users');
        const sessionsCol = mongodb.collection('sessions');
        const testAttemptsCol = mongodb.collection('testattempts');

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [totalStudents, totalSessions, totalTests, activeStudents, gradePerf] = await Promise.all([
          usersCol.countDocuments(),
          sessionsCol.countDocuments(),
          testAttemptsCol.countDocuments(),
          usersCol.countDocuments({ updatedAt: { $gte: todayStart } }),
          testAttemptsCol.aggregate([
            { $match: { accuracy: { $exists: true } } },
            {
              $group: {
                _id: '$grade',
                avg_accuracy: { $avg: '$accuracy' },
                total_tests: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ]).toArray(),
        ]);

        report.overview.total_students = totalStudents;
        report.overview.total_sessions = totalSessions;
        report.overview.total_tests = totalTests;
        report.engagement.active_students_today = activeStudents;

        report.grade_performance = gradePerf.map(g => ({
          grade: g._id,
          avg_accuracy: Math.round((g.avg_accuracy || 0) * 100) / 100,
          total_tests: g.total_tests,
        }));

        // At-risk count (struggling students with < 40% accuracy)
        const strugglingCount = await testAttemptsCol.aggregate([
          {
            $group: {
              _id: '$userId',
              avg_accuracy: { $avg: '$accuracy' },
            },
          },
          { $match: { avg_accuracy: { $lt: 40 } } },
          { $count: 'count' },
        ]).toArray();

        report.at_risk_count = strugglingCount[0]?.count || 0;
      } catch (mongoErr) {
        console.error('MongoDB report error:', mongoErr.message);
      }
    }

    res.json(report);
  } catch (err) {
    console.error('Export report error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;
