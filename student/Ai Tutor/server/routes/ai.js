import { Router } from 'express';
import Groq from 'groq-sdk';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import authMiddleware from '../middleware/auth.js';
import User from '../models/User.js';
import Session from '../models/Session.js';
import TestAttempt from '../models/TestAttempt.js';
import { buildSystemPrompt, getMockTestConfig, getExpectedTypes, isComputerScience } from '../utils/gradePrompts.js';
import { searchWikipediaImage, searchMultipleImages } from '../utils/imageSearch.js';
import { getAvoidList, dedupeAgainst, recordQuestions } from '../utils/questionMemory.js';

const router = Router();
let groq;
function getGroq() {
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groq;
}

// Non-Latin scripts (Hindi, Telugu, Tamil, etc.) tokenize into ~2-3x more tokens
// than English, so the English-tuned max_tokens budgets truncate regional output
// mid-answer (broken mock-test JSON, cut-off study notes). Bump the budget for
// non-English languages, capped to stay within the model's completion limit.
function scaleTokens(maxTokens, language) {
  const lang = (language || 'English').trim();
  if (!lang || lang === 'English') return maxTokens;
  return Math.min(12000, Math.round(maxTokens * 2.2));
}

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/webp',
      'application/pdf', 'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Placeholder pattern injected when an image/file is attached.
// Don't send these stubs back to the model on later turns — they have no signal.
const PLACEHOLDER_RE = /^\[(?:Image uploaded|File:[^\]]*)\]\s*/;

function toPlain(messages) {
  return messages.map(m => ({ role: m.role, content: m.content }));
}

function stripPlaceholders(messages) {
  return messages
    .map(m => {
      if (m.role !== 'user' || typeof m.content !== 'string') return m;
      const stripped = m.content.replace(PLACEHOLDER_RE, '').trim();
      return stripped ? { role: m.role, content: stripped } : null;
    })
    .filter(Boolean);
}

async function chatWithGroq(systemPrompt, messages, options = {}) {
  const plain = toPlain(messages);
  const cleaned = options.skipPlaceholderFilter ? plain : stripPlaceholders(plain);
  // Drop any leading assistant message (model expects user-first after system)
  const trimmed = cleaned.length && cleaned[0].role === 'assistant' ? cleaned.slice(1) : cleaned;
  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...trimmed,
  ].filter(m => m.role && m.content);

  const response = await getGroq().chat.completions.create({
    model: options.model || 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: formattedMessages,
    temperature: options.temperature ?? 0.7,
    max_tokens: scaleTokens(options.maxTokens || 4096, options.language),
    ...(options.jsonMode ? { response_format: { type: 'json_object' } } : {}),
  });

  return response.choices[0]?.message?.content || '';
}


async function chatWithGroqVision(systemPrompt, textContent, imageBase64, mimeType, language) {
  const response = await getGroq().chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: textContent },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
        ],
      },
    ],
    temperature: 0.7,
    max_tokens: scaleTokens(4096, language),
  });

  return response.choices[0]?.message?.content || '';
}

// ---------- CONCEPT EXPLAINER ----------
router.post('/concept-explainer', authMiddleware, async (req, res) => {
  try {
    const { message, sessionId, explanationLevel, subject, chapter } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const systemPrompt = buildSystemPrompt(user.grade, 'concept-explainer', {
      explanationLevel: explanationLevel || 'beginner',
      subject, chapter, language: user.language,
    });

    let session;
    if (sessionId) {
      session = await Session.findOne({ _id: sessionId, userId: req.userId });
    }
    if (!session) {
      session = new Session({
        userId: req.userId,
        tool: 'concept-explainer',
        title: message.substring(0, 60),
        messages: [],
        metadata: { explanationLevel, subject, chapter },
      });
    }

    session.messages.push({ role: 'user', content: message });

    const aiResponse = await chatWithGroq(systemPrompt, session.messages, { language: user.language });

    session.messages.push({ role: 'assistant', content: aiResponse });
    await session.save();

    res.json({ response: aiResponse, sessionId: session._id });
  } catch (err) {
    console.error('Concept explainer error:', err);
    res.status(500).json({ error: 'AI service error' });
  }
});

