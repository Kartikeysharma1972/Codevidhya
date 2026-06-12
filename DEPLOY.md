# Deploying Codevidhya to Render

Codevidhya is four cooperating apps that ship as four Render Web Services
behind a single landing page:

| Service                  | Stack             | Purpose                          |
|--------------------------|-------------------|----------------------------------|
| `codevidhya-portal`      | Node + React/Vite | Landing, signup/login, gateway   |
| `codevidhya-ai-tutor`    | Node + React/Vite | Student app (AI Tutor)           |
| `codevidhya-classroom-ai`| Python (FastAPI)  | Teacher app (Classroom AI)       |
| `codevidhya-admin`       | Node + React/Vite | School admin portal              |

`render.yaml` at the repo root is a Render Blueprint that creates all four in
one shot.

---

## 1) Push the repo to GitHub

The remote is already set up to:
`https://github.com/Kartikeysharma1972/Codevidhya.git`

```bash
cd codevidhya
git push -u origin main
```

If you're starting from scratch:
```bash
cd codevidhya
git init
git remote add origin https://github.com/Kartikeysharma1972/Codevidhya.git
git checkout -b main
git add .
git commit -m "Initial commit"
git push -u origin main
```

---

## 2) Create the four services on Render (Blueprint)

1. Log in to <https://dashboard.render.com>.
2. Click **New + → Blueprint**.
3. Connect the GitHub repo `Kartikeysharma1972/Codevidhya`.
4. Render detects `render.yaml` and previews the four services. Click **Apply**.

All four start building. AI Tutor, Classroom AI and Admin Portal will finish
first; the Portal is intentionally configured to need their URLs (see step 3).

---

## 3) Fill in environment variables

On Render every service has a **Environment** tab. The Blueprint marks the
secret values as `sync: false`, which means Render asks you to enter them.

### codevidhya-ai-tutor
| Key            | Value                                                     |
|----------------|-----------------------------------------------------------|
| `MONGODB_URI`  | Your MongoDB Atlas connection string                      |
| `JWT_SECRET`   | A long random string                                      |
| `GROQ_API_KEY` | Your Groq API key                                         |

### codevidhya-classroom-ai
| Key            | Value                                                     |
|----------------|-----------------------------------------------------------|
| `GROQ_API_KEY` | Your Groq API key                                         |

### codevidhya-admin
| Key            | Value                                                     |
|----------------|-----------------------------------------------------------|
| `MONGODB_URI`  | Same MongoDB Atlas string as AI Tutor                     |
| `JWT_SECRET`   | A long random string                                      |

### codevidhya-portal — set AFTER the other three are deployed
Wait for the other three services to print their public URL on the dashboard
(e.g. `https://codevidhya-ai-tutor.onrender.com`). Then fill the portal with:

| Key                  | Value                                                     |
|----------------------|-----------------------------------------------------------|
| `MONGODB_URI`        | A separate Atlas database (or the same cluster + DB name `codevidhya-portal`) |
| `JWT_SECRET`         | A long random string                                      |
| `STUDENT_APP_URL`    | `https://codevidhya-ai-tutor.onrender.com`                |
| `TEACHER_APP_URL`    | `https://codevidhya-classroom-ai.onrender.com`            |
| `ADMIN_APP_URL`      | `https://codevidhya-admin.onrender.com`                   |
| `VITE_STUDENT_URL`   | same as `STUDENT_APP_URL`                                 |
| `VITE_TEACHER_URL`   | same as `TEACHER_APP_URL`                                 |
| `VITE_ADMIN_URL`     | same as `ADMIN_APP_URL`                                   |

The `VITE_*` values are read at **build time** by the portal client, so once
you set them you need to **redeploy** the portal (Render → portal → Manual
Deploy → Deploy latest commit).

---

## 4) Test

Open the portal's public URL (e.g.
`https://codevidhya-portal.onrender.com`).

1. Land on the unified landing page.
2. Click **Get Started** and sign up as Student / Teacher / Admin (student
   must pick a grade 1-12). Password rule: 8+ chars, 1 uppercase, 1 number.
3. The portal mirrors the user into the matching sub-app's database, issues a
   handoff token, and redirects you straight to that sub-app's dashboard with
   no second login.

> **Note**: Render's free plan spins services down after 15 minutes of
> inactivity. The first signup that has to wake a sleeping sub-app may take
> ~30 seconds and may not receive a handoff (the sub-app call timed out). If
> that happens, log in once at the sub-app's URL; subsequent portal logins
> work normally.

---

## How the platform fits together

```
Browser ──► codevidhya-portal.onrender.com
                │
                ├── /  /signup  /login         (portal SPA)
                ├── /api/auth/*                 (portal Express)
                │       │
                │       ├──► AI Tutor /api/auth/*
                │       ├──► Classroom AI /api/auth/*
                │       └──► Admin /api/auth/*
                │
                └── after login redirects browser to:
                    https://codevidhya-ai-tutor.onrender.com/dashboard?cv_handoff=…
                    https://codevidhya-classroom-ai.onrender.com/dashboard?cv_handoff=…
                    https://codevidhya-admin.onrender.com/?cv_handoff=…
```

The handoff query string carries a short-lived sub-app JWT that each sub-app's
`main.jsx` consumes on boot, writing the token into its own `localStorage` so
the user lands on the dashboard already authenticated.

---

## Local development

```bash
# In separate terminals
cd codevidhya-portal && npm run install:all && npm run dev:server   # :4000
cd codevidhya-portal && npm run dev:client                          # :5174
cd "student/Ai Tutor" && npm run install:all                        # :5000 + :5173
cd teacher/classroom-ai-main/backend && python main.py              # :8001
cd teacher/classroom-ai-main/frontend && npm install && npm run dev # :5176
cd "Admin tool" && npm run install:all                              # :5001 + :5177
```

Open <http://localhost:5174>.
