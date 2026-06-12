<h1 align="center">AI Tutor</h1>

<p align="center">
  A personalised, AI-powered study companion for CBSE students (Classes 1–12).<br/>
  Every response adapts to the student's grade — calibrating difficulty, depth, and curriculum scope.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Groq-F55036?style=flat-square&logo=lightning&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" />
</p>

---

## What it does

AI Tutor is a student-facing EdTech toolkit. A student signs up, picks their **grade**, and that grade drives every AI interaction across five tools:

| Tool | What it does |
|---|---|
| 🧩 **Concept Explainer** | Explains any topic at the student's level — accepts **text, an image, or an uploaded file** as the question |
| 📄 **Document Summarizer** | Upload a PDF/notes file and get a clean, grade-appropriate summary |
| 💡 **Project Idea Generator** | Suggests relevant project ideas tailored to the subject and class |
| 📝 **Mock Test** | Generates a practice test, auto-grades the submission, and stores the attempt |
| 🎯 **Focus Area** | Analyses performance to highlight weak areas worth revising |

A **Dashboard** ties them together, and test history is persisted so progress is trackable over time.

## Architecture

```
ai-tutor/
├── client/          # React + Vite + Tailwind SPA
│   └── src/
│       ├── pages/        # ConceptExplainer, DocumentSummarizer, MockTest, ExamPrep, FocusArea, Dashboard, ...
│       ├── components/   # Layout, markdown renderer, headers
│       └── contexts/     # AuthContext (JWT session handling)
└── server/          # Node + Express API
    ├── routes/      # ai.js (LLM tools), auth.js, curriculum.js, sessions.js
    ├── models/      # User, Session, TestAttempt (Mongoose)
    └── middleware/  # JWT auth guard
```

**Stack**

- **Frontend:** React, Vite, Tailwind CSS, React Router
- **Backend:** Node.js, Express, Mongoose (MongoDB)
- **AI:** Groq SDK (fast LLaMA-family inference)
- **Auth:** JWT + bcrypt, session-backed
- **Docs:** `multer` for uploads, `pdf-parse` for PDF text extraction

## Getting started

**Prerequisites:** Node.js 18+, a MongoDB connection string, and a [Groq API key](https://console.groq.com/).

```bash
# 1. Install dependencies for both client and server
npm run install:all

# 2. Configure the server environment
cp server/.env.example server/.env
# then fill in:
#   MONGODB_URI=...
#   JWT_SECRET=...
#   GROQ_API_KEY=...

# 3. Run the API (from /server)
cd server && npm run dev

# 4. Run the client (from /client, in a second terminal)
cd client && npm run dev
```

For a production build, `npm run build` compiles the client and `npm start` serves the app.

## Deployment

Ships with a `render.yaml` for one-click deployment on [Render](https://render.com/) — set `MONGODB_URI`, `JWT_SECRET`, and `GROQ_API_KEY` as environment variables in the dashboard.

## API overview

All AI endpoints sit under `/api/ai` and require a valid JWT:

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/concept-explainer` | Explain a typed question |
| `POST` | `/concept-explainer/image` | Explain from an uploaded image |
| `POST` | `/concept-explainer/file` | Explain from an uploaded file |
| `POST` | `/summarize` | Summarise an uploaded document |
| `POST` | `/project-ideas` | Generate project ideas |
| `POST` | `/mock-test/generate` | Generate a mock test |
| `POST` | `/mock-test/submit` | Grade a submitted test |
| `POST` | `/focus-area` | Identify weak areas |

---
<sub>Built to make adaptive, curriculum-aware tutoring accessible without expensive infrastructure.</sub>
