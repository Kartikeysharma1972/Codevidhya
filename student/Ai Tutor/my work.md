# AI Tutor Platform - Complete Project Documentation

## Project Overview

**AI Tutor** is a student-facing EdTech web application built for **CodeVidhya**, targeting CBSE students from Classes 1-12. The platform provides AI-powered learning tools that adapt their language, depth, and complexity based on the student's grade level. Every AI response is personalized - a Class 2 student gets fun, simple explanations while a Class 12 student gets rigorous, competitive-exam-level content.

**Organization:** CodeVidhya  
**Contact:** nitin.bharia@codevidhya.com  
**Deployment:** Render.com (render.yaml configured)  
**Repository:** GitHub (main branch)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18.3.1 + Vite 5.4.11 |
| **Styling** | Tailwind CSS 3.4.15 + PostCSS |
| **Animations** | Framer Motion 11.11.0 |
| **Backend** | Node.js + Express 4.21.1 (ES Modules) |
| **Database** | MongoDB + Mongoose 8.8.3 (Atlas cloud) |
| **AI Engine** | Groq SDK 0.8.0 (Llama models) |
| **Auth** | JWT (7-day expiry) + bcryptjs |
| **File Uploads** | Multer + pdf-parse |
| **Math Rendering** | KaTeX via react-katex |
| **Markdown** | react-markdown 9.0.1 + remark-math |
| **Image Search** | Wikipedia/Wikimedia APIs (no API key needed) |

---

## Project Structure

```
Ai tutor/
├── client/                          # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx                 # Main router with all routes
│   │   ├── main.jsx                # Entry point
│   │   ├── index.css               # Global styles (Tailwind directives)
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx     # Auth state management (login/signup/logout/updateGrade)
│   │   ├── components/
│   │   │   ├── AppLayout.jsx       # Main layout with collapsible sidebar + session history
│   │   │   └── ChatMarkdown.jsx    # Markdown renderer with KaTeX math support
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx     # Public homepage with hero, features, how-it-works
│   │   │   ├── Login.jsx           # Email + password login
│   │   │   ├── Signup.jsx          # Name + email + password + grade selector
│   │   │   ├── Dashboard.jsx       # Tool hub with 4 tool cards
│   │   │   ├── ConceptExplainer.jsx     # AI chat with image/file upload support
│   │   │   ├── DocumentSummarizer.jsx   # PDF/image/text summarization
│   │   │   ├── ProjectGenerator.jsx     # Project idea generation with chapter topics
│   │   │   ├── ExamPrep.jsx        # Subject/chapter selector -> Mock Test or Focus Area
│   │   │   ├── MockTest.jsx        # Timed test with diverse question types + analytics
│   │   │   ├── FocusArea.jsx       # Deep study material (concepts, mind maps, practice)
│   │   │   └── TestResult.jsx      # Test analytics with per-question review
│   │   └── utils/
│   │       └── api.js              # Axios client with auth interceptors + all API methods
│   ├── vite.config.js              # Dev server proxy: /api -> localhost:5000
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── server/                          # Node.js/Express backend
│   ├── server.js                   # Express app setup, MongoDB connection, static serving
│   ├── middleware/
│   │   └── auth.js                 # JWT verification middleware (sets req.userId, req.userGrade)
│   ├── models/
│   │   ├── User.js                 # User schema with bcrypt password hashing
│   │   ├── Session.js              # Chat session schema (messages array, metadata)
│   │   └── TestAttempt.js          # Mock test results with per-question analytics
│   ├── routes/
│   │   ├── auth.js                 # Signup, login, getMe, updateGrade
│   │   ├── ai.js                   # All AI endpoints (concept explainer, summarizer, etc.)
│   │   ├── sessions.js             # Session CRUD + test history
│   │   └── curriculum.js           # Grade subjects + chapter data
│   ├── utils/
│   │   ├── curriculumData.js       # Complete CBSE curriculum: grades 1-12, all subjects/chapters
│   │   ├── gradePrompts.js         # Grade-adaptive system prompt builder
│   │   └── imageSearch.js          # Wikipedia image search with subject-aware filtering
│   ├── uploads/                    # User uploaded files directory
│   ├── .env                        # Environment variables (git-ignored)
│   └── package.json
│
├── package.json                    # Root workspace (install:all, build, start scripts)
├── render.yaml                     # Render.com deployment config
├── Prompt.md                       # Original project specification document
├── GRADE Wise TOC.xlsx             # CBSE curriculum data source
└── Mock_Test_Structure_Guide.pdf   # Test format & rules reference
```

