# Codevidhya School Admin Portal
## Complete Feature Report & Presentation Guide

**Platform**: Codevidhya AI-Powered Education Suite  
**Module**: School Admin Portal  
**Version**: 2.0 (with 10 Advanced Features)  
**Date**: June 2026  

---

## Executive Summary

The Codevidhya School Admin Portal is a centralized monitoring and management dashboard that gives school administrators (principals, vice-principals, coordinators) complete visibility into how AI-powered teaching and learning tools are being used across the institution. It connects to two independent platforms — **Classroom AI** (for teachers) and **AI Tutor** (for students) — providing cross-platform analytics, risk detection, content moderation, and cost tracking from a single interface.

**Tech Stack**: React + Vite (Frontend) | Express.js (Backend) | MongoDB Atlas + SQLite (Dual Database)  
**Architecture**: Read-only cross-database access with graceful fallback

---

## Table of Contents

1. [Core Dashboard & Overview](#1-core-dashboard--overview)
2. [Teacher Monitoring](#2-teacher-monitoring)
3. [Student Monitoring](#3-student-monitoring)
4. [Chat Monitor & Content Moderation](#4-chat-monitor--content-moderation)
5. [Analytics & Visualizations](#5-analytics--visualizations)
6. [Student Risk Detection (Early Warning System)](#6-student-risk-detection-early-warning-system)
7. [Time-Based Comparisons & Trends](#7-time-based-comparisons--trends)
8. [Export & Reports](#8-export--reports)
9. [Content Moderation & Auto-Flagging](#9-content-moderation--auto-flagging)
10. [Teacher Effectiveness Correlation](#10-teacher-effectiveness-correlation)
11. [Curriculum Coverage Heatmap](#11-curriculum-coverage-heatmap)
12. [Engagement Depth Metrics](#12-engagement-depth-metrics)
13. [Admin User Management & Settings](#13-admin-user-management--settings)
14. [Comparative Analytics](#14-comparative-analytics)
15. [API Cost Tracking](#15-api-cost-tracking)
16. [Security & Authentication](#16-security--authentication)
17. [Technical Architecture](#17-technical-architecture)

---

## 1. Core Dashboard & Overview

### What It Does
The main dashboard provides a bird's-eye view of the entire school's AI platform usage with real-time statistics pulled from both teacher (SQLite) and student (MongoDB) databases.

### Key Metrics Displayed
| Metric | Source | Description |
|--------|--------|-------------|
| Total Teachers | SQLite | Count of registered teachers on Classroom AI |
| Total Students | MongoDB | Count of registered students on AI Tutor |
| Lessons Generated | SQLite | Total AI-generated lessons/content by teachers |
| Mock Tests | MongoDB | Total mock tests attempted by students |
| Active Teachers Today | SQLite | Teachers who used AI tools today |
| Active Students Today | MongoDB | Students who interacted with AI Tutor today |
| Flagged Chats | MongoDB | Pending moderation items (clickable alert card) |

### Visual Components
- **Grade Distribution Bar Chart** — Shows student count per grade (1-12)
- **Tool Usage Pie Chart** — Breakdown of which AI tools are most used (Lesson Planner, Quiz Generator, Study Helper, etc.)
- **Recent Activity Table** — Last 10 teacher actions with teacher name, tool used, topic, and timestamp

### How It Works
1. Admin logs in with JWT-authenticated credentials
2. Dashboard calls `GET /api/dashboard` which queries both databases simultaneously
3. SQLite provides teacher/lesson data, MongoDB provides student/test data
4. If either database is unavailable, that section shows zeros gracefully (no crashes)
5. Weekly trends are calculated by comparing last 7 days vs previous 7 days

---

## 2. Teacher Monitoring

### What It Does
Complete visibility into every teacher's AI platform usage — what content they're generating, how often, and which tools they prefer.

### Features
- **Teacher List** — Searchable table with name, email, school, total lessons, last active date
- **Teacher Detail View** — Individual teacher profile showing:
  - Total lessons generated
  - Number of tools used
  - Student count under this teacher
  - Tool usage breakdown (bar chart)
  - Full paginated chat/content history
  - Content preview modal (click any lesson to view full AI-generated content)
- **CSV Export** — One-click download of all teacher data

### How It Works
- Teacher data lives in SQLite (`users` and `chat_history` tables)
- `GET /api/teachers` returns list with LEFT JOIN for lesson counts
- `GET /api/teachers/:id` returns detailed profile with usage stats
- `GET /api/teachers/:id/chats` returns paginated content history
- Search is client-side filtering on name, email, and school

---

## 3. Student Monitoring

### What It Does
Track every student's learning journey — sessions, test scores, weak areas, and engagement patterns.

### Features
- **Student List** — Filterable by grade (1-12), searchable by name/email, paginated
- **Student Detail View** — Individual student profile showing:
  - Average accuracy across all tests
  - Total tests taken
  - Total AI sessions
  - Weak areas (auto-detected from test data, shown as badges)
  - Tool usage chart
  - Test history table (subject, score, accuracy, date)
  - Session history table (tool, title, messages, date)
- **CSV Export** — Download student data with optional grade filter

### How It Works
- Student data lives in MongoDB Atlas (`users`, `sessions`, `testattempts` collections)
- `GET /api/students` uses aggregation pipeline to compute session_count and test_count per student
- `GET /api/students/:id` aggregates performance metrics, weak areas, and tool usage
- Pagination is server-side with `page` and `limit` parameters

---

## 4. Chat Monitor & Content Moderation

### What It Does
Monitor all AI conversations happening on both platforms. View teacher-generated content and student chat sessions. Flag inappropriate content for review.

### Features
- **Three Tabs**: Teacher Chats | Student Chats | Flagged Chats
- **Teacher Chat View** — Browse all AI-generated lessons with filters by tool type and search by topic. Click any row to view full content in a modal.
- **Student Chat View** — Browse all student AI sessions. Click to see full conversation with chat bubbles (user messages vs AI responses).
- **Flag Any Chat** — Red flag button on every row opens a modal to enter a reason and flag the chat for admin review.
- **Flagged Chats Tab** — View all flagged items, review status (pending/reviewed/escalated/dismissed), add review notes.
- **Auto-Scan Button** — "Scan for Keywords" runs automated keyword detection on recent student chats.

### How It Works
- Teacher chats: `GET /api/chats/teacher-chats` queries SQLite with pagination and filters
- Student chats: `GET /api/chats/student-chats` queries MongoDB with $lookup for user info
- Flagging: `POST /api/moderation/flag` creates a FlaggedChat document in MongoDB
- Review: `PUT /api/moderation/flagged/:id/review` updates status and adds review notes
- Auto-scan: `POST /api/moderation/scan` checks last 24h of messages against keyword list

---

## 5. Analytics & Visualizations

### What It Does
Rich visual analytics across 10+ dimensions — usage trends, tool popularity, grade performance, teacher rankings, subject analysis, and more.

### Charts Available
| Chart | Type | Description |
|-------|------|-------------|
| Usage Over Time | Line Chart | Daily lesson count for last 30 days |
| Tool Popularity | Horizontal Bar | Which AI tools are most used |
| Grade Performance | Bar Chart | Average test accuracy per grade |
| Top Teachers | Horizontal Bar | Top 10 teachers by content generated |
| Student Performance | Bar Chart | Average accuracy by subject |
| Teacher Effectiveness | Horizontal Bar | Teacher activity vs student outcomes |
| Engagement Depth | Bar Chart | Average messages per tool |
| Subject Benchmarks | Horizontal Bar | Subjects ranked by difficulty |
| Curriculum Heatmap | Grid/Table | Topic coverage across subjects |
| Cost Tracking | Line Chart | Daily estimated API costs |

### How It Works
- All analytics are computed server-side via SQL queries and MongoDB aggregation pipelines
- Charts rendered with Recharts library
- Each endpoint handles missing data gracefully (returns empty arrays)
- Promise.allSettled ensures partial failures don't break the entire page

---

## 6. Student Risk Detection (Early Warning System)

### What It Does
Automatically identifies at-risk students who may need intervention. Three categories of risk:

### Risk Categories

#### A. Declining Performance
- **Detection**: Compares average accuracy of student's last 3 tests vs their previous 3 tests
- **Threshold**: Flags if accuracy dropped by 10+ percentage points
- **Display**: Shows recent average, previous average, and exact drop percentage
- **Color Coding**: Drop > 20% shown in red, 10-20% in amber

#### B. Inactive Students
- **Detection**: Students whose last activity (updatedAt) is older than 7 days
- **Display**: Shows last active date and days inactive count
- **Color Coding**: > 30 days inactive shown in red

#### C. Consistently Struggling
- **Detection**: Students with overall average accuracy below 40% across all tests
- **Threshold**: Minimum 40% accuracy (configurable in Settings)
- **Display**: Shows average accuracy and total tests taken

### Summary Cards
- Total At-Risk count (deduplicated — student appearing in multiple categories counted once)
- Individual counts per category
- Each row is clickable — navigates to student detail page

### How It Works
- `GET /api/alerts/at-risk` runs 3 MongoDB aggregation pipelines
- Declining: Groups testattempts by userId, sorts by createdAt, compares last 3 vs previous 3
- Inactive: Filters users collection by updatedAt < 7 days ago
- Struggling: Aggregates all testattempts, filters by avg accuracy < 40%
- Deduplication ensures summary.total_at_risk doesn't double-count

---

## 7. Time-Based Comparisons & Trends

### What It Does
Every key metric on the dashboard now shows week-over-week change with visual trend indicators.

### Metrics Tracked
| Metric | Comparison | Source |
|--------|-----------|--------|
| New Teachers | This week vs last week | SQLite users table (created_at) |
| New Students | This week vs last week | MongoDB users collection (createdAt) |
| Lessons Generated | This week vs last week | SQLite chat_history (created_at) |
| Tests Attempted | This week vs last week | MongoDB testattempts (createdAt) |

### Visual Indicators
- **Green arrow up** + positive percentage = growth
- **Red arrow down** + negative percentage = decline
- **Gray dash** + 0% = no change
- Format: "+12.5% vs last week" or "-5.3% vs last week"

### How It Works
- Dashboard API calculates two date ranges: last 7 days and 7-14 days ago
- Queries both databases for counts in each period
- Change percentage = ((current - previous) / max(previous, 1)) * 100
- Returned in `trends` object alongside existing dashboard data

---

## 8. Export & Reports

### What It Does
One-click CSV export on all major data pages plus a comprehensive printable summary report.

### Export Capabilities
| Page | Export | File |
|------|--------|------|
| Teachers | All teacher data with lesson counts | teachers.csv |
| Students | All students with sessions/tests (grade filterable) | students.csv |
| Analytics | Summary analytics data | analytics.csv |
| Reports | Full printable report | Browser print |

### CSV Export Details
- Headers: Content-Type: text/csv with Content-Disposition for auto-download
- Proper escaping for commas and special characters in data
- Downloads as blob via axios with responseType: 'blob'

### Printable Report Page
A dedicated /reports page that generates a comprehensive print-friendly report:
- **Overview Stats** — Teachers, Students, Lessons, Tests, Active counts, Avg Accuracy
- **Weekly Trends** — All metrics with change percentages
- **Grade Performance Table** — Per-grade accuracy, test counts, session counts
- **Tool Usage Table** — Each tool's usage count and percentage of total
- **Top Teachers Table** — Name, email, school, lessons generated
- **At-Risk Summary** — Counts of declining, inactive, and struggling students

### How It Works
- Export endpoints: `GET /api/export/teachers`, `/students`, `/analytics` with `?format=csv`
- Report endpoint: `GET /api/export/report` returns comprehensive JSON
- Frontend ExportButton component handles blob download with loading spinner
- Print styles hide sidebar, navigation, and non-essential UI elements
- @media print CSS ensures clean, professional output

---

## 9. Content Moderation & Auto-Flagging

### What It Does
Ensures a safe, controlled learning environment by detecting and flagging potentially inappropriate content in AI conversations.

### Manual Flagging
- Any chat (teacher or student) can be flagged from the Chat Monitor page
- Admin clicks the flag icon, enters a reason, and submits
- Flagged items appear in the "Flagged Chats" tab

### Automated Keyword Scanning
- "Scan for Keywords" button triggers server-side scan of last 24 hours of student chats
- **Default Keywords**: hate, kill, die, suicide, weapon, gun, drugs, bully, threat, hurt, abuse
- Keywords are configurable through the Settings page
- Matched messages are auto-flagged with `autoFlagged: true` and matched keywords stored
- Prevents re-flagging of already-flagged sessions

### Review Workflow
1. Flagged chat appears with status "Pending"
2. Admin opens the review modal
3. Views original chat content
4. Sets status: Reviewed | Escalated | Dismissed
5. Adds review notes
6. Saves — flaggedChat updated with reviewedBy, reviewedAt, and notes

### Dashboard Integration
- Flagged chats counter appears on Dashboard when pending > 0
- Shows as a warning-colored StatsCard: "3 flagged chats need review"
- Clickable — navigates directly to Chat Monitor

### How It Works
- MongoDB model: `FlaggedChat` with chatType, chatId, reason, status, keywords, review tracking
- `POST /api/moderation/flag` — manual flagging
- `POST /api/moderation/scan` — automated scan with configurable keywords
- `GET /api/moderation/flagged` — list with pagination
- `PUT /api/moderation/flagged/:id/review` — update status
- `GET /api/moderation/stats` — counts by status for dashboard card

---

## 10. Teacher Effectiveness Correlation

### What It Does
Cross-references teacher activity data (from Classroom AI/SQLite) with student performance data (from AI Tutor/MongoDB) to measure teaching effectiveness.

### What It Shows
- Each teacher's name and total lessons generated
- Number of students linked to that teacher
- Average accuracy of their students on AI Tutor tests
- Correlation score combining teacher activity and student outcomes

### Correlation Score Formula
```
correlation_score = (student_avg_accuracy * 0.6) + (normalized_lessons * 0.4)
```
Where `normalized_lessons = (teacher_lessons / max_lessons_among_all) * 100`

### How It Works
- Queries SQLite for teacher-student mappings (students table linked to users table)
- For each teacher's students, queries MongoDB testattempts for average accuracy
- Cross-database join happens in the application layer (not database level)
- Results sorted by student average accuracy descending
- Visualized as horizontal bar chart in Analytics page

---

## 11. Curriculum Coverage Heatmap

### What It Does
Shows which topics and subjects are being studied most/least across grades, helping identify curriculum gaps.

### Visual Design
- Grid/table layout: rows = subjects, columns = topics/chapters
- Cell color intensity indicates session count:
  - **White/Gray** — Topic not studied at all
  - **Light Green** — Low coverage (few sessions)
  - **Medium Green** — Moderate coverage
  - **Dark Green** — High coverage (many sessions)
- Color legend at bottom for quick reference

### Filters
- Grade dropdown (1-12) to filter by specific grade
- "All Grades" shows aggregated view

### How It Works
- `GET /api/analytics/curriculum-coverage?grade=X`
- Aggregates MongoDB sessions by subject and topic fields
- Also includes testattempts data grouped by chapters
- Returns: `{coverage: [{grade, subject, topic, session_count}]}`
- Frontend builds a 2D grid from the flat data array

---

## 12. Engagement Depth Metrics

### What It Does
Measures how deeply students engage with AI tools — not just whether they use them, but how meaningfully.

### Key Metrics
| Metric | Description |
|--------|-------------|
| Avg Messages/Session | Average number of messages per AI chat session |
| Deep Sessions (10+) | Sessions with 10+ messages (meaningful engagement) |
| Abandoned Sessions (1 msg) | Sessions where student sent only 1 message then left |
| Returning Users | Students who used the platform on 3+ unique days |
| Returning User % | Percentage of total users who are returning users |
| Avg Test Time | Average time spent per mock test (seconds) |
| Tool Engagement | Average messages per tool type |

### What These Metrics Tell You
- **High abandoned sessions** → Students may not find the AI useful or UX may need improvement
- **Low returning users** → Platform adoption may need intervention
- **Deep sessions by tool** → Which tools generate the most meaningful learning interactions
- **Avg test time** → Whether students are rushing through tests or engaging thoughtfully

### How It Works
- `GET /api/analytics/engagement`
- MongoDB aggregation on sessions: $size of messages array, grouping by tool
- Returning users: aggregates distinct session dates per user, filters >= 3 unique days
- Tool engagement: groups sessions by tool field, averages message count

---

## 13. Admin User Management & Settings

### What It Does
Manage admin portal users and configure system-wide settings from a dedicated Settings page.

### Admin User Management
- **View All Admins** — Table showing name, email, school, role, creation date
- **Add New Admin** — Modal form with name, email, password, school, role selection
- **Role Types**: Admin, Super Admin, Viewer
- **Delete Admin** — Confirmation modal with safety check (can't delete yourself)

### Portal Settings (Configurable)
| Setting | Default | Description |
|---------|---------|-------------|
| Flagging Keywords | 11 keywords | Words that trigger auto-flagging in student chats |
| Inactive Days Threshold | 14 days | After how many inactive days to flag a student |
| Accuracy Drop Threshold | 15% | Minimum accuracy drop to trigger declining alert |
| Min Accuracy Threshold | 40% | Below this average accuracy = struggling student |

### Keywords Management
- Displayed as removable tags/badges
- Add new keywords via text input (Enter or Add button)
- Remove by clicking X on any tag
- Changes saved via Save Settings button

### How It Works
- Admin CRUD: `GET/POST/DELETE /api/management/admins`
- Settings: Singleton MongoDB model (`Settings`) with getSettings() static method
- Settings endpoints: `GET/PUT /api/management/settings`
- Password hashing with bcrypt for new admin creation

---

## 14. Comparative Analytics

### What It Does
Compare performance across grades and rank subjects by difficulty for data-driven curriculum decisions.

### Grade Comparison
- Select any two grades from dropdowns (1-12)
- Click "Compare" to see side-by-side metrics
- **Compared Metrics**: Student count, Sessions, Tests, Average Accuracy
- Winner in each category highlighted in green

### Subject Benchmarks
- All subjects ranked by average accuracy (lowest = hardest)
- Color-coded bars:
  - **Green** (70%+) — Students performing well
  - **Amber** (50-70%) — Moderate difficulty
  - **Red** (< 50%) — Subjects where students struggle most
- Helps identify subjects needing additional teaching support

### How It Works
- Grade comparison: `GET /api/analytics/grade-comparison?grade1=X&grade2=Y`
  - Aggregates MongoDB data per grade: user count, session count, test count, avg accuracy
- Subject benchmarks: `GET /api/analytics/subject-benchmarks`
  - Aggregates testattempts by subject, calculates avg accuracy, assigns difficulty rank

---

## 15. API Cost Tracking

### What It Does
Estimates API costs for both Classroom AI and AI Tutor platforms based on usage patterns, helping with budget planning and resource allocation.

### Cost Estimation Model
| Activity | Estimated Tokens | Rate |
|----------|-----------------|------|
| Teacher Lesson (Classroom AI) | ~2,000 tokens | $0.0001/token |
| Student Message (AI Tutor) | ~1,500 tokens | $0.0001/token |
| Mock Test Generation + Grading | ~3,000 tokens | $0.0001/token |

### Display
- **Summary Cards**: Total cost (period), Average daily cost, Cost by platform (Classroom AI vs AI Tutor)
- **Daily Cost Line Chart**: Day-by-day cost trend over selected period
- **Date Range Selector**: 7 / 14 / 30 / 90 days
- **Disclaimer**: "Costs are estimates based on token usage patterns"

### How It Works
- `GET /api/analytics/cost-tracking?days=30`
- Counts daily lessons from SQLite chat_history (grouped by DATE)
- Counts daily messages and tests from MongoDB sessions and testattempts
- Applies token estimation formulas per activity type
- Returns daily breakdown and platform-level totals

---

## 16. Security & Authentication

### Authentication System
- **JWT-based authentication** with 7-day token expiry
- **Setup flow**: First admin created with a setup key (`ADMIN_SETUP_KEY` environment variable)
- **Login flow**: Email + password → bcrypt comparison → JWT token
- **Session persistence**: Token stored in localStorage, verified on every page load
- **Protected routes**: All API endpoints (except auth) require valid JWT via auth middleware
- **401 handling**: Automatic redirect to login on expired/invalid tokens

### Data Security
- **Read-only SQLite access**: Admin portal cannot modify teacher/student data
- **No credential storage**: Admin portal doesn't store Classroom AI or AI Tutor passwords
- **Environment variables**: All sensitive values (MongoDB URI, JWT secret, setup key) in .env file
- **Password hashing**: bcrypt with salt rounds for admin passwords

---

## 17. Technical Architecture

### System Architecture Diagram
```
                    +-----------------------+
                    |   School Admin Portal |
                    |   (Port 5001)         |
                    +-----------+-----------+
                                |
                    +-----------+-----------+
                    |                       |
            +-------+-------+     +--------+--------+
            |   SQLite DB   |     |  MongoDB Atlas   |
            | (Read-Only)   |     |  (Read-Only)     |
            +-------+-------+     +--------+--------+
                    |                       |
            +-------+-------+     +--------+--------+
            | Classroom AI  |     |    AI Tutor      |
            | (Teacher App) |     |  (Student App)   |
            +---------------+     +-----------------+
```

### Database Access Pattern
- **SQLite (Teacher Data)**: Opened read-only via `better-sqlite3`. Returns `null` from `getDb()` if file not found. All routes check for null before querying.
- **MongoDB Atlas (Student Data)**: Connected via `mongoose.connect()` with 10-second timeout. Returns `null` from `getMongoDB()` if connection not ready. All routes check for null before querying.
- **Graceful Degradation**: If either database is unavailable, the portal still works — affected sections show empty data with no errors.

### Frontend Architecture
- **React 18** with Vite for fast development and builds
- **Tailwind CSS** with custom emerald green theme (primary-50 through primary-950)
- **Framer Motion** for smooth page transitions and micro-animations
- **Recharts** for all data visualizations
- **React Router v6** with nested layouts and protected routes
- **Axios** instance with JWT Bearer token interceptor

### Backend Architecture
- **Express.js** with modular route files
- **Mongoose** for MongoDB models (Admin, FlaggedChat, Settings, CostLog)
- **better-sqlite3** for synchronous SQLite queries
- **bcryptjs** for password hashing
- **jsonwebtoken** for JWT generation and verification

### API Endpoints Summary
| Route Group | Endpoints | Purpose |
|------------|-----------|---------|
| `/api/auth` | 3 | Login, Setup, Profile |
| `/api/dashboard` | 1 | Combined stats + trends |
| `/api/teachers` | 3 | List, Detail, Chats |
| `/api/students` | 2 | List, Detail |
| `/api/chats` | 3 | Teacher chats, Student chats, Session detail |
| `/api/analytics` | 12 | All analytics + new features |
| `/api/alerts` | 1 | At-risk students |
| `/api/export` | 4 | CSV exports + report |
| `/api/moderation` | 5 | Flag, List, Review, Stats, Scan |
| `/api/management` | 5 | Admin CRUD + Settings |
| **Total** | **39 API endpoints** | |

### Pages Summary
| Page | Route | Features |
|------|-------|----------|
| Login | /login | Login + First-time setup |
| Dashboard | / | Stats, trends, charts, flagged alerts |
| Alerts | /alerts | At-risk student detection |
| Teachers | /teachers | Teacher list + export |
| Teacher Detail | /teachers/:id | Individual teacher profile |
| Students | /students | Student list + filter + export |
| Student Detail | /students/:id | Individual student profile |
| Chat Monitor | /chats | 3-tab chat view + moderation |
| Analytics | /analytics | 10+ chart sections |
| Reports | /reports | Printable summary report |
| Settings | /settings | Admin management + config |
| **Total** | **11 pages** | |

---

## Feature Comparison: Before vs After

| Capability | Before (v1) | After (v2) |
|-----------|------------|------------|
| API Endpoints | 12 | 39 |
| Pages | 7 | 11 |
| Dashboard Stats | 4 basic | 7 with trends |
| Analytics Charts | 5 | 10+ |
| Risk Detection | None | 3 categories |
| Content Moderation | None | Manual + Auto |
| Export | None | CSV + Print |
| Cost Tracking | None | Full estimation |
| Admin Management | None | Full CRUD + Settings |
| Comparative Analysis | None | Grade vs Grade + Benchmarks |
| Curriculum Analysis | None | Heatmap visualization |
| Engagement Metrics | None | 7 depth metrics |

---

## Deployment Notes

### Environment Variables Required
```
MONGODB_URI=mongodb+srv://...        # MongoDB Atlas connection string
SQLITE_PATH=../../teacher/.../classroomai.db  # Path to Classroom AI SQLite
JWT_SECRET=your-secret-key           # JWT signing secret
ADMIN_SETUP_KEY=your-setup-key       # First admin creation key
PORT=5001                            # Server port
```

### Build & Run
```bash
# Backend
cd Admin/server
npm install
node server.js

# Frontend (development)
cd Admin/client
npm install
npm run dev

# Frontend (production build)
npm run build
# Built files served by Express in production mode
```

---

*Codevidhya School Admin Portal v2.0 — Built for complete school AI governance*
