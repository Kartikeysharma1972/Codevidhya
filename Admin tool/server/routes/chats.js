const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const { getDb } = require('../lib/sqlite');
const { getMongoDB } = require('../lib/mongodb');

const router = express.Router();

router.use(auth);

// GET /api/chats/teacher-chats - Paginated teacher AI chat history from SQLite
router.get('/teacher-chats', (req, res) => {
  try {
    const db = getDb();
    if (!db) {
      return res.json({ chats: [], total: 0, page: 1, limit: 20 });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    let whereClauses = [];
    let params = [];

    if (req.query.teacher_id) {
      whereClauses.push('ch.teacher_id = ?');
      params.push(String(req.query.teacher_id));
    }
    if (req.query.tool_filter) {
      whereClauses.push('ch.tool_name = ?');
      params.push(req.query.tool_filter);
    }
    if (req.query.search) {
      whereClauses.push('ch.topic LIKE ?');
      params.push(`%${req.query.search}%`);
    }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const total = db.prepare(
      `SELECT COUNT(*) as count FROM chat_history ch ${whereStr}`
    ).get(...params);

    const chats = db.prepare(`
      SELECT ch.id, ch.teacher_id, ch.tool_name, ch.topic, ch.grade_level, ch.subject,
             ch.response_preview, ch.created_at, u.name as teacher_name, u.email as teacher_email
      FROM chat_history ch
      LEFT JOIN users u ON ch.teacher_id = CAST(u.id AS TEXT)
      ${whereStr}
      ORDER BY ch.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const totalCount = total?.count || 0;
    res.json({
      chats,
      total: totalCount,
      page,
      pages: Math.ceil(totalCount / limit) || 1,
    });
  } catch (err) {
    console.error('Teacher chats error:', err);
    res.status(500).json({ error: 'Failed to load teacher chats' });
  }
});

// GET /api/chats/student-chats - Paginated student AI sessions from MongoDB
router.get('/student-chats', async (req, res) => {
  try {
    const mongodb = getMongoDB();
    if (!mongodb) {
      return res.json({ chats: [], total: 0, page: 1, pages: 1 });
    }
    const sessionsCol = mongodb.collection('sessions');
    const usersCol = mongodb.collection('users');

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // Build match filter
    const match = {};
    if (req.query.student_id) {
      try {
        match.userId = new mongoose.Types.ObjectId(req.query.student_id);
      } catch {
        return res.status(400).json({ error: 'Invalid student ID' });
      }
    }
    if (req.query.tool) {
      match.tool = req.query.tool;
    }
    if (req.query.search) {
      match.title = { $regex: req.query.search, $options: 'i' };
    }

    const [sessions, totalArr] = await Promise.all([
      sessionsCol.aggregate([
        { $match: match },
        { $sort: { updatedAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            userId: 1,
            tool: 1,
            title: 1,
            metadata: 1,
            messageCount: { $size: { $ifNull: ['$messages', []] } },
            createdAt: 1,
            updatedAt: 1,
            'user.name': 1,
            'user.email': 1,
            'user.grade': 1,
          },
        },
      ]).toArray(),
      sessionsCol.aggregate([
        { $match: match },
        { $count: 'total' },
      ]).toArray(),
    ]);

    const total = totalArr[0]?.total || 0;

    res.json({
      chats: sessions,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    console.error('Student chats error:', err);
    res.status(500).json({ error: 'Failed to load student chats' });
  }
});

// GET /api/chats/student-chats/:sessionId - Full session with all messages
router.get('/student-chats/:sessionId', async (req, res) => {
  try {
    const mongodb = getMongoDB();
    if (!mongodb) {
      return res.status(503).json({ error: 'Student database not available' });
    }
    const sessionsCol = mongodb.collection('sessions');

    let sessionId;
    try {
      sessionId = new mongoose.Types.ObjectId(req.params.sessionId);
    } catch {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    const session = await sessionsCol.aggregate([
      { $match: { _id: sessionId } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          userId: 1,
          tool: 1,
          title: 1,
          messages: 1,
          metadata: 1,
          createdAt: 1,
          updatedAt: 1,
          'user.name': 1,
          'user.email': 1,
          'user.grade': 1,
        },
      },
    ]).toArray();

    if (!session.length) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ session: session[0] });
  } catch (err) {
    console.error('Session detail error:', err);
    res.status(500).json({ error: 'Failed to load session' });
  }
});

module.exports = router;
