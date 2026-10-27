# 🎯 TechXConf Career Compass

> AI-powered career guidance for **TechXConf 2026** attendees — with **Harness observability guardrails**

## 🌐 Live Website

**https://frontend-nine-pi-sfkaoi506c.vercel.app**

| Service | URL |
|---------|-----|
| 🌐 Website | https://frontend-nine-pi-sfkaoi506c.vercel.app |
| 🔌 API (health) | https://frontend-nine-pi-sfkaoi506c.vercel.app/api/health |
| 📊 Observability | https://frontend-nine-pi-sfkaoi506c.vercel.app/observability |
| 📦 GitHub | https://github.com/LijeshS/techxconf-career |

---

## What It Does

1. **Career Assessment** — 4-step questionnaire: role, experience, skills, goals
2. **AI Recommendation Engine** — scores your profile across 4 TechXConf tracks and 27 sessions
3. **Harness Guardrail Checks** — 5 automated pipeline conditions validate every recommendation
4. **Observability Dashboard** — real-time metrics, guardrail trigger charts, event logs
5. **Session Planner** — browse, filter, and bookmark sessions to your personal schedule

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                    VERCEL                        │
│                                                  │
│  ┌──────────────────┐   ┌────────────────────┐  │
│  │  React Frontend  │   │  Serverless API    │  │
│  │  (React 18 SPA)  │──▶│  /api/*.js         │  │
│  └──────────────────┘   └────────┬───────────┘  │
│                                  │               │
└──────────────────────────────────┼───────────────┘
                                   │
                          ┌────────▼────────┐
                          │  Neon Postgres  │
                          │ (Cloud Database)│
                          └─────────────────┘
```

**Everything runs on Vercel** — the React frontend AND the backend API.
The backend is built as **Vercel Serverless Functions** (files in `frontend/api/`).
This means no separate server is needed — Vercel wakes up the API code when a request comes in and shuts it down after. Zero server management.

---

## Project Structure

```
techxconf-career/
├── frontend/                   ← Deployed to Vercel
│   ├── api/                    ← Backend: Vercel Serverless Functions
│   │   ├── _db.js              ← Shared Neon Postgres database client
│   │   ├── users.js            ← POST/GET /api/users
│   │   ├── assessments.js      ← POST/GET /api/assessments (+ recommender + guardrails)
│   │   ├── sessions.js         ← GET /api/sessions, POST/DELETE bookmarks
│   │   ├── observability.js    ← GET /api/observability (metrics + guardrail report)
│   │   └── health.js           ← GET /api/health
│   ├── src/                    ← React frontend
│   │   ├── pages/
│   │   │   ├── Landing.js      ← Hero + signup
│   │   │   ├── Assessment.js   ← 4-step career questionnaire
│   │   │   ├── Results.js      ← Career plan + sessions + guardrail panel
│   │   │   ├── Sessions.js     ← Browse all 27 conference sessions
│   │   │   ├── Dashboard.js    ← User's saved sessions + history
│   │   │   └── Observability.js← Harness-style observability dashboard
│   │   └── components/
│   │       ├── Navbar.js
│   │       ├── SessionCard.js
│   │       ├── GuardrailPanel.js
│   │       └── TrackRadar.js
│   └── vercel.json             ← Vercel routing config
├── backend/                    ← Original Express server (reference only)
└── README.md
```

---

## 4 Conference Tracks — 27 Sessions

| Track | Sessions | Focus |
|-------|----------|-------|
| 🏭 Industry & Innovation | 5 | AI adoption, enterprise strategy, production |
| 🤖 AI & Agentic Intelligence | 8 | LLMs, autonomous agents, Harness loops, AI safety |
| ☁️ Cloud, DevOps & FinOps | 7 | Platform engineering, CI/CD, cloud optimization |
| 📊 Data & Observability | 7 | Data platforms, LLM observability, guardrails |

---

## 5 Guardrail Rules (Harness-style)

| ID | Rule | Severity |
|----|------|----------|
| G001 | Minimum Experience Check | ⚠️ Warning |
| G003 | Session Overload Guard | ℹ️ Info |
| G004 | Harness Alignment Check | ℹ️ Info |
| G005 | LLM Safety & Observability Gate | ⚠️ Warning |

Each assessment gets an **Observability Score (0–100)** and a **Harness Pipeline Fit (%)**.

---

## Database Tables (Neon Postgres)

| Table | Purpose |
|-------|---------|
| `users` | Name, email, role, experience |
| `assessments` | Answers, track scores, recommended sessions, guardrail flags |
| `skills` | User skill tags |
| `sessions` | All 27 TechXConf sessions |
| `bookmarks` | User ↔ session saves |
| `observability_logs` | Every API event with response time + guardrail status |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| POST | /api/users | Create user |
| GET | /api/users?id=xxx | Get user profile + skills + assessments |
| PUT | /api/users?id=xxx | Update user |
| POST | /api/assessments | Submit assessment → returns full career plan |
| GET | /api/assessments?id=xxx | Get assessment result |
| GET | /api/sessions | List all sessions (optional ?track=xxx filter) |
| POST | /api/sessions | Bookmark a session |
| DELETE | /api/sessions | Remove bookmark |
| GET | /api/sessions?bookmarks=1&userId=xxx | Get user bookmarks |
| GET | /api/observability | Dashboard metrics |
| GET | /api/observability?report=guardrails | Guardrail report |

---

## Local Development

```bash
# Install frontend + API deps
cd frontend
npm install

# Add environment variable
echo "DATABASE_URL=your-neon-postgres-url" > .env.local

# Start development server
npm start
# → Opens http://localhost:3000
# → API functions available at http://localhost:3000/api/*
```

> The original Express backend is in `backend/` for reference.
> For production, the `frontend/api/` serverless functions are used.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router, Recharts |
| Backend | Vercel Serverless Functions (Node.js) |
| Database | Neon Postgres (serverless Postgres) |
| Deployment | Vercel (frontend + API) |
| Styling | Custom CSS (dark theme) |

---

*Built for TechXConf 2026 — Powered by Harness observability guardrails*
