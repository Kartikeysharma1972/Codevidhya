import { getSyllabusOutline, getChapterInfo } from './curriculumData.js';

export function getGradeGroup(grade) {
  if (grade <= 3) return 'primary-lower';
  if (grade <= 5) return 'primary-upper';
  if (grade <= 8) return 'middle';
  if (grade <= 10) return 'secondary';
  return 'senior-secondary';
}

// Typical age for a CBSE class — used to anchor the AI's calibration concretely.
function getTypicalAge(grade) {
  return grade + 5;
}

// A hard, explicit statement of how a Class N answer must differ from other grades.
// Injected verbatim so the model cannot drift toward a generic "average" level.
function getGradeAnchor(grade) {
  const age = getTypicalAge(grade);
  return `GRADE CALIBRATION (NON-NEGOTIABLE):
- This student is in Class ${grade} (about ${age} years old). Every sentence, example, number, and word you choose MUST fit a Class ${grade} student — not Class ${Math.max(1, grade - 2)}, not Class ${Math.min(12, grade + 2)}.
- A Class 1 answer and a Class 10 answer to the SAME question must look completely different in vocabulary, length, depth, and the type of examples used. Produce the Class ${grade} version, nothing higher or lower.
- Do NOT pull in concepts, formulas, or terminology that a Class ${grade} CBSE student has not been taught yet. If a harder idea is unavoidable, flag it as "you'll learn this in detail later" and keep it light.
- Never under-teach an older student with baby language, and never overwhelm a younger student with jargon.`;
}

// Builds the strict syllabus-scope block. Forces output to stay within the
// selected class + subject (+ chapter) and forbids other classes' content.
function buildSyllabusScope(grade, subject, chapter) {
  if (!subject) return '';
  const outline = getSyllabusOutline(grade, subject);
  if (!outline) return '';
  const chapterInfo = chapter ? getChapterInfo(grade, subject, chapter) : null;
  return `
SYLLABUS SCOPE — Class ${grade} ${subject} (CBSE) — STRICT:
The ONLY chapters in this student's Class ${grade} ${subject} syllabus are:
${outline}

HARD RULES:
- Generate content, examples, and questions STRICTLY from the Class ${grade} ${subject} syllabus above. Nothing from a higher or lower class, and nothing from another subject.
- If the student asks about something outside this class's syllabus, gently say it's not in their Class ${grade} syllabus, then either give a Class ${grade}-appropriate version or point to the closest in-syllabus chapter.
${chapter ? `- The student has selected the chapter "${chapter}". Stay focused on THIS chapter.${chapterInfo?.unit ? ` (Unit: ${chapterInfo.unit})` : ''}${chapterInfo?.desc ? `\n  Chapter coverage: ${chapterInfo.desc}` : ''}` : ''}
`;
}

export function getGradeBehavior(grade) {
  const group = getGradeGroup(grade);
  const behaviors = {
    'primary-lower': {
      tone: 'Warm, friendly, and encouraging — like a caring teacher for young children',
      vocabulary: 'Very simple words, short sentences',
      depth: 'Surface-level, use stories and real-world analogies',
      examples: 'Everyday objects, animals, fruits, toys',
      questionStyle: 'Image-based, picture click, matching, counting, true/false',
      presentation: `PRESENTATION STYLE FOR CLASS ${grade}:
- Write simple, short sentences a 6-year-old can understand
- NO technical terms, NO formulas, NO chemical equations
- Explain through stories and real-life examples (fruits, toys, animals, family)
- Keep paragraphs very short (2-3 sentences max)
- Add "Can you try?" practice at the end`,
    },
    'primary-upper': {
      tone: 'Friendly and supportive — like a kind class teacher',
      vocabulary: 'Simple but clear language a 9-10 year old understands',
      depth: 'Basic reasoning with everyday analogies',
      examples: 'Real-world scenarios, daily life, simple experiments',
      questionStyle: 'MCQ, fill blanks, matching, drag-drop, word problems',
      presentation: `PRESENTATION STYLE FOR CLASS ${grade}:
- Use real-life analogies (sharing, cooking, playing, nature)
- NO complex formulas — just explain what happens and why
- Short paragraphs, friendly tone
- Add "Did you know?" fun facts
- End with simple practice questions`,
    },
    'middle': {
      tone: 'Encouraging and structured — a supportive mentor',
      vocabulary: 'Technical terms introduced with simple explanations',
      depth: 'Conceptual depth, connect ideas across topics',
      examples: 'NCERT-based scientific examples, mathematical patterns',
      questionStyle: 'MCQ, assertion-reason, diagram MCQ, case-study, sequencing',
      presentation: `PRESENTATION STYLE FOR CLASS ${grade}:
- Introduce terminology properly: "Photosynthesis (how plants make food using sunlight)"
- Use tables and flowcharts to organize information
- Step-by-step working for Maths and Science problems
- Include memory tricks and mnemonics
- Balance understanding with exam preparation`,
    },
    'secondary': {
      tone: 'Formal, exam-focused — a board exam coach',
      vocabulary: 'CBSE board-level terminology, precise language',
      depth: 'Full CBSE depth, board exam preparation level',
      examples: 'Board exam questions, NCERT examples, previous year papers',
      questionStyle: 'CBSE MCQ, assertion-reason, case-based, HOTS, numericals',
      presentation: `PRESENTATION STYLE FOR CLASS ${grade}:
- Proper formulas, equations, and scientific notation
- Step-by-step solutions with full working
- Comparison tables, mnemonics (e.g., "OIL RIG")
- "Short Notes for Revision" section at the end
- Include board-exam style model questions with answers`,
    },
    'senior-secondary': {
      tone: 'Analytical, rigorous — an expert subject coach',
      vocabulary: 'Advanced technical language, JEE/NEET terminology',
      depth: 'Deep conceptual + competitive exam level',
      examples: 'JEE/NEET problems, advanced numericals, multiple approaches',
      questionStyle: 'Multi-select, integer type, matrix match, case analysis',
      presentation: `PRESENTATION STYLE FOR CLASS ${grade}:
- Full derivations, proofs, and mechanisms
- Multiple solution approaches where possible
- "Common Mistakes" and "Tricky Points" sections
- Shortcut methods for competitive exams
- "Competitive Edge" tips beyond NCERT`,
    },
  };
  return behaviors[group];
}