// ---------- CONCEPT EXPLAINER WITH IMAGE ----------
router.post('/concept-explainer/image', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { message, sessionId, explanationLevel, subject, chapter } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const systemPrompt = buildSystemPrompt(user.grade, 'concept-explainer', {
      explanationLevel: explanationLevel || 'beginner',
      subject, chapter, language: user.language,
    });

    const imageBuffer = fs.readFileSync(req.file.path);
    const imageBase64 = imageBuffer.toString('base64');
    const mimeType = req.file.mimetype;

    const aiResponse = await chatWithGroqVision(
      systemPrompt,
      message || 'Explain what is shown in this image.',
      imageBase64,
      mimeType,
      user.language
    );

    fs.unlinkSync(req.file.path);

    let session;
    if (sessionId) {
      session = await Session.findOne({ _id: sessionId, userId: req.userId });
    }
    if (!session) {
      session = new Session({
        userId: req.userId,
        tool: 'concept-explainer',
        title: (message || 'Image question').substring(0, 60),
        messages: [],
      });
    }

    session.messages.push({ role: 'user', content: `[Image uploaded] ${message || ''}` });
    session.messages.push({ role: 'assistant', content: aiResponse });
    await session.save();

    res.json({ response: aiResponse, sessionId: session._id });
  } catch (err) {
    console.error('Image explainer error:', err);
    if (req.file?.path) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'AI service error' });
  }
});

// ---------- CONCEPT EXPLAINER WITH FILE ----------
router.post('/concept-explainer/file', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { message, sessionId, explanationLevel, subject, chapter } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    let fileContent = '';
    const mime = req.file.mimetype;

    if (mime === 'application/pdf') {
      const pdfParse = (await import('pdf-parse')).default;
      const dataBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdfParse(dataBuffer);
      fileContent = pdfData.text;
    } else if (mime === 'text/plain') {
      fileContent = fs.readFileSync(req.file.path, 'utf-8');
    } else if (mime === 'application/msword' || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Word document support is coming soon. Please convert to PDF or paste the text directly.' });
    } else {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Unsupported file type. Please upload PDF or TXT files.' });
    }

    fs.unlinkSync(req.file.path);

    if (!fileContent.trim()) return res.status(400).json({ error: 'Could not extract text from the file' });

    const systemPrompt = buildSystemPrompt(user.grade, 'concept-explainer', {
      explanationLevel: explanationLevel || 'beginner',
      subject, chapter, language: user.language,
    });

    const userContent = `The student has uploaded a document. Here is the extracted text from the file:\n\n---\n${fileContent.substring(0, 15000)}\n---\n\n${message || 'Please explain the concepts in this document.'}`;

    let session;
    if (sessionId) {
      session = await Session.findOne({ _id: sessionId, userId: req.userId });
    }
    if (!session) {
      session = new Session({
        userId: req.userId,
        tool: 'concept-explainer',
        title: (message || `File: ${req.file.originalname}`).substring(0, 60),
        messages: [],
        metadata: { explanationLevel, subject, chapter },
      });
    }

    session.messages.push({ role: 'user', content: `[File: ${req.file.originalname}] ${message || ''}` });

    const allMessages = [...session.messages.slice(0, -1), { role: 'user', content: userContent }];
    const aiResponse = await chatWithGroq(systemPrompt, allMessages, { language: user.language });

    session.messages.push({ role: 'assistant', content: aiResponse });
    await session.save();

    res.json({ response: aiResponse, sessionId: session._id });
  } catch (err) {
    console.error('File explainer error:', err);
    if (req.file?.path) try { fs.unlinkSync(req.file.path); } catch {}
    res.status(500).json({ error: 'AI service error' });
  }
});

