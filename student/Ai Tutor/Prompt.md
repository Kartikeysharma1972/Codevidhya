# AI Tutor Platform — Full Structured Prompt
### For: Senior Full-Stack Developer
### Persona: You are a senior full-stack developer with deep experience in EdTech platforms, AI-integrated web applications, and CBSE curriculum systems. You have previously built adaptive learning tools, quiz/assessment engines, and student dashboards. You understand how to architect multi-tool platforms that balance clean UX with intelligent backend logic.

---

## PROJECT OVERVIEW

Build a web-based **AI Tutor Platform** — a student-facing EdTech toolkit for Classes 1–12 (CBSE curriculum). The platform contains **4 core tools** accessible after login. The entire product is personalized by the student's **grade/class** — which is captured at signup and drives all AI response behavior, difficulty calibration, and content scope.

**Tech Stack Direction (suggested):** React (frontend), Node.js/Next.js (backend), Anthropic Claude API (AI layer), MongoDB/PostgreSQL (data persistence), JWT auth. Final stack is developer's discretion, but the AI responses must be adaptive per grade.

---

## SECTION 1 — LANDING PAGE

### Design Language
- **Color theme:** Light blue palette with soft shades — e.g., `#EAF4FB`, `#B3D9F2`, `#5BA4CF`, `#FFFFFF`
- Minimal, clean, student-friendly aesthetic — not corporate, not cartoonish
- 1–2 hero section images (study/learning themed illustrations, not photos)
- Mobile-responsive

### Content Sections
1. **Hero section** — Platform name "AI Tutor", tagline (e.g., *"Your personalised study companion, powered by AI"*), CTA buttons: `Get Started` / `Login`
2. **Features section** — Brief description cards for all 4 tools:
   - Concept Explainer
   - Document Summarizer
   - Project Idea Generator
   - Exam Preparation Assistant
3. **How it works** — 3-step visual: Sign up → Choose your grade → Start learning
4. **Footer** — Basic links

---

## SECTION 2 — AUTH FLOW (Signup / Login)

### Signup
- Fields: Name, Email, Password, Confirm Password
- **Grade/Class selector** (dropdown or card-style picker): Class 1 through Class 12
- Grade selection is mandatory — stored in user profile and drives all AI behavior post-login
- On successful signup → redirect to Dashboard

### Login
- Standard email + password
- On successful login → redirect to Dashboard

### Intelligence Layer Logic (Grade-Based AI Behavior)
This is a core architectural requirement. The grade stored at signup must be passed as context in every AI API call. The AI model must adjust its:
- **Vocabulary complexity**
- **Explanation depth**
- **Example style**
- **Question difficulty**
- **Tone** (friendly/playful for Classes 1–5; structured for 6–10; analytical for 11–12)

Grade groupings for AI persona calibration:
| Grade Group | Behavior |
|---|---|
| Class 1–3 | Very simple language, visual analogies, short sentences, fun tone |
| Class 4–5 | Simple but slightly more structured, real-world examples |
| Class 6–8 | Conceptual explanations, some technical terms introduced |
| Class 9–10 | CBSE board-level depth, formal tone, exam-ready content |
| Class 11–12 | Advanced, competitive-exam aware, analytical and rigorous |

---

## SECTION 3 — DASHBOARD (Post-Login)

### Layout
- **Sidebar (collapsible):** Mirrors ChatGPT's sidebar behavior
  - Shows chat/session history per tool
  - Can be opened/closed with a toggle button
  - History sessions are clickable and restore previous interactions
  - Sessions are saved persistently per user per tool
- **Top-right profile section:**
  - Shows student's name and current grade
  - Option to **change grade/class** — on change, all subsequent AI responses recalibrate accordingly
  - Logout option
- **Main area:** 4 tool cards as the default home screen, each navigating to its respective tool

---

## SECTION 4 — TOOL 1: CONCEPT EXPLAINER

### Purpose
An AI-powered chat interface where students can ask any curriculum-related academic question and receive structured, grade-adaptive explanations.

### Features

