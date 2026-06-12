const express = require('express');
const auth = require('../middleware/auth');
const { getDb } = require('../lib/sqlite');
const { getMongoDB } = require('../lib/mongodb');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);

    let onlineTeachers = [];
    let recentTeachers = [];

    const db = getDb();
    if (db) {
      try {
        const fiveMinAgoStr = fiveMinAgo.toISOString();
        const fifteenMinAgoStr = fifteenMinAgo.toISOString();

        onlineTeachers = db.prepare(`
          SELECT DISTINCT u.id, u.name, u.email, u.school_name,
            MAX(ch.created_at) as last_seen
          FROM users u
          INNER JOIN chat_history ch ON ch.teacher_id = CAST(u.id AS TEXT)
          WHERE u.role = 'teacher' AND ch.created_at >= ?
          GROUP BY u.id
          ORDER BY last_seen DESC
        `).all(fiveMinAgoStr);

        recentTeachers = db.prepare(`
          SELECT DISTINCT u.id, u.name, u.email, u.school_name,
            COALESCE(MAX(ch.created_at), u.last_login) as last_seen
          FROM users u
          LEFT JOIN chat_history ch ON ch.teacher_id = CAST(u.id AS TEXT) AND ch.created_at >= ?
          WHERE u.role = 'teacher'
            AND (u.last_login >= ? OR ch.created_at >= ?)
            AND u.id NOT IN (
              SELECT DISTINCT u2.id FROM users u2
              INNER JOIN chat_history ch2 ON ch2.teacher_id = CAST(u2.id AS TEXT)
              WHERE u2.role = 'teacher' AND ch2.created_at >= ?
            )
          GROUP BY u.id
          ORDER BY last_seen DESC
          LIMIT 10
        `).all(fifteenMinAgoStr, fifteenMinAgoStr, fifteenMinAgoStr, fiveMinAgoStr);
      } catch (sqlErr) {
        console.error('SQLite online query error:', sqlErr.message);
      }
    }

    let onlineStudents = [];
    let recentStudents = [];

    const mongodb = getMongoDB();
    if (mongodb) {
      try {
        const usersCol = mongodb.collection('users');
        const sessionsCol = mongodb.collection('sessions');

        const activeSessionUserIds = await sessionsCol.distinct('userId', {
          updatedAt: { $gte: fiveMinAgo },
        });

        const activeUserIds = await usersCol.distinct('_id', {
          updatedAt: { $gte: fiveMinAgo },
        });

        const allOnlineIds = [...new Set([
          ...activeSessionUserIds.map(id => id.toString()),
          ...activeUserIds.map(id => id.toString()),
        ])];

        if (allOnlineIds.length > 0) {
          const mongoose = require('mongoose');
          const objectIds = allOnlineIds.map(id => {
            try { return new mongoose.Types.ObjectId(id); } catch { return null; }
          }).filter(Boolean);

          onlineStudents = await usersCol.find(
            { _id: { $in: objectIds } },
            { projection: { name: 1, email: 1, grade: 1, updatedAt: 1 } }
          ).toArray();

          onlineStudents = onlineStudents.map(s => ({
            ...s,
            last_seen: s.updatedAt,
          }));
        }

        const recentSessionUserIds = await sessionsCol.distinct('userId', {
          updatedAt: { $gte: fifteenMinAgo, $lt: fiveMinAgo },
        });

        const recentUserIds = await usersCol.distinct('_id', {
          updatedAt: { $gte: fifteenMinAgo, $lt: fiveMinAgo },
        });

        const allRecentIds = [...new Set([
          ...recentSessionUserIds.map(id => id.toString()),
          ...recentUserIds.map(id => id.toString()),
        ])].filter(id => !allOnlineIds.includes(id));

        if (allRecentIds.length > 0) {
          const mongoose = require('mongoose');
          const objectIds = allRecentIds.map(id => {
            try { return new mongoose.Types.ObjectId(id); } catch { return null; }
          }).filter(Boolean);

          recentStudents = await usersCol.find(
            { _id: { $in: objectIds } },
            { projection: { name: 1, email: 1, grade: 1, updatedAt: 1 } }
          ).limit(10).toArray();

          recentStudents = recentStudents.map(s => ({
            ...s,
            last_seen: s.updatedAt,
          }));
        }
      } catch (mongoErr) {
        console.error('MongoDB online query error:', mongoErr.message);
      }
    }

    res.json({
      teachers: {
        online: onlineTeachers,
        recent: recentTeachers,
        online_count: onlineTeachers.length,
      },
      students: {
        online: onlineStudents,
        recent: recentStudents,
        online_count: onlineStudents.length,
      },
      total_online: onlineTeachers.length + onlineStudents.length,
    });
  } catch (err) {
    console.error('Online status error:', err);
    res.status(500).json({ error: 'Failed to fetch online status' });
  }
});

module.exports = router;