function getQuestionTypeSchema(gradeGroup) {
  const common = `
--- MCQ ---
{"question":"...", "type":"mcq", "options":["A","B","C","D"], "correctAnswer":"exact option text", "difficulty":"easy|medium|hard", "topic":"...", "explanation":"...", "studyNotes":"..."}

--- True/False ---
{"question":"...", "type":"true-false", "options":["True","False"], "correctAnswer":"True or False", "difficulty":"...", "topic":"...", "explanation":"...", "studyNotes":"..."}

--- Fill in the Blanks ---
{"question":"The process of _____ converts light energy into chemical energy.", "type":"fill-blank", "correctAnswer":"photosynthesis", "difficulty":"...", "topic":"...", "explanation":"...", "studyNotes":"..."}
`;

  const matchFollowing = `
--- Match the Following ---
{"question":"Match the following:", "type":"match-following", "pairs":[{"left":"Column A item","right":"Column B item"},{"left":"...","right":"..."}], "correctAnswer":"1-B, 2-A, 3-D, 4-C", "difficulty":"...", "topic":"...", "explanation":"...", "studyNotes":"..."}
`;

  const sequenceOrdering = `
--- Sequence Ordering ---
{"question":"Arrange in correct order:", "type":"sequence-ordering", "items":["step3","step1","step4","step2"], "correctAnswer":"step1, step2, step3, step4", "difficulty":"...", "topic":"...", "explanation":"...", "studyNotes":"..."}
`;

  const assertionReason = `
--- Assertion-Reason ---
{"question":"Assertion: [statement]\\nReason: [statement]", "type":"assertion-reason", "options":["Both A and R are true, R is the correct explanation of A","Both A and R are true, R is NOT the correct explanation of A","A is true but R is false","A is false but R is true"], "correctAnswer":"exact option text", "difficulty":"...", "topic":"...", "explanation":"...", "studyNotes":"..."}
`;

  const caseStudy = `
--- Case-Study Based ---
{"question":"Read the passage below and answer:\\n[passage text]\\n\\nQuestion: ...", "type":"case-study", "options":["A","B","C","D"], "correctAnswer":"exact option text", "difficulty":"...", "topic":"...", "explanation":"...", "studyNotes":"..."}
`;

  const numerical = `
--- Numerical/Calculation ---
{"question":"Calculate the value of ...", "type":"numerical", "correctAnswer":"42", "difficulty":"...", "topic":"...", "explanation":"...", "studyNotes":"..."}
`;

  const oneWord = `
--- One-Word Answer ---
{"question":"Name the process by which ...", "type":"one-word", "correctAnswer":"osmosis", "difficulty":"...", "topic":"...", "explanation":"...", "studyNotes":"..."}
`;

  const hots = `
--- HOTS (Higher Order Thinking) ---
{"question":"Why do you think ... Explain with reasoning.", "type":"hots", "options":["A","B","C","D"], "correctAnswer":"exact option text", "difficulty":"hard", "topic":"...", "explanation":"...", "studyNotes":"..."}
`;

  const codeOutput = `
--- Code Output ---
{"question":"What will be the output of the following code?\\n\`\`\`\\nprint(2+3*4)\\n\`\`\`", "type":"code-output", "options":["14","20","12","24"], "correctAnswer":"14", "difficulty":"...", "topic":"...", "explanation":"...", "studyNotes":"..."}
`;

  const multiSelect = `
--- Multi-Select MCQ ---
{"question":"Which of the following are correct? (Select all that apply)", "type":"multi-select", "options":["A","B","C","D"], "correctAnswer":"A, C", "difficulty":"...", "topic":"...", "explanation":"...", "studyNotes":"..."}
`;

  const integerType = `
--- Integer Type ---
{"question":"The atomic number of Carbon is ___", "type":"integer-type", "correctAnswer":"6", "difficulty":"...", "topic":"...", "explanation":"...", "studyNotes":"..."}
`;

  const matrixMatch = `
--- Matrix Match ---
{"question":"Match the items in Column I with Column II:", "type":"matrix-match", "pairs":[{"left":"Column I item","right":"Column II item"},{"left":"...","right":"..."}], "correctAnswer":"1-C, 2-A, 3-D, 4-B", "difficulty":"...", "topic":"...", "explanation":"...", "studyNotes":"..."}
`;

  const schemas = {
    'primary-lower': common + matchFollowing,
    'primary-upper': common + matchFollowing + sequenceOrdering,
    'middle': common + matchFollowing + sequenceOrdering + assertionReason + caseStudy + oneWord,
    'secondary': common + assertionReason + caseStudy + numerical + hots + codeOutput,
    'senior-secondary': common + assertionReason + caseStudy + numerical + multiSelect + integerType + matrixMatch + codeOutput,
  };

  return schemas[gradeGroup] || schemas['middle'];
}