#### 4.1 Chat Interface
- Standard conversational chat UI (user message right, AI response left)
- Input box at bottom with send button
- **Explanation Level Selector** (shown above/near input):
  - Three options — use better substitute words if available, but the intent is:
    - `Beginner` = CBSE standard-level explanation, simple language
    - `Intermediate` = Slightly above CBSE, added depth and context
    - `Advanced` = Rigorous, competitive-exam level, deep conceptual coverage
  - Selected level is passed to the AI prompt on every message

#### 4.2 AI Response Structure
Each response from the AI should ideally include:
- **Simplified explanation** with real-world analogies
- **Architecture / flow diagram** (text-based or ASCII if not rendering visual, or rendered diagram if frontend supports it)
- **Examples** relevant to the student's grade context
- **Adaptive learning path suggestion** — what to study next, what prerequisite concepts to revisit

#### 4.3 Real-Time Doubt Resolution
- Student can ask follow-up questions in the same chat thread
- AI maintains context within the session for multi-turn conversations

#### 4.4 Image-Based Doubt Submission
- Student can **upload an image** (screenshot of textbook, handwritten note, diagram) and ask a question about it
- AI receives the image + question and provides a contextual explanation
- Behavior mirrors GPT-4V's image understanding flow

#### 4.5 Subject & Chapter Scope
The full curriculum scope (subjects → chapters → core concepts per grade) is defined in the **GRADE_Wise_TOC.xlsx** file. This data must be used to:
- Guide the AI's content boundaries per grade
- Optionally: provide a subject/chapter picker so students can scope their question

**Curriculum data summary (from GRADE_Wise_TOC.xlsx):**
- **Class 1:** Maths (13 chapters), English (9 chapters), Hindi (19 chapters)
- **Class 2:** Maths (11 chapters), English (13 chapters), Hindi (26 chapters)
- **Class 3:** Maths (11 chapters), English (12 chapters), Hindi (18 chapters), EVS (12 chapters)
- **Class 4:** Maths (14 chapters), English (12 chapters), Hindi (13 chapters), EVS (10 chapters)
- **Class 5:** Maths (15 chapters), English (10 chapters), Hindi (12 chapters), EVS (7 chapters)
- **Class 6–12:** Science, Maths, SST/Social Science, English, Hindi, Computer Science (CS), Commerce, Humanities — as per NCERT/CBSE structure (full chapter list in GRADE_Wise_TOC.xlsx)

All chapter names, topic names, and core concept descriptions from the xlsx must be available to the AI as reference context.

---

## SECTION 5 — TOOL 2: DOCUMENT SUMMARIZER

### Purpose
Students can upload study material (textbooks, notes, PDFs, images) and get intelligent summaries, key point extractions, and targeted content searches.

### Features

#### 5.1 Input Options
- **File upload:** PDF, images (JPG, PNG), scanned pages
- **Text paste:** Up to 5,000 words (hard limit, show character/word counter)

#### 5.2 Summarization Modes
- **Full Summary** — Comprehensive overview of the entire document
- **Key Points Extraction** — Bullet-style important points intelligently extracted
- **Specific Search/Query** — Student types a specific question or topic and the AI retrieves/summarizes only the relevant portion from the uploaded content