---

## Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.hnjtokh.mongodb.net/ai-tutor?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=<secret>
GROQ_API_KEY=<groq-api-key>
CLIENT_URL=http://localhost:5173
```

---

## Running the Application

```bash
# Install dependencies (both client and server)
npm run install:all

# Start backend (port 5000)
cd server && node server.js

# Start frontend (port 5173, proxies /api to backend)
cd client && npx vite

# Production build
npm run build    # builds client/dist
npm start        # serves from server
```

---

## Core Features

### 1. Concept Explainer (`/concept-explainer`)
The main learning tool. Students select their subject, chapter, and explanation level (Beginner/Intermediate/Advanced), then chat with AI.

**Capabilities:**
- Text-based questions with grade-adaptive AI responses
- Image upload (textbook screenshots, handwritten notes) - uses Groq vision model
- File upload (PDF, DOC, TXT) - extracts text and answers questions about it
- Wikipedia image search - automatically finds relevant images for topics
- Multi-turn conversation with full context maintained
- Session persistence - resume any previous conversation

**Subject-aware image search:**
- STEM topics (Science, Maths, etc.) -> searches Wikipedia with full topic name
- Literature topics (English, Hindi chapters) -> extracts visual keywords first
  - "The Lazy Frog" -> searches "Frog" (shows a frog image, interactive for young students)
  - "Ice Cream Man" -> searches "Ice Cream" (strips generic person words)
  - Strips stop words, adjectives, and generic person words for better image matches

### 2. Document Summarizer (`/document-summarizer`)
Upload study material and get intelligent summaries.

**Modes:**
- **Full Summary** - comprehensive overview
- **Key Points** - bullet-style extraction
- **Specific Search** - answer specific questions from the document

**Accepts:** PDF files, images (with OCR via Groq vision), pasted text (max 5000 words)

### 3. Project Idea Generator (`/project-generator`)
Generates 4 project ideas based on subject, project type, and optional topic.

**Project Types:**
- Physical Model
- Chart/Poster
- Presentation (PPT)
- Website/App
- Science Experiment
- Research Report

Each idea includes: title, description, materials needed, effort level, CBSE relevance.
Now supports chapter-level topic selection for more specific ideas.

### 4. Exam Preparation (`/exam-prep`)
Two sub-tools:

#### 4A. Mock Test (`/mock-test`)
Full mock test engine with timer, diverse question types, and analytics.

**Question Types (varies by grade):**
- MCQ, True/False, Fill in Blanks
- Match the Following, Sequence Ordering
- Assertion-Reason, Case Study
- HOTS (Higher Order Thinking Skills)
- Code Output, Numerical
- One-Word Answer, Multi-Select
- Integer Type, Matrix Match

**Test Configuration by Grade:**
| Grade | Questions | Time | Difficulty |
|-------|-----------|------|-----------|
| 1-3 | 12 | 20 min | Easy 70% / Med 20% / Hard 10% |
| 4-5 | 15 | 20 min | Easy 70% / Med 20% / Hard 10% |
| 6-8 | 25 | 40 min | Easy 50% / Med 35% / Hard 15% |
| 9-10 | 25 | 40 min | Easy 30% / Med 50% / Hard 20% |
| 11-12 | 30 | 50 min | Easy 30% / Med 50% / Hard 20% |

**Post-test analytics:**
- Score and accuracy percentage
- Topic-wise accuracy breakdown
- Weak areas identified (topics < 50%)
- Percentile rank (Classes 9-12)
- Per-question review with correct answer + detailed explanation + study notes

#### 4B. Focus Area (`/focus-area`)
Deep study material for a specific topic, split into 4 sections:
1. **Complete Knowledge** - full concept explanation with formulas
2. **Mind Map** - structured concept architecture
3. **Exam Questions** - 5-6 commonly asked CBSE questions with answers
4. **Practice Cards** - click-to-reveal Q&A cards

---

## API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/signup` | Register with name, email, password, grade |
| POST | `/login` | Login with email + password |
| GET | `/me` | Get current user profile (auth required) |
| PUT | `/update-grade` | Change grade (recalibrates all AI) |

