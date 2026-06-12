import { Router } from 'express';
import { getSubjectsForGrade, getChaptersForSubject } from '../utils/curriculumData.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

router.get('/subjects/:grade', authMiddleware, (req, res) => {
  const grade = parseInt(req.params.grade);
  if (grade < 1 || grade > 12) return res.status(400).json({ error: 'Invalid grade' });
  res.json({ subjects: getSubjectsForGrade(grade) });
});

router.get('/chapters/:grade/:subject', authMiddleware, (req, res) => {
  const grade = parseInt(req.params.grade);
  const subject = decodeURIComponent(req.params.subject);
  res.json({ chapters: getChaptersForSubject(grade, subject) });
});

export default router;
