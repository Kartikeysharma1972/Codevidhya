# Codevidhya Portal

A single landing + auth portal that sits in front of the three existing apps:

| Role    | Underlying app          | Mounted at |
|---------|-------------------------|------------|
| Student | `student/Ai Tutor`      | `/student` |
| Teacher | `teacher/classroom-ai`  | `/teacher` |
| Admin   | `Admin tool`            | `/admin`   |

When a user signs up they pick a role (and, if Student, a grade 1–12). After
login they land directly on the right app — students on AI Tutor, teachers on
Classroom AI, admins on the Admin Portal. There is only **one URL** in
production: the portal's Express server reverse-proxies the three sub-apps so
nothing else needs to be deployed separately.

## Folder

```
codevidhya-portal/
├── client/   # React + Vite landing, signup, login
└── server/   # Express + MongoDB auth + gateway proxy
```

## Local dev

1. **Install deps**
   ```bash
   cd codevidhya-portal
   npm run install:all
   ```

2. **Configure**
   Copy `server/.env.example` to `server/.env` and edit values.

3. **Run the portal**
   ```bash
   # terminal 1
   npm run dev:server     # http://localhost:4000

   # terminal 2
   npm run dev:client     # http://localhost:5174
   ```

4. **Run the three downstream apps** (in their own terminals)
   - AI Tutor: `student/Ai Tutor/server` and `client` (Vite on 5173)
   - Classroom AI: `teacher/classroom-ai-main/backend` (uvicorn on 8000) and
     `frontend` (Vite on 5175)
   - Admin: `Admin tool/server` and `client` (5176)

In dev, after login the portal redirects students/teachers/admins to those
sub-app dev servers directly. Override via Vite env vars:

```
VITE_STUDENT_URL=http://localhost:5173
VITE_TEACHER_URL=http://localhost:5175
VITE_ADMIN_URL=http://localhost:5176
```

## Production / unified deployment

The portal Express server is the only public endpoint. It:

1. Serves the portal Vite build (`client/dist`).
2. Hosts the unified auth API at `/api/auth/*`.
3. Reverse-proxies `/student/*`, `/teacher/*`, `/admin/*` to the three
   downstream services (URLs configured via env vars
   `STUDENT_APP_URL`, `TEACHER_APP_URL`, `ADMIN_APP_URL`).

```bash
npm run build      # builds client/dist
npm run start      # runs server/server.js
```

So a user only ever opens `https://codevidhya.com` — never three different
portal URLs.

## Auth contract

```http
POST /api/auth/signup
{ name, email, schoolName, role: 'student'|'teacher'|'admin', grade?, password }

POST /api/auth/login
{ email, password }

GET /api/auth/me            # Bearer <token>
```

Password rule: at least 8 characters, at least one uppercase letter and at
least one number.
