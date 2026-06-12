import crypto from 'crypto';
import ServedQuestion from '../models/ServedQuestion.js';

// Normalize a question to its semantic core so trivially-reworded duplicates
// collide: lowercase, strip punctuation, collapse whitespace, drop digits.
export function normalizeQuestion(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9ऀ-ॿ]+/g, ' ') // punctuation → space (keep latin, digits, Devanagari)
    .replace(/\b\d+\b/g, '#')        // numbers vary between near-identical questions
    .replace(/\s+/g, ' ')            // collapse whitespace last
    .trim();
}

export function hashQuestion(text) {
  return crypto.createHash('sha1').update(normalizeQuestion(text)).digest('hex');
}

// Pull what this student has already been served for a subject, so we can both
// tell the model to avoid it and hard-filter verbatim repeats.
export async function getAvoidList(userId, subject, limit = 200) {
  try {
    const rows = await ServedQuestion.find({ userId, subject })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('hash text')
      .lean();
    return {
      hashes: new Set(rows.map(r => r.hash)),
      texts: rows.map(r => r.text).filter(Boolean),
    };
  } catch {
    return { hashes: new Set(), texts: [] };
  }
}

// Remove duplicates within the freshly generated set AND anything already seen.
export function dedupeAgainst(questions, seenHashes = new Set()) {
  const out = [];
  const local = new Set();
  for (const q of questions) {
    if (!q || !q.question) continue;
    const h = hashQuestion(q.question);
    if (seenHashes.has(h) || local.has(h)) continue;
    local.add(h);
    out.push(q);
  }
  return out;
}

// Persist a batch of newly served questions. Best-effort: duplicate-key errors
// (same question stored twice) are ignored.
export async function recordQuestions(userId, grade, subject, chapter, tool, questions) {
  try {
    const docs = questions
      .filter(q => q && q.question)
      .map(q => ({
        userId, grade, subject, chapter: chapter || '', tool,
        hash: hashQuestion(q.question),
        text: q.question,
      }));
    if (docs.length) await ServedQuestion.insertMany(docs, { ordered: false });
  } catch {
    // ordered:false means valid docs still insert; ignore duplicate-key noise.
  }
}