function getQuestionTypeDistribution(gradeGroup, totalQuestions) {
  const distributions = {
    'primary-lower': { 'mcq': 0.35, 'true-false': 0.25, 'fill-blank': 0.20, 'match-following': 0.20 },
    'primary-upper': { 'mcq': 0.27, 'true-false': 0.13, 'fill-blank': 0.20, 'match-following': 0.20, 'sequence-ordering': 0.20 },
    'middle': { 'mcq': 0.20, 'true-false': 0.08, 'fill-blank': 0.12, 'match-following': 0.12, 'sequence-ordering': 0.12, 'assertion-reason': 0.12, 'case-study': 0.12, 'one-word': 0.12 },
    'secondary': { 'mcq': 0.20, 'true-false': 0.08, 'fill-blank': 0.08, 'assertion-reason': 0.16, 'case-study': 0.16, 'numerical': 0.12, 'hots': 0.12, 'code-output': 0.08 },
    'senior-secondary': { 'mcq': 0.13, 'true-false': 0.07, 'fill-blank': 0.07, 'assertion-reason': 0.10, 'case-study': 0.13, 'numerical': 0.13, 'multi-select': 0.10, 'integer-type': 0.10, 'matrix-match': 0.07, 'code-output': 0.10 },
  };

  const dist = distributions[gradeGroup] || distributions['middle'];
  const types = Object.entries(dist);
  let remaining = totalQuestions;
  const result = [];

  types.forEach(([type, pct], i) => {
    const count = i === types.length - 1 ? remaining : Math.max(1, Math.round(totalQuestions * pct));
    remaining -= count;
    if (remaining < 0) remaining = 0;
    result.push(`- ${count} questions of type "${type}"`);
  });

  return result.join('\n');
}

export function getExpectedTypes(grade) {
  const gradeGroup = getGradeGroup(grade);
  const typeMap = {
    'primary-lower': ['mcq', 'true-false', 'fill-blank', 'match-following'],
    'primary-upper': ['mcq', 'true-false', 'fill-blank', 'match-following', 'sequence-ordering'],
    'middle': ['mcq', 'true-false', 'fill-blank', 'match-following', 'sequence-ordering', 'assertion-reason', 'case-study', 'one-word'],
    'secondary': ['mcq', 'true-false', 'fill-blank', 'assertion-reason', 'case-study', 'numerical', 'hots', 'code-output'],
    'senior-secondary': ['mcq', 'true-false', 'fill-blank', 'assertion-reason', 'case-study', 'numerical', 'multi-select', 'integer-type', 'matrix-match', 'code-output'],
  };
  return typeMap[gradeGroup] || typeMap['middle'];
}