// ---------- DOCUMENT SUMMARIZER ----------
router.post('/summarize', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { text, mode, query, sessionId } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let content = text || '';

    if (req.file) {
      if (req.file.mimetype === 'application/pdf') {
        const pdfParse = (await import('pdf-parse')).default;
        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(dataBuffer);
        content = pdfData.text;
      } else if (req.file.mimetype.startsWith('image/')) {
        const imageBuffer = fs.readFileSync(req.file.path);
        const imageBase64 = imageBuffer.toString('base64');
        const systemPrompt = buildSystemPrompt(user.grade, 'document-summarizer', {
          summarizationMode: mode || 'full',
          query, language: user.language,
        });
        const aiResponse = await chatWithGroqVision(
          systemPrompt,
          `${mode === 'search' ? `Find and answer: ${query}` : `Provide a ${mode || 'full'} summary of this document/page.`}`,
          imageBase64,
          req.file.mimetype,
          user.language
        );
        fs.unlinkSync(req.file.path);

        let imgSession;
        if (sessionId) {
          imgSession = await Session.findOne({ _id: sessionId, userId: req.userId });
        }
        if (!imgSession) {
          imgSession = new Session({
            userId: req.userId,
            tool: 'document-summarizer',
            title: `Image — ${mode || 'full'}`,
            messages: [],
            metadata: { summarizationMode: mode },
          });
        }
        imgSession.messages.push({ role: 'user', content: `[Image uploaded] Mode: ${mode}` });
        imgSession.messages.push({ role: 'assistant', content: aiResponse });
        await imgSession.save();

        return res.json({ response: aiResponse, sessionId: imgSession._id });
      }
      fs.unlinkSync(req.file.path);
    }

    if (!content) return res.status(400).json({ error: 'No content provided' });

    const systemPrompt = buildSystemPrompt(user.grade, 'document-summarizer', {
      summarizationMode: mode || 'full',
      query, language: user.language,
    });

    const aiResponse = await chatWithGroq(systemPrompt, [
      { role: 'user', content: `Document content:\n\n${content.substring(0, 15000)}\n\n${mode === 'search' ? `Question: ${query}` : `Provide a ${mode || 'full'} summary.`}` },
    ], { language: user.language });

    let session;
    if (sessionId) {
      session = await Session.findOne({ _id: sessionId, userId: req.userId });
    }
    if (!session) {
      session = new Session({
        userId: req.userId,
        tool: 'document-summarizer',
        title: `Summary — ${mode || 'full'}`,
        messages: [],
        metadata: { summarizationMode: mode },
      });
    }
    session.messages.push({ role: 'user', content: `[Document uploaded] Mode: ${mode}` });
    session.messages.push({ role: 'assistant', content: aiResponse });
    await session.save();

    res.json({ response: aiResponse, sessionId: session._id });
  } catch (err) {
    console.error('Summarizer error:', err);
    if (req.file?.path) try { fs.unlinkSync(req.file.path); } catch {}
    res.status(500).json({ error: 'AI service error' });
  }
});