### AI Routes (`/api/ai`) - All require auth
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/concept-explainer` | Chat with AI (text) |
| POST | `/concept-explainer/image` | Chat with AI (image upload) |
| POST | `/concept-explainer/file` | Chat with AI (file upload) |
| POST | `/summarize` | Summarize document |
| POST | `/project-ideas` | Generate project ideas |
| POST | `/mock-test/generate` | Generate mock test (returns JSON questions) |
| POST | `/mock-test/submit` | Submit test for grading + analytics |
| POST | `/focus-area` | Generate deep study material |
| GET | `/search-image?q=&subject=` | Search Wikipedia for topic image |

### Sessions (`/api/sessions`) - All require auth
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | List sessions (filter by `?tool=`) |
| GET | `/:id` | Get session with chat history |
| DELETE | `/:id` | Delete session |
| GET | `/tests/history` | List test attempts |
| GET | `/tests/:id` | Get detailed test result |

### Curriculum (`/api/curriculum`) - All require auth
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/subjects/:grade` | Get subjects for grade (1-12) |
| GET | `/chapters/:grade/:subject` | Get chapters for a subject |

---

## Database Models

### User
```javascript
{
  name: String,           // required, trimmed
  email: String,          // required, unique, lowercase
  password: String,       // bcrypt hashed (min 6 chars)
  grade: Number,          // 1-12, required
  timestamps: true        // createdAt, updatedAt
}
```

### Session
```javascript
{
  userId: ObjectId,       // ref: User, indexed
  tool: String,           // enum: concept-explainer, document-summarizer, project-generator, exam-prep
  title: String,          // default: "New Session"
  messages: [{
    role: String,         // 'user' or 'assistant'
    content: String,
    images: [String],     // image URLs
    timestamp: Date
  }],
  metadata: {
    subject: String,
    chapter: String,
    topic: String,
    explanationLevel: String,
    summarizationMode: String,
    projectType: String
  },
  timestamps: true
}
```

### TestAttempt
```javascript
{
  userId: ObjectId,       // ref: User, indexed
  subject: String,
  chapters: [String],
  grade: Number,
  questions: [{
    question: String,
    type: String,         // mcq, true-false, fill-blank, match-following, etc.
    options: [String],
    pairs: [{ left, right }],
    items: [String],
    correctAnswer: Mixed,
    studentAnswer: Mixed,
    isCorrect: Boolean,
    explanation: String,
    studyNotes: String,
    difficulty: String,   // easy, medium, hard
    topic: String,
    timeTakenSeconds: Number
  }],
  score: Number,
  totalQuestions: Number,
  accuracy: Number,       // percentage
  timeTaken: Number,      // seconds
  timeAllotted: Number,   // seconds
  topicWiseAccuracy: Object,
  weakAreas: [String],
  percentileRank: Number,
  timestamps: true
}
```

---

## Grade-Adaptive AI System

The AI behavior is calibrated per grade group. Every API call includes the student's grade in the system prompt.