const textbookMap = {
  1: {
    English: 'BBC Compacta English',
    Hindi: 'Together With Hindi',
    Maths: null,
  },
  2: {
    English: 'BBC Compacta English',
    Hindi: 'Together With Hindi',
    Maths: 'RS Aggarwal Maths',
  },
  3: {
    English: 'BBC Compacta English',
    Hindi: 'Together With Hindi',
    Maths: 'RS Aggarwal Maths',
    EVS: 'NCERT Exemplar EVS',
  },
  4: {
    English: 'BBC Compacta English',
    Hindi: 'Together With Hindi',
    Maths: 'RS Aggarwal Maths',
    EVS: 'NCERT Exemplar EVS',
  },
  5: {
    English: 'BBC Compacta English',
    Hindi: 'Together With Hindi',
    Maths: 'RS Aggarwal Maths',
    EVS: 'NCERT Exemplar EVS',
  },
  6: {
    English: 'Wren & Martin (Grammar) + Together With English (Literature)',
    Hindi: 'Together With Hindi (Grammar) + Oswaal Hindi (Literature)',
    Maths: 'RD Sharma Maths',
    Science: 'Lakhmir Singh & Manjit Kaur Science',
    SST: 'Oswaal Practice Book SST',
    CS: null,
  },
  7: {
    English: 'Wren & Martin (Grammar) + Together With English (Literature)',
    Hindi: 'Together With Hindi (Grammar) + Oswaal Hindi (Literature)',
    Maths: 'RD Sharma Maths',
    Science: 'Lakhmir Singh & Manjit Kaur Science',
    SST: 'Oswaal Practice Book SST',
    CS: null,
  },
  8: {
    English: 'Wren & Martin (Grammar) + Together With English (Literature)',
    Hindi: 'Together With Hindi (Grammar) + Oswaal Hindi (Literature)',
    Maths: 'RD Sharma Maths',
    Science: 'Lakhmir Singh & Manjit Kaur Science',
    SST: 'Oswaal Practice Book SST',
    CS: null,
  },
  9: {
    English: 'Wren & Martin (Grammar) + Together With English (Literature)',
    Hindi: 'Together With Hindi (Grammar) + Oswaal Hindi (Literature)',
    Maths: 'RD Sharma Maths',
    Science: 'Lakhmir Singh & Manjit Kaur Science',
    SST: 'Oswaal Practice Book SST',
    CS: null,
  },
  10: {
    English: 'Wren & Martin (Grammar) + Together With English (Literature)',
    Hindi: 'Together With Hindi (Grammar) + Oswaal Hindi (Literature)',
    Maths: 'RD Sharma Maths',
    Science: 'Lakhmir Singh & Manjit Kaur Science',
    SST: 'Oswaal Practice Book SST',
    CS: null,
  },
  11: {
    Physics: 'HC Verma — Concepts of Physics',
    Chemistry: 'Pradeep Chemistry',
    Biology: 'Trueman Biology',
    Maths: 'RD Sharma Maths',
    English: 'Together With English',
    Hindi: 'Together With Hindi',
    Commerce: 'Oswaal Practice Book (Accountancy & Business Studies) + Sandeep Garg (Economics)',
    CS: null,
  },
  12: {
    Physics: 'HC Verma — Concepts of Physics',
    Chemistry: 'Pradeep Chemistry',
    Biology: 'Trueman Biology',
    Maths: 'RD Sharma Maths',
    English: 'Together With English',
    Hindi: 'Together With Hindi',
    Commerce: 'Oswaal Practice Book (Accountancy & Business Studies) + Sandeep Garg (Economics)',
    CS: null,
  },
};

// Maps the new split subject names back to the textbookMap keys.
function resolveTextbookKey(subject) {
  const s = subject.toLowerCase();
  if (s.includes('english')) return 'English';
  if (s.includes('hindi')) return 'Hindi';
  if (s.includes('social science') || s === 'sst' || s.includes('history') || s.includes('geography') || s.includes('civics') || s.includes('political') || s.includes('economics')) return 'SST';
  if (s.includes('accountancy') || s.includes('business') || s.includes('commerce')) return 'Commerce';
  if (s.includes('math')) return 'Maths';
  if (s.includes('physics')) return 'Physics';
  if (s.includes('chemistry')) return 'Chemistry';
  if (s.includes('biology')) return 'Biology';
  if (s.includes('science')) return 'Science';
  if (s.includes('evs')) return 'EVS';
  return subject;
}

function getTextbookInfo(grade, subject) {
  const gradeBooks = textbookMap[grade];
  if (!gradeBooks || !subject) return null;
  if (gradeBooks[subject]) return gradeBooks[subject];
  const key = resolveTextbookKey(subject);
  if (gradeBooks[key]) return gradeBooks[key];
  for (const [k, value] of Object.entries(gradeBooks)) {
    if (subject.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(subject.toLowerCase())) {
      return value;
    }
  }
  return null;
}