#### 5.3 AI Behavior
- Summaries must be grade-adaptive (language and depth calibrated to the student's class)
- For Classes 1–5: Simple summary in easy language
- For Classes 9–12: Structured summary with technical accuracy

---

## SECTION 6 — TOOL 3: PROJECT IDEA GENERATOR

### Purpose
AI generates customized project ideas for students based on their grade, subject, and desired project type.

### Features

#### 6.1 Input / Filter Options
Student selects:
- **Subject** (from their grade's curriculum)
- **Project Type:**
  - Physical Model
  - Chart / Poster
  - Presentation (PPT)
  - Website / App
  - Science Experiment
  - Research Report
- Optionally: Topic or chapter (to make idea more specific)

#### 6.2 Output
- AI generates 3–5 unique project ideas per request
- Each idea includes:
  - Project title
  - Brief description
  - Materials/tools needed
  - Estimated effort level
  - Relevance to CBSE curriculum topic
- Student can regenerate or refine ideas

---

## SECTION 7 — TOOL 4: EXAM PREPARATION ASSISTANT

### Purpose
A comprehensive exam prep tool with two distinct areas: **Mock Test** and **Focus Area**. Grade is pre-assigned from the student's profile. Student selects subject → chapter → then chooses their prep mode.

---

### 7A — MOCK TEST

#### Structure & Rules (from Mock_Test_Structure_Guide.pdf)

| Grade Group | Total Questions | Total Time | Difficulty Split | Main Focus |
|---|---|---|---|---|
| Class 1–3 | 12 | 20 minutes | Easy 70% / Med 20% / Hard 10% | Fun & Visual |
| Class 4–5 | 15 | 20 minutes | Easy 70% / Med 20% / Hard 10% | Interactive Basics |
| Class 6–8 | 25 | 40 minutes | Easy 50% / Med 35% / Hard 15% | Concept Building |
| Class 9–10 | 25 | 40 minutes | Easy 30% / Med 50% / Hard 20% | Board Level |
| Class 11–12 | 30 | 50 minutes | Easy 30% / Med 50% / Hard 20% | Advanced/Competitive |

#### Question Types by Grade (from Mock_Test_Structure_Guide.pdf)

**Class 1–3:**
- Image MCQ, Picture click, Match the following, Counting, Color/Shape recognition, True/False
- Subjects: Maths, English, EVS, Hindi
- UX: Large colorful buttons, animations, stars & rewards, mascot character, friendly tone

**Class 4–5:**
- MCQ, Fill in the blanks, Match the following, Drag-drop, True/False, Word problems, Simple comprehension
- Subjects: Maths, English, EVS, Hindi
- UX: Streaks, badges, timer, coins/XP, cartoon feedback

**Class 6–8:**
- MCQ, Assertion-Reason, Fill in blanks, Diagram MCQ, Case-study MCQ, Sequence ordering, One-word answer, Table-based Q
- Subjects: Maths, Science, SST, English, CS
- UX: Leaderboard, streaks, chapter mastery badges

**Class 9–10:**
- CBSE-style MCQ, Assertion-Reason, Case-based MCQ, HOTS, Numerical solving, Graph interpretation, Data interpretation, Code output Q
- Subjects: Maths, Science, SST, English, CS
- UX: Percentile rank, weak topic analysis, time management stats

**Class 11–12:**
- Multi-select MCQ, Integer type answer, Matrix match, Case-study analysis, Passage-linked numerical, Code debugging, Algorithm tracing, Graph/data analysis, Higher-order reasoning
- Subjects: PCM (Physics, Chemistry, Maths), CS, Biology, Commerce, Humanities
- UX: Percentile, AI weak-topic recommendations, adaptive difficulty, time management stats

#### Time Per Question Type (for dynamic test duration calculation)
| Question Type | Avg Time | Question Type | Avg Time |
|---|---|---|---|
| Simple MCQ | 30–45 sec | Assertion–Reason | 60–90 sec |
| Numerical | 60–120 sec | Case Study | 120–240 sec |
| Diagram Q | ~60 sec | Fill in blank | ~30 sec |
| Match following | ~45 sec | Code output | 60–90 sec |

Backend must auto-calculate total test duration by summing (question_count × avg_time_per_type) across all question types used.

#### Standard General Instructions (shown before every test)
1. Read all questions carefully before answering.
2. Each question carries equal marks unless specified.
3. There is no negative marking.
4. Use paper and pen/pencil for rough work.
5. Do not refresh or close the browser during the test.
6. Manage your time wisely — keep an eye on the timer.
7. Attempt all questions before submitting.
8. Click "Submit Test" after completing all questions.
9. Ensure stable internet connection during the test.
10. The timer will automatically submit the test once time is over.

**Subject-specific additions:**
- Maths/Science: "Keep rough sheets ready. Show step-by-step work for numericals."
- CS/Coding: "Carefully read code snippets before selecting. Trace execution mentally."
- Class 1–5 friendly tone: "Try your best! Read carefully and have fun learning."

#### Pre-Test Info Screen (shown before timer starts)
Display: Question Count | Time Duration | Difficulty Level | Topics/Chapters covered
Example: *"25 Questions · 40 min · Medium Difficulty · Topics: Algebra, Trigonometry, Coordinate Geometry"*

#### Mock Test Flow
1. Student selects: Subject → Chapter(s)/Topic(s)
2. Pre-test info screen is shown
3. General instructions shown
4. Timer starts → Student attempts all questions
5. On **Submit** (or timer auto-submit):

#### Post-Submit Feedback Screen
After submission, display:
- **Score** (e.g., 18/25)
- **Accuracy %**
- **Analytics:**
  - Topic-wise accuracy breakdown
  - Time taken per question (if tracked)
  - Weak areas identified
  - Percentile rank (for Classes 9–12)
  - Time management stats (for Classes 9–12)
  - Streak / XP / badges earned (for Classes 1–8)
- **Per-question review:**
  - Student's answer vs. correct answer
  - Detailed solution/explanation for every question
  - 2–3 paragraph study notes per question (contextual, not generic)
- All sessions saved in history (accessible from sidebar)

---

### 7B — FOCUS AREA

#### Purpose
Deep preparation on a specific topic/concept the student selects — structured learning, not test-taking.

#### Flow
1. Student selects: Subject → Chapter → Specific Topic

#### Focus Area Output (all on one scrollable page or tabbed layout):

**1. Complete Knowledge Coverage**
- Full concept explanation (grade-adaptive depth)
- All relevant formulas (if applicable — Maths/Science/Commerce)
- Detailed study notes (downloadable as PDF)

**2. Architecture / Mind Map**
- Visual mind map or structured architecture diagram of the concept
- Designed for retention and revision
- Can be text-rendered or visual depending on frontend capability

**3. Frequently Asked Exam Questions**
- 5–6 questions that commonly appear in CBSE exams on this topic
- Each with a detailed written answer
- Presented as readable cards (not interactive)

**4. Practice Questions**
- 5–6 practice questions on the same topic
- Presented as **clickable answer cards**
- Student clicks a card to reveal the answer + solution walkthrough
- These are separate from mock test — no timer, no scoring

---

## SECTION 8 — CROSS-CUTTING REQUIREMENTS

### Session & History Management
- All chat sessions (Concept Explainer) saved with timestamps
- All mock test attempts saved with score, analytics, and full question review
- All focus area sessions saved
- Sidebar displays history grouped by tool
- Students can re-open any previous session

### AI Prompt Engineering Guidelines (for developer)
Every AI call must include:
1. `system_prompt` with student's **grade**, **grade group behavior**, and **current tool context**
2. The relevant **chapter/topic scope** from GRADE_Wise_TOC.xlsx as reference
3. For mock tests: the **Mock_Test_Structure_Guide.pdf** parameters (question count, types, difficulty split, timing) as structured context
4. The selected **explanation level** (for Concept Explainer)
5. Conversation **history** (for multi-turn tools)

### Download Functionality
- Focus Area study notes: downloadable as PDF
- Mock test feedback/report: optionally downloadable

### Responsive Design
- Fully functional on mobile and desktop
- Sidebar collapses on mobile automatically

---

## SECTION 9 — REFERENCE FILES (DO NOT IGNORE)

| File | Purpose |
|---|---|
| `GRADE_Wise_TOC.xlsx` | Complete subject → chapter → topic → concept description data for Classes 1–12. This is the curriculum scope for all AI tools. Must be parsed and used as structured reference. |
| `Mock_Test_Structure_Guide.pdf` | Defines question count, question types, time limits, difficulty splits, UX behavior, general instructions, pre-test screen format, and per-question-type time averages. All mock test generation must strictly follow this guide. |

---

*End of Prompt — Build this as a production-grade, scalable EdTech platform.*