| Grade Group | Tone | Vocabulary | Depth | Examples |
|------------|------|-----------|-------|---------|
| **Class 1-3** | Fun, playful | Very simple, short sentences | Surface-level | Stories, colors, shapes |
| **Class 4-5** | Friendly, encouraging | Simple but structured | Basic reasoning | Real-world analogies |
| **Class 6-8** | Supportive, clear | Technical terms introduced | Conceptual | NCERT-aligned examples |
| **Class 9-10** | Structured, formal | CBSE terminology | Board-exam depth | Previous year patterns |
| **Class 11-12** | Analytical, rigorous | Advanced/competitive | JEE/NEET level | Multi-step problems |

---

## Wikipedia Image Search System

Images are fetched from Wikipedia/Wikimedia (completely free, no API key).

**6-Tier Fallback Chain:**
1. Wikipedia REST API (`/api/rest_v1/page/summary/`) - English
2. MediaWiki PageImages API (`/w/api.php?prop=pageimages`) - English
3. Underscore variant via REST API
4. Wikipedia search (English) -> PageImages for each result
5. Hindi Wikipedia search -> PageImages for each result
6. Wikimedia Commons search

**Subject-Aware Filtering:**
- STEM subjects: search the full topic name directly
- Literature subjects (English, Hindi, Sanskrit, Urdu + CBSE textbook names like Marigold, Honeysuckle, etc.): extract visual keywords first
  - Strips stop words (the, a, in, for...)
  - Strips visual adjectives (lazy, little, happy, naughty...)
  - Strips generic person words (man, woman, boy, king...)
  - Result: "The Lazy Frog" -> "Frog", "Ice Cream Man" -> "Ice Cream"

**Headers:** All requests include `User-Agent: CodeVidhya-AI-Tutor/1.0 (nitin.bharia@codevidhya.com)` per Wikipedia policy.

---

## Client Routing

| Route | Component | Auth Required |
|-------|-----------|:---:|
| `/` | LandingPage | No |
| `/login` | Login | No |
| `/signup` | Signup | No |
| `/dashboard` | Dashboard | Yes |
| `/concept-explainer` | ConceptExplainer | Yes |
| `/concept-explainer/:sessionId` | ConceptExplainer | Yes |
| `/document-summarizer` | DocumentSummarizer | Yes |
| `/project-generator` | ProjectGenerator | Yes |
| `/exam-prep` | ExamPrep | Yes |
| `/mock-test` | MockTest | Yes |
| `/focus-area` | FocusArea | Yes |
| `/test-result/:testId` | TestResult | Yes |

---

## Authentication Flow

1. User signs up with name, email, password, grade
2. Server hashes password with bcryptjs, stores user in MongoDB
3. Server generates JWT token (7-day expiry) containing `userId` and `grade`
4. Token stored in localStorage on client
5. Every API request automatically includes `Authorization: Bearer <token>` via Axios interceptor
6. Auth middleware on server verifies JWT, sets `req.userId` and `req.userGrade`
7. On 401 response, client clears token and redirects to `/login`
8. User can change grade anytime - new JWT issued, all AI recalibrates

---

## Key Utilities

### `gradePrompts.js` - AI Prompt Builder
- `buildSystemPrompt(grade, tool, metadata)` - constructs the system prompt for each AI call
- `getMockTestConfig(grade)` - returns question count, time, difficulty split
- `getExpectedTypes(grade)` - returns valid question types for the grade
- `validateQuestionDiversity(questions, grade)` - ensures at least 3 different question types
- `fixQuestionTypes(questions, grade)` - auto-corrects invalid question types

### `curriculumData.js` - CBSE Curriculum
- `getSubjectsForGrade(grade)` - returns subject list
- `getChaptersForSubject(grade, subject)` - returns chapter list
- Complete data for all grades 1-12, sourced from GRADE_Wise_TOC.xlsx

### `imageSearch.js` - Wikipedia Images
- `searchWikipediaImage(topic, subject)` - main function, returns `{url, alt}` or null
- `isLiteratureSubject(subject)` - checks if subject needs keyword extraction
- `extractVisualKeyword(chapterOrTopic)` - strips non-visual words
- `extractKeyTopic(query)` - strips question prefixes for STEM topics

---

## Deployment

