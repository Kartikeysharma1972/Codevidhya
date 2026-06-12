import { Router } from 'express';
import Session from '../models/Session.js';
import TestAttempt from '../models/TestAttempt.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { tool } = req.query;
    const filter = { userId: req.userId };
    if (tool) filter.tool = tool;
    const sessions = await Session.find(filter)
      .select('title tool createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(50);
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, userId: req.userId });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Session.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/tests/history', authMiddleware, async (req, res) => {
  try {
    const tests = await TestAttempt.find({ userId: req.userId })
      .select('subject chapters grade score totalQuestions accuracy createdAt')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ tests });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/tests/:id', authMiddleware, async (req, res) => {
  try {
    const test = await TestAttempt.findOne({ _id: req.params.id, userId: req.userId });
    if (!test) return res.status(404).json({ error: 'Test not found' });
    res.json({ test });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
