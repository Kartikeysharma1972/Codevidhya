const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const FlaggedChat = require('../models/FlaggedChat');
const { getDb } = require('../lib/sqlite');
const { getMongoDB } = require('../lib/mongodb');

const router = express.Router();

router.use(auth);

// POST /api/moderation/flag - Flag a chat
router.post('/flag', async (req, res) => {
  try {
    const { chatType, chatId, reason } = req.body;

    if (!chatType || !chatId || !reason) {
      return res.status(400).json({ error: 'chatType, chatId, and reason are required' });
    }

    if (!['teacher', 'student'].includes(chatType)) {
      return res.status(400).json({ error: 'chatType must be "teacher" or "student"' });
    }

    const flag = new FlaggedChat({
      chatType,
      chatId,
      reason,
      flaggedBy: req.admin._id.toString(),
    });

    await flag.save();

    res.status(201).json({ flag });
  } catch (err) {
    console.error('Flag chat error:', err);
    res.status(500).json({ error: 'Failed to flag chat' });
  }
});

// GET /api/moderation/flagged?status=pending&page=1&limit=20
router.get('/flagged', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const [flags, total] = await Promise.all([
      FlaggedChat.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FlaggedChat.countDocuments(filter),
    ]);

    // Enrich with original chat data
    const enrichedFlags = [];
    const db = getDb();
    const mongodb = getMongoDB();

    for (const flag of flags) {
      const enriched = { ...flag };

      if (flag.chatType === 'teacher' && db) {
        try {
          const chat = db.prepare(
            'SELECT id, teacher_id, tool_name, topic, grade_level, subject, created_at FROM chat_history WHERE id = ?'
          ).get(flag.chatId);
          enriched.chatData = chat || null;
        } catch (sqlErr) {
          enriched.chatData = null;
        }
      } else if (flag.chatType === 'student' && mongodb) {
        try {
          let sessionId;
          try {
            sessionId = new mongoose.Types.ObjectId(flag.chatId);
          } catch {
            enriched.chatData = null;
            enrichedFlags.push(enriched);
            continue;
          }

          const sessionsCol = mongodb.collection('sessions');
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
                title: 1,
                tool: 1,
                'user.name': 1,
                'user.email': 1,
                createdAt: 1,
              },
            },
          ]).toArray();

          enriched.chatData = session[0] || null;
        } catch {
          enriched.chatData = null;
        }
      }

      enrichedFlags.push(enriched);
    }

    res.json({
      flags: enrichedFlags,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    console.error('List flagged error:', err);
    res.status(500).json({ error: 'Failed to load flagged chats' });
  }
});

// PUT /api/moderation/flagged/:id/review - Update flag status
router.put('/flagged/:id/review', async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;

    if (!status || !['pending', 'reviewed', 'escalated', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required (pending, reviewed, escalated, dismissed)' });
    }

    let flagId;
    try {
      flagId = new mongoose.Types.ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: 'Invalid flag ID' });
    }

    const flag = await FlaggedChat.findByIdAndUpdate(
      flagId,
      {
        status,
        reviewNotes: reviewNotes || '',
        reviewedBy: req.admin._id.toString(),
        reviewedAt: new Date(),
      },
      { new: true }
    );

    if (!flag) {
      return res.status(404).json({ error: 'Flagged chat not found' });
    }

    res.json({ flag });
  } catch (err) {
    console.error('Review flag error:', err);
    res.status(500).json({ error: 'Failed to review flagged chat' });
  }
});

// GET /api/moderation/stats
router.get('/stats', async (req, res) => {
  try {
    const [total, pending, reviewed, escalated, dismissed] = await Promise.all([
      FlaggedChat.countDocuments(),
      FlaggedChat.countDocuments({ status: 'pending' }),
      FlaggedChat.countDocuments({ status: 'reviewed' }),
      FlaggedChat.countDocuments({ status: 'escalated' }),
      FlaggedChat.countDocuments({ status: 'dismissed' }),
    ]);

    res.json({
      total_flagged: total,
      pending,
      reviewed,
      escalated,
      dismissed,
    });
  } catch (err) {
    console.error('Moderation stats error:', err);
    res.status(500).json({ error: 'Failed to load moderation stats' });
  }
});

// POST /api/moderation/scan - Scan recent student chats for keywords
router.post('/scan', async (req, res) => {
  try {
    const mongodb = getMongoDB();
    if (!mongodb) {
      return res.json({ new_flags: 0, message: 'Student database not available' });
    }

    const sessionsCol = mongodb.collection('sessions');

    const keywords = ['hate', 'kill', 'die', 'suicide', 'weapon', 'gun', 'drugs', 'bully', 'threat', 'hurt', 'abuse'];

    // Only scan last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // Get sessions from last 24 hours that have messages
    const recentSessions = await sessionsCol.find(
      {
        updatedAt: { $gte: oneDayAgo },
        messages: { $exists: true, $ne: [] },
      },
      { projection: { _id: 1, messages: 1 } }
    ).toArray();

    // Get already flagged chat IDs to avoid re-flagging
    const existingFlags = await FlaggedChat.find(
      { chatType: 'student', autoFlagged: true },
      { chatId: 1 }
    ).lean();
    const existingFlagIds = new Set(existingFlags.map(f => f.chatId));

    let newFlagCount = 0;
    const flagsToCreate = [];

    for (const session of recentSessions) {
      const sessionIdStr = session._id.toString();

      if (existingFlagIds.has(sessionIdStr)) {
        continue;
      }

      // Check each message for keywords
      const foundKeywords = new Set();
      if (Array.isArray(session.messages)) {
        for (const msg of session.messages) {
          const content = (msg.content || msg.text || '').toLowerCase();
          for (const keyword of keywords) {
            if (content.includes(keyword)) {
              foundKeywords.add(keyword);
            }
          }
        }
      }

      if (foundKeywords.size > 0) {
        flagsToCreate.push({
          chatType: 'student',
          chatId: sessionIdStr,
          reason: 'Auto-flagged: contains keywords: ' + Array.from(foundKeywords).join(', '),
          autoFlagged: true,
          keywords: Array.from(foundKeywords),
          status: 'pending',
          createdAt: new Date(),
        });
        newFlagCount++;
      }
    }

    if (flagsToCreate.length > 0) {
      await FlaggedChat.insertMany(flagsToCreate);
    }

    res.json({ new_flags: newFlagCount });
  } catch (err) {
    console.error('Scan error:', err);
    res.status(500).json({ error: 'Failed to scan chats' });
  }
});

module.exports = router;