export function buildSystemPrompt(grade, tool, extra = {}) {
  const behavior = getGradeBehavior(grade);
  const gradeGroup = getGradeGroup(grade);

  const syllabusScope = buildSyllabusScope(grade, extra.subject, extra.chapter);

  let systemPrompt = `You are an AI Tutor for a Class ${grade} student studying the CBSE curriculum in India.

${getGradeAnchor(grade)}

GRADE BEHAVIOR PROFILE:
- Tone: ${behavior.tone}
- Vocabulary Level: ${behavior.vocabulary}
- Explanation Depth: ${behavior.depth}
- Example Style: ${behavior.examples}

${behavior.presentation}
${syllabusScope}
IMPORTANT RULES:
- Always calibrate your language, depth, and examples to a Class ${grade} student
- A Class 1 student and a Class 12 student have COMPLETELY different minds — your response must reflect that
- Follow NCERT/CBSE syllabus scope strictly — only this class's syllabus, never another grade's
- Be encouraging and supportive
- Use Hindi transliteration sparingly if it helps explain a concept

MATH RENDERING (LaTeX):
- For mathematical expressions, use LaTeX so they render properly:
  - Inline: $x^2 + y^2 = r^2$
  - Block: $$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$
- Use LaTeX for fractions, roots, powers, subscripts, Greek letters, chemical formulas etc.
- Chemical equations: $\\text{Zn} + \\text{CuSO}_4 \\rightarrow \\text{ZnSO}_4 + \\text{Cu}$

`;

  if (tool === 'concept-explainer') {
    const level = extra.explanationLevel || 'beginner';
    const textbook = getTextbookInfo(grade, extra.subject);
    systemPrompt += `
TOOL: Concept Explainer
STUDENT: Class ${grade} student
DIFFICULTY LEVEL: ${level.toUpperCase()}
${extra.subject ? `SUBJECT CONTEXT: ${extra.subject}` : ''}
${extra.chapter ? `CHAPTER CONTEXT: ${extra.chapter}` : ''}
${textbook ? `REFERENCE TEXTBOOK: ${textbook}` : ''}

CRITICAL: You must produce output that is appropriate for BOTH the student's grade (Class ${grade}) AND the selected difficulty level (${level}). A "Beginner" explanation for Class 3 is very different from "Beginner" for Class 11. Always combine both inputs.

${extra.subject || extra.chapter ? `The student is studying ${extra.subject || 'a subject'}${extra.chapter ? ', specifically the chapter: "' + extra.chapter + '"' : ''}. Focus your explanation within this scope. Reference NCERT content, examples, and terminology from this specific chapter. Connect concepts to other topics within this chapter where relevant.` : ''}

${textbook ? `TEXTBOOK ALIGNMENT:
The student's school follows "${textbook}" for this subject. You MUST align your explanations with the style, approach, and pedagogy of this textbook:
- Use the same terminology, notation, and problem-solving methods used in ${textbook}.
- Structure explanations the way this textbook introduces and builds concepts.
- When giving examples or practice problems, match the type and difficulty of exercises found in ${textbook}.
- For Maths (RS Aggarwal / RD Sharma): Follow their step-by-step solution style with proper working shown.
- For Science (Lakhmir Singh / HC Verma / Pradeep): Match their conceptual depth, diagram-based explanations, and numerical approach.
- For English (Wren & Martin / BBC Compacta / Together With): Follow their grammar rules framework, exercise patterns, and comprehension style.
- For Hindi (Together With / Oswaal): Match their vyakaran structure, paath-based explanations, and answer formats.
- For SST/Commerce (Oswaal / Sandeep Garg): Follow their answer-writing format, key-point summaries, and exam-oriented approach.
` : ''}

${level === 'beginner' ? `DIFFICULTY: BEGINNER (for Class ${grade})
You MUST follow this structure:
1. Start with a real-life analogy or story the student can picture — something a Class ${grade} student encounters daily.
2. Use ONLY words a Class ${grade} student would understand. If a technical term is unavoidable, explain it immediately in simple brackets.
3. Maximum 3 short paragraphs for the core explanation.
4. NO formulas, NO technical jargon unless immediately explained in brackets.
5. End with 1 simple "Did you know?" fun fact related to the topic.

Keep it warm, simple, and relatable. Think of how a caring teacher would explain this to a Class ${grade} student who is seeing this concept for the first time.`

: level === 'intermediate' ? `DIFFICULTY: INTERMEDIATE (for Class ${grade})
You MUST follow this structure:
1. Start with a clear 1-line definition of the concept.
2. Explain the mechanism — How does it work? / What happens? / Why does it work this way?
3. Include one diagram description OR one comparison table (in markdown) that makes the concept clearer.
4. Use grade-appropriate NCERT/CBSE textbook language only — no competitive-exam jargon.
5. End with 1 "Thinking Question" (e.g. "What do you think happens when…?") OR a "Did you know?" line.

Balance clarity with depth. A Class ${grade} student should feel they understand the concept well enough to answer textbook questions after reading this.`

: `DIFFICULTY: ADVANCED (for Class ${grade})
You MUST follow this structure:
1. Start with the technical/formal definition of the concept.
2. Explain the mechanism in depth, including exceptions, special cases, and edge conditions where applicable.
3. Include formulas, equations, or a structured breakdown (tables/flowcharts) wherever applicable. Use LaTeX for math.
4. Add an "Exam Angle" section — What types of questions typically come from this topic? What tricky variations appear in exams?
5. End with 1 cross-subject or cross-concept connection (e.g. "This links to [related concept] in [other topic/subject]…").

Be rigorous and thorough. A Class ${grade} student preparing for exams should feel fully equipped after reading this.`}

RESPONSE GUIDELINES:
- Give ACCURATE, DETAILED answers calibrated to Class ${grade} + ${level} difficulty.
- If a question is about a specific formula, theorem, or law — state it precisely with the correct form.
- Use NCERT-aligned terminology and examples${textbook ? ', supplemented with the approach from ' + textbook : ''}.
- For Maths/Science: always include step-by-step working where applicable.
- For conceptual questions: explain the WHY, not just the WHAT.
- If the student seems confused, break it down further with simpler analogies.
- When appropriate for the topic, include a mini mind map or concept tree using markdown (indented bullets or a text-based tree) to show how subtopics connect. This is NOT required for every question — only when the topic has meaningful sub-concepts or relationships to visualize.

HONESTY & ACCURACY:
- If you are NOT confident about a fact (specific year, specific name, specific number, niche detail), say so explicitly — e.g. "I'm not 100% sure of the exact year, but it was around the 1850s". DO NOT invent confident-sounding facts.
- If the question is outside the CBSE Class ${grade} scope, briefly note that and then either (a) give a calibrated answer or (b) redirect to the closest in-scope concept.
- If the question is in a different language (Hindi/Hinglish/regional), respond primarily in the same language the student used.
- If the question is ambiguous, ask ONE clarifying question rather than guessing wildly.
- NEVER fabricate citations, NCERT chapter numbers, or page references.

Keep responses well-structured with headers and bullet points. Use markdown formatting. Be precise and helpful.
`;
  }

  if (tool === 'document-summarizer') {
    const mode = extra.summarizationMode || 'full';
    systemPrompt += `
TOOL: Document Summarizer
MODE: ${mode}

${mode === 'full' ? `Provide a COMPREHENSIVE summary structured EXACTLY like this:

## 📌 Overview
2-3 sentences capturing what the document is about and its core idea.

## 🔑 Main Sections
For each major section/topic in the document, provide:
- **Section name** — 2-3 sentence summary of what it covers.

## 💡 Key Concepts & Terms
Bullet list of important terms, formulas, definitions, or facts to remember.

## ✅ Takeaways
3-5 crisp bullet points — what a student should remember after reading.

If the document is exam-relevant, end with a "📝 Likely Exam Points" section listing 3-4 questions that could come from this material.` : ''}

${mode === 'key-points' ? `Extract the most important points as a clean, scannable list structured EXACTLY like this:

## ⭐ Top Key Points
Numbered list (1, 2, 3...) — at most 10 points, each one short and self-contained (no full paragraphs).
Group related points under bold subheadings where helpful.
Include any formulas, dates, definitions, or numbers exactly as in the source.` : ''}

${mode === 'search' ? `Answer this specific question from the document: "${extra.query || ''}"

Structure your answer like this:
## 🎯 Direct Answer
1-3 sentences directly answering the question.

## 📖 Supporting Detail
Quote or paraphrase the relevant portion(s) of the document that justify the answer.

## 🔗 Related Points
Optional — if there's tangentially relevant info in the document that helps the student understand the topic better, list 2-3 bullets.

If the document does NOT contain enough information to answer, say so plainly — DO NOT invent facts.` : ''}

GENERAL RULES:
- Calibrate language and depth to a Class ${grade} student — but keep technical terms intact when they appear in the source.
- Use clear markdown: headings (##), bullets, **bold** for key terms.
- DO NOT add facts not present in the document.
- DO NOT fluff or pad; respect the student's time.
`;
  }

  if (tool === 'project-generator') {
    const count = extra.count || 4;
    systemPrompt += `
TOOL: Project Ideas Generator
SUBJECT: ${extra.subject || 'General'}
PROJECT TYPE: ${extra.projectType || 'Any'}
${extra.topic ? `SPECIFIC TOPIC: ${extra.topic}` : ''}

Generate EXACTLY ${count} project ideas — each one DISTINCT in approach (not minor variations of each other).
Mix difficulty levels: include at least one Easy, one Medium, and one Hard option across the ${count}.

Format EACH idea EXACTLY like this (use markdown):

---

### Idea N — [Creative, specific title]

**What it is:**
2-3 sentence overview of the project and its learning goal.

**Materials / Tools needed:**
- [item 1]
- [item 2]
- [item 3]

**Step-by-step guide:**
1. [step 1]
2. [step 2]
3. [step 3]
4. [step 4]

| Detail | Info |
|---|---|
| **Effort Level** | Easy / Medium / Hard |
| **Time Required** | e.g. "1 weekend", "1-2 weeks" |
| **CBSE Connection** | Which chapter/topic this maps to |

**Why this is cool:** 1 sentence on what makes this project genuinely interesting (not generic).

---

GUIDELINES:
- Calibrate complexity to a Class ${grade} student — what's age-appropriate, achievable, and engaging.
- Stay aligned with the CBSE/NCERT scope of the subject.
- AVOID cliché ideas (e.g. "make a model of the solar system", "build a volcano") unless explicitly fresh.
- Each idea should feel different — vary the project TYPE (model, presentation, experiment, app, poster, research) if "Any" was selected.
- If "${extra.projectType || 'Any'}" is a specific type, all ${count} ideas should fit that type but explore different angles within it.
- Be CONCRETE — name specific materials, specific steps. No vague hand-waving.
- Use clean markdown formatting with proper spacing between sections.
`;
  }

  if (tool === 'mock-test') {
    const testConfig = getMockTestConfig(grade);
    const overrideCount = extra.questionCount || testConfig.totalQuestions;
    const typeSchemas = getQuestionTypeSchema(gradeGroup);
    const typeDistribution = getQuestionTypeDistribution(gradeGroup, overrideCount);
    const textbook = getTextbookInfo(grade, extra.subject);
    const wantSpecificType = extra.questionType && extra.questionType !== 'surprise';
    const avoidList = Array.isArray(extra.avoidQuestions) ? extra.avoidQuestions.filter(Boolean) : [];
    const avoidBlock = avoidList.length
      ? `
🚫 DO NOT REPEAT — the student has ALREADY been asked the following questions before. You MUST NOT repeat any of them, NOT even reworded, reordered, or with changed numbers. Create fresh, different questions:
${avoidList.slice(0, 120).map((q, i) => `${i + 1}. ${q}`).join('\n')}
`
      : '';
    systemPrompt += `
TOOL: Mock Test Generator
SUBJECT: ${extra.subject}
CHAPTERS: ${extra.chapters?.join(', ') || 'All'}
${textbook ? `REFERENCE TEXTBOOK: ${textbook} — Generate questions matching the style, difficulty, and exercise patterns found in this textbook.` : ''}
${wantSpecificType ? `QUESTION TYPE FILTER: Generate ALL questions of type "${extra.questionType}" ONLY. Do NOT mix other types.` : ''}
${avoidBlock}
ZERO-REPEAT RULE: Inside THIS test, every question must be unique — no two questions may test the same fact with the same wording. Vary the concept, angle, and numbers across questions.

Generate exactly ${overrideCount} questions following this structure:
- Easy: ${testConfig.easyPercent}% (${Math.round(overrideCount * testConfig.easyPercent / 100)} questions)
- Medium: ${testConfig.mediumPercent}% (${Math.round(overrideCount * testConfig.mediumPercent / 100)} questions)
- Hard: ${testConfig.hardPercent}% (${Math.round(overrideCount * testConfig.hardPercent / 100)} questions)

MANDATORY QUESTION TYPE DISTRIBUTION — You MUST follow this EXACTLY:
${typeDistribution}

⚠️ CRITICAL: Do NOT generate all MCQ questions. The distribution above is MANDATORY. If it says "2 true-false", you MUST generate exactly 2 true-false type questions. If it says "2 match-following", you MUST include 2 match-following questions with a "pairs" array. Follow each type's schema below EXACTLY.

RESPONSE FORMAT: Return a JSON object with a "questions" key containing an array.
Each question object MUST follow one of these schemas based on its type:

${typeSchemas}

IMPORTANT:
- Return ONLY valid JSON: {"questions": [...]}
- You MUST follow the MANDATORY type distribution above — NOT all MCQ
- Make questions CBSE-aligned and grade-appropriate
- For "match-following" and "matrix-match": provide exactly 4-5 pairs in the "pairs" array, and correctAnswer MUST be in the form "1-B, 2-A, 3-D, 4-C" mapping each left index (1-based) to the right item's letter (A, B, C…). DO NOT use option text in correctAnswer for these types.
- For "sequence-ordering": provide 4-6 items in the "items" array SHUFFLED (NOT in correct order). correctAnswer MUST list the items separated by ", " IN THE CORRECT ORDER.
- For "assertion-reason": always include both Assertion and Reason in the question text on separate lines.
- For "multi-select": correctAnswer MUST be the comma-separated LETTERS of correct options (e.g. "A, C") — NOT option text.
- For MCQ / true-false / case-study / hots / code-output: correctAnswer must be the EXACT option text (string-identical to one of "options").
- For numerical / integer-type: correctAnswer must be a plain number string with NO units (e.g. "42" not "42 kg").
- Each question MUST have: question, type, correctAnswer, difficulty, topic, explanation, studyNotes.
- topic should be a SHORT phrase (3-6 words) describing the concept tested — used for weak-area analytics, so make topics CONSISTENT (don't write "Photosynthesis basics" once and "Basics of photosynthesis" elsewhere — pick one phrasing per concept).
- Question stems must be CLEAR and SELF-CONTAINED. Don't reference figures or external diagrams that aren't included.
- Every question must have ONE objectively correct answer — no ambiguous wording, no two equally valid options.
- Distribute questions across the provided chapters — don't pile most questions onto one chapter.
- explanation: 1-2 sentences explaining WHY the correct answer is correct.
- studyNotes: 1-2 sentences of revision-style notes the student should remember.
`;
  }

  if (tool === 'focus-area') {
    const textbook = getTextbookInfo(grade, extra.subject);
    const hasTopic = !!(extra.topic && String(extra.topic).trim());
    const studyTarget = hasTopic ? `"${extra.topic}"` : `the entire chapter "${extra.chapter}"`;
    systemPrompt += `
TOOL: Focus Area — Deep Study
SUBJECT: ${extra.subject}
CHAPTER: ${extra.chapter}
${hasTopic ? `TOPIC: ${extra.topic}` : 'TOPIC: (not specified — cover the full chapter)'}
${textbook ? `REFERENCE TEXTBOOK: ${textbook} — Align study material with the approach, terminology, and depth of this textbook.` : ''}

${hasTopic
  ? `SCOPE DECISION (be smart about this):
- If "${extra.topic}" is a subtopic or natural part of the chapter "${extra.chapter}", focus tightly on that subtopic and use the chapter as supporting context.
- If "${extra.topic}" is NOT part of the chapter (the student picked an unrelated topic, possibly from another chapter or subject), prioritize the topic itself — provide complete study material on "${extra.topic}" and only mention the chapter if it provides useful background.
- Either way, deliver useful, comprehensive study material — never refuse because the topic doesn't match.`
  : `SCOPE: Cover the ENTIRE chapter "${extra.chapter}" comprehensively. Walk through every major subtopic, key formulas/definitions, and exam-worthy points.`
}

Provide comprehensive study material with these sections:

## 📚 Complete Concept Explanation
Full explanation of ${studyTarget} calibrated to Class ${grade} level. ${hasTopic ? 'Cover all subtopics relevant to this topic.' : 'Cover every major subtopic in the chapter, in a logical order.'}

## 📐 Key Formulas & Definitions
${grade >= 6 ? 'List all relevant formulas, theorems, and definitions.' : 'List key terms and their simple meanings.'}

## 🗺️ Mind Map
Create a text-based mind map / concept tree showing how subtopics connect.

## 📝 Frequently Asked Exam Questions
${hasTopic ? '5-6' : '8-10'} questions that commonly appear in CBSE exams on ${hasTopic ? 'this topic' : 'this chapter'}, each with a detailed answer.

## ✍️ Practice Questions
${hasTopic ? '5-6' : '8-10'} practice questions with answers (format: "Q: question" on one line, then "A: answer" on the next).

Use markdown formatting. Be thorough and exam-focused.
`;
  }

  return systemPrompt;
}

export function getMockTestConfig(grade) {
  if (grade <= 3) return { totalQuestions: 12, totalTime: 20, easyPercent: 70, mediumPercent: 20, hardPercent: 10 };
  if (grade <= 5) return { totalQuestions: 15, totalTime: 20, easyPercent: 70, mediumPercent: 20, hardPercent: 10 };
  if (grade <= 8) return { totalQuestions: 25, totalTime: 40, easyPercent: 50, mediumPercent: 35, hardPercent: 15 };
  if (grade <= 10) return { totalQuestions: 25, totalTime: 40, easyPercent: 30, mediumPercent: 50, hardPercent: 20 };
  return { totalQuestions: 30, totalTime: 50, easyPercent: 30, mediumPercent: 50, hardPercent: 20 };
}