### Render.com Configuration (`render.yaml`)
- Service type: web (Node.js)
- Build: `npm run install:all && npm run build` (installs both client+server deps, builds Vite)
- Start: `npm start` (runs `server.js` which serves built client as static files)
- Required env vars: `MONGODB_URI`, `JWT_SECRET`, `GROQ_API_KEY`

### Production Build
- Vite builds client to `client/dist`
- Express serves `client/dist` as static files
- SPA fallback: all non-API routes serve `index.html`

---

## Git History (Key Milestones)

```
2ad0fa9 Add chapter topics in Project Generator, fix image search in Concept Explainer
d86b4e5 Remove Anthropic SDK, use only Groq for now
d9b83e9 Move Wikipedia image fetch to frontend for instant text loading
4a7b8dc Upgrade AI: Claude integration, Wikipedia images, clear chat on context change
1daf80c Fix slow image loading: make images click-to-generate with timeout
ed59f8c Fix image generation and remove emoji spam from AI responses
86e4f0c Add KaTeX math rendering and Pollinations.ai image generation
f73d508 Switch default AI model from Llama 3.3-70B to Llama 4 Scout
f37b6c6 Enhance grade-specific AI response styles
42eb817 Align Concept Explainer responses with class-specific textbooks
07d6da6 Add file upload option (PDF, TXT, DOC) to Concept Explainer
8e56956 Add subject/chapter selector, voice input, improved prompts
865d10b Add detailed error logging for auth routes and MongoDB
05daf63 Fix Render build: install devDeps for client
0c26f24 Add Render deployment config
d70b3da Fix all 13 audit issues: question variety, time tracking, gamification, PDF downloads
8fde087 Initial commit: AI Tutor application
```

---

## Design Decisions & Architecture Notes

1. **Groq over Anthropic:** Originally integrated Claude API, but switched to Groq (free tier) for cost reasons. Anthropic SDK was fully removed.

2. **Wikipedia over Pollinations.ai:** Originally used Pollinations.ai for AI-generated images, but switched to Wikipedia for faster, more accurate, educational images. No API key needed.

3. **Image fetch on frontend:** Wikipedia image search was moved to be triggered from frontend (non-blocking) so AI text responses load instantly without waiting for image search.

4. **Subject-aware image filtering:** Literature chapters like "The Lazy Frog" were returning unrelated Wikipedia articles ("The Frog Princess"). Fixed by extracting visual keywords for literature subjects while keeping full-term search for STEM.

5. **ES Modules throughout:** Both client and server use ES module syntax (`import/export`), configured via `"type": "module"` in package.json.

6. **No negative marking:** All mock tests have no negative marking per the project spec.

7. **Question type validation:** Mock tests validate that generated questions have at least 3 different types, with auto-correction if the AI generates invalid types for a grade.

---

## CBSE Curriculum Coverage

**Grades 1-5:** Maths, English, Hindi, EVS (Environmental Science)  
**Grades 6-10:** Maths, Science, SST (Social Science), English, Hindi, Computer Science  
**Grades 11-12:** Maths, Physics, Chemistry, Biology, English, Computer Science, Commerce

All chapter data is sourced from the official CBSE NCERT structure (GRADE_Wise_TOC.xlsx).

---

## Frontend Dependencies

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.28.0",
  "axios": "^1.7.7",
  "framer-motion": "^11.11.0",
  "react-markdown": "^9.0.1",
  "remark-math": "^6.0.0",
  "rehype-katex": "^7.0.1",
  "katex": "^0.16.11",
  "react-dropzone": "^14.2.10",
  "react-hot-toast": "^2.4.1",
  "react-icons": "^5.3.0",
  "tailwindcss": "^3.4.15"
}
```

## Backend Dependencies

```json
{
  "express": "^4.21.1",
  "mongoose": "^8.8.3",
  "groq-sdk": "^0.8.0",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3",
  "multer": "^1.4.5-lts.1",
  "pdf-parse": "^1.1.1",
  "cors": "^2.8.5",
  "dotenv": "^16.4.5"
}
```