// ---------- PROJECT IDEA GENERATOR ----------
// Pull the titles of project ideas this student has already been shown for the
// same subject, so regenerations keep producing genuinely new ideas.
async function getRecentProjectTitles(userId, subject, limit = 40) {
  try {
    const sessions = await Session.find({ userId, tool: 'project-generator', 'metadata.subject': subject })
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('messages')
      .lean();
    const titles = [];
    const re = /###?\s*(?:💡\s*)?Idea\s*\d+\s*[—\-:]\s*(.+)/g;
    for (const s of sessions) {
      for (const m of (s.messages || [])) {
        if (m.role !== 'assistant' || typeof m.content !== 'string') continue;
        let mt;
        while ((mt = re.exec(m.content)) !== null) {
          const t = mt[1].replace(/[*_`#]/g, '').trim();
          if (t) titles.push(t);
        }
      }
    }
    return [...new Set(titles)].slice(0, limit);
  } catch {
    return [];
  }
}

router.post('/project-ideas', authMiddleware, async (req, res) => {
  try {
    const { subject, projectType, topic, sessionId } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const avoidIdeas = await getRecentProjectTitles(req.userId, subject, 40);

    const systemPrompt = buildSystemPrompt(user.grade, 'project-generator', {
      subject, projectType, topic, count: 4, avoidIdeas, language: user.language,
    });

    const aiResponse = await chatWithGroq(systemPrompt, [
      { role: 'user', content: `Generate project ideas for ${subject}${topic ? ` on topic: ${topic}` : ''}, project type: ${projectType || 'any'}. Make them brand new — different from anything suggested before.` },
    ], { temperature: 0.9, maxTokens: 5000, language: user.language });

    let session;
    if (sessionId) {
      session = await Session.findOne({ _id: sessionId, userId: req.userId });
    }
    if (!session) {
      session = new Session({
        userId: req.userId,
        tool: 'project-generator',
        title: `Projects — ${subject}`,
        messages: [],
        metadata: { subject, projectType },
      });
    }
    session.messages.push({ role: 'user', content: `Subject: ${subject}, Type: ${projectType || 'any'}${topic ? `, Topic: ${topic}` : ''}` });
    session.messages.push({ role: 'assistant', content: aiResponse });
    await session.save();

    res.json({ response: aiResponse, sessionId: session._id });
  } catch (err) {
    console.error('Project generator error:', err);
    res.status(500).json({ error: 'AI service error' });
  }
});

// ---------- MOCK TEST GENERATOR ----------
function validateQuestionDiversity(questions, grade, subject) {
  const expectedTypes = getExpectedTypes(grade, isComputerScience(subject));
  const typesUsed = new Set(questions.map(q => q.type).filter(Boolean));
  // Demand at least half of the expected types (capped at 5) — prevents "all MCQ" tests
  const minTypesRequired = Math.min(5, Math.max(3, Math.ceil(expectedTypes.length / 2)));
  return typesUsed.size >= minTypesRequired;
}

function fixQuestionTypes(questions, grade, subject) {
  const expectedTypes = getExpectedTypes(grade, isComputerScience(subject));
  return questions.map(q => {
    if (!q.type || !expectedTypes.includes(q.type)) {
      if (q.options && q.options.length > 0) q.type = 'mcq';
      else if (q.pairs) q.type = 'match-following';
      else if (q.items) q.type = 'sequence-ordering';
      else q.type = 'fill-blank';
    }
    return q;
  });
}

function sanitizeQuestions(questions) {
  return questions.filter(q => {
    if (!q || typeof q.question !== 'string' || !q.question.trim()) return false;
    if (!q.correctAnswer && q.correctAnswer !== 0) return false;
    if (['match-following', 'matrix-match'].includes(q.type)) {
      if (!Array.isArray(q.pairs) || q.pairs.length < 2) return false;
      if (!q.pairs.every(p => p && p.left && p.right)) return false;
    }
    if (q.type === 'sequence-ordering') {
      if (!Array.isArray(q.items) || q.items.length < 3) return false;
    }
    if (['mcq', 'true-false', 'multi-select', 'assertion-reason', 'case-study', 'hots', 'code-output'].includes(q.type)) {
      if (!Array.isArray(q.options) || q.options.length < 2) return false;
    }
    return true;
  });
}

router.post('/mock-test/generate', authMiddleware, async (req, res) => {
  try {
    const { subject, chapters, questionType, questionCount } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const config = getMockTestConfig(user.grade);
    if (questionCount && [10, 15, 20, 25, 30].includes(questionCount)) {
      config.totalQuestions = questionCount;
      config.totalTime = Math.max(15, Math.round(questionCount * 1.8));
    }

    // Per-student question memory: never repeat a question this student has
    // already been shown for this subject.
    const avoid = await getAvoidList(req.userId, subject, 200);

    const systemPrompt = buildSystemPrompt(user.grade, 'mock-test', {
      subject,
      chapters,
      questionType: questionType || null,
      questionCount: config.totalQuestions,
      avoidQuestions: avoid.texts,
      language: user.language,
    });

    let questions = [];
    const maxAttempts = 3;
    const wantSpecificType = questionType && questionType !== 'surprise';

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const typeInstruction = wantSpecificType
        ? `Generate ALL ${config.totalQuestions} questions of type "${questionType}" ONLY.`
        : 'You MUST use a variety of question types as specified.';

      const aiResponse = await chatWithGroq(systemPrompt, [
        { role: 'user', content: `Generate a mock test for ${subject}, chapters: ${chapters?.join(', ') || 'All chapters'}. ${typeInstruction} Every question must be NEW (not in the do-not-repeat list). Return ONLY valid JSON: {"questions": [...]}` },
      ], { jsonMode: true, temperature: 0.45 + (attempt * 0.15), maxTokens: 8000, language: user.language });

      try {
        const parsed = JSON.parse(aiResponse);
        questions = Array.isArray(parsed) ? parsed : parsed.questions || [];
      } catch {
        const match = aiResponse.match(/\[[\s\S]*\]/);
        questions = match ? JSON.parse(match[0]) : [];
      }

      questions = fixQuestionTypes(questions, user.grade, subject);
      questions = sanitizeQuestions(questions);
      // For non-CS subjects, hard-drop any coding questions the model slipped in.
      if (!isComputerScience(subject)) {
        questions = questions.filter(q => q.type !== 'code-output');
      }
      // Drop anything already served to this student + any in-set duplicates.
      questions = dedupeAgainst(questions, avoid.hashes);

      const minCount = Math.floor(config.totalQuestions * 0.8);
      if (wantSpecificType) {
        if (questions.length >= minCount) break;
      } else {
        if (questions.length >= minCount && validateQuestionDiversity(questions, user.grade, subject)) break;
      }
    }

    // Remember what we just served so it never comes back for this student.
    await recordQuestions(req.userId, user.grade, subject, (chapters || []).join(', '), 'mock-test', questions);

    res.json({ questions, config });
  } catch (err) {
    console.error('Mock test generation error:', err);
    res.status(500).json({ error: 'AI service error' });
  }
});

// ---------- MOCK TEST SUBMIT ----------
router.post('/mock-test/submit', authMiddleware, async (req, res) => {
  try {
    const { subject, chapters, questions, timeTaken } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const config = getMockTestConfig(user.grade);
    let score = 0;
    const topicAccuracy = {};

    const normalize = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const normalizeSet = (s) => normalize(s).split(',').map(x => x.trim()).filter(Boolean).sort().join(',');
    const normalizeOrdered = (s) => normalize(s).split(',').map(x => x.trim()).filter(Boolean).join(',');
    const normalizeNumber = (s) => {
      const m = String(s || '').replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
      return m ? parseFloat(m[0]) : NaN;
    };
    const letterFromAnswer = (answer, options) => {
      if (!answer || !Array.isArray(options)) return null;
      const a = normalize(answer);
      if (/^[a-j]$/.test(a)) return a.toUpperCase();
      const idx = options.findIndex(o => normalize(o) === a);
      return idx >= 0 ? String.fromCharCode(65 + idx) : null;
    };
    // For multi-select, AI may give correctAnswer as option text instead of letters
    // (or vice versa from student). Convert both sides to canonical letter sets.
    const lettersFromList = (str, options) => {
      if (!str) return '';
      const parts = String(str).split(',').map(s => s.trim()).filter(Boolean);
      const letters = parts.map(p => letterFromAnswer(p, options)).filter(Boolean);
      return letters.sort().join(',').toUpperCase();
    };
    const optionsCompare = (student, correct, options) => {
      if (normalize(student) === normalize(correct)) return true;
      const sl = letterFromAnswer(student, options);
      const cl = letterFromAnswer(correct, options);
      return !!(sl && cl && sl === cl);
    };

    const gradedQuestions = questions.map(q => {
      let isCorrect = false;
      const type = q.type || 'mcq';
      if (type === 'sequence-ordering') {
        isCorrect = normalizeOrdered(q.studentAnswer) === normalizeOrdered(q.correctAnswer);
      } else if (type === 'multi-select') {
        // Try canonical letter-set compare first (handles AI returning option text)
        const sLetters = lettersFromList(q.studentAnswer, q.options);
        const cLetters = lettersFromList(q.correctAnswer, q.options);
        if (sLetters && cLetters) isCorrect = sLetters === cLetters;
        else isCorrect = normalizeSet(q.studentAnswer) === normalizeSet(q.correctAnswer);
      } else if (['match-following', 'matrix-match'].includes(type)) {
        isCorrect = normalizeSet(q.studentAnswer) === normalizeSet(q.correctAnswer);
      } else if (['numerical', 'integer-type'].includes(type)) {
        const s = normalizeNumber(q.studentAnswer);
        const c = normalizeNumber(q.correctAnswer);
        isCorrect = !Number.isNaN(s) && !Number.isNaN(c) && Math.abs(s - c) < 0.01;
      } else if (Array.isArray(q.options) && q.options.length > 0) {
        isCorrect = optionsCompare(q.studentAnswer, q.correctAnswer, q.options);
      } else {
        isCorrect = normalize(q.studentAnswer) === normalize(q.correctAnswer);
      }
      if (isCorrect) score++;

      if (!topicAccuracy[q.topic]) topicAccuracy[q.topic] = { correct: 0, total: 0 };
      topicAccuracy[q.topic].total++;
      if (isCorrect) topicAccuracy[q.topic].correct++;

      return { ...q, isCorrect, timeTakenSeconds: q.timeTakenSeconds || 0 };
    });

    const weakAreas = Object.entries(topicAccuracy)
      .filter(([, v]) => v.correct / v.total < 0.5)
      .map(([k]) => k);

    const attempt = await TestAttempt.create({
      userId: req.userId,
      subject,
      chapters: chapters || [],
      grade: user.grade,
      questions: gradedQuestions,
      score,
      totalQuestions: questions.length,
      accuracy: Math.round((score / questions.length) * 100),
      timeTaken,
      timeAllotted: config.totalTime * 60,
      topicWiseAccuracy: topicAccuracy,
      weakAreas,
    });

    res.json({
      testId: attempt._id,
      score,
      totalQuestions: questions.length,
      accuracy: attempt.accuracy,
      topicWiseAccuracy: topicAccuracy,
      weakAreas,
      questions: gradedQuestions,
      timeTaken,
      timeAllotted: config.totalTime * 60,
      subject,
    });
  } catch (err) {
    console.error('Mock test submit error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------- FOCUS AREA ----------
router.post('/focus-area', authMiddleware, async (req, res) => {
  try {
    const { subject, chapter, topic } = req.body;
    if (!chapter) return res.status(400).json({ error: 'Chapter is required' });
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const cleanTopic = (topic || '').trim();
    const systemPrompt = buildSystemPrompt(user.grade, 'focus-area', { subject, chapter, topic: cleanTopic, language: user.language });

    const userMessage = cleanTopic
      ? `Provide complete focus area study material for: "${cleanTopic}" (Chapter context: ${chapter}, Subject: ${subject})`
      : `Provide complete focus area study material covering the ENTIRE chapter "${chapter}" in ${subject}. Cover every major subtopic comprehensively.`;

    const aiResponse = await chatWithGroq(systemPrompt, [
      { role: 'user', content: userMessage },
    ], { maxTokens: 8000, language: user.language });

    const title = cleanTopic ? `Focus: ${cleanTopic}` : `Focus: ${chapter}`;
    const userMsgRecord = cleanTopic
      ? `Focus Area — ${subject} > ${chapter} > ${cleanTopic}`
      : `Focus Area — ${subject} > ${chapter} (full chapter)`;

    const session = await Session.create({
      userId: req.userId,
      tool: 'exam-prep',
      title,
      messages: [
        { role: 'user', content: userMsgRecord },
        { role: 'assistant', content: aiResponse },
      ],
      metadata: { subject, chapter, topic: cleanTopic },
    });

    res.json({ response: aiResponse, sessionId: session._id });
  } catch (err) {
    console.error('Focus area error:', err);
    res.status(500).json({ error: 'AI service error' });
  }
});

// ---------- IMAGE SEARCH ----------
router.get('/search-image', authMiddleware, async (req, res) => {
  try {
    const { q, subject } = req.query;
    if (!q) return res.json({ image: null });
    const image = await searchWikipediaImage(q, subject || '');
    res.json({ image });
  } catch {
    res.json({ image: null });
  }
});

// ---------- MULTIPLE IMAGE SEARCH ----------
router.get('/search-images', authMiddleware, async (req, res) => {
  try {
    const { q, subject, count, grade } = req.query;
    if (!q) return res.json({ images: [] });
    // Prefer the student's actual grade so images are age-appropriate.
    let useGrade = parseInt(grade);
    if (!useGrade) {
      const user = await User.findById(req.userId).select('grade').lean();
      useGrade = user?.grade || null;
    }
    const images = await searchMultipleImages(q, subject || '', parseInt(count) || 3, useGrade);
    res.json({ images });
  } catch {
    res.json({ images: [] });
  }
});

export default router;
