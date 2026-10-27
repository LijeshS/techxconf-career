# 🎯 TechXConf Career Compass

AI-powered career guidance for **TechXConf 2026** attendees — backed by **Harness observability guardrails**.

## What It Does

1. **Career Assessment** — 4-step questionnaire about role, experience, skills, and goals
2. **AI Recommendation Engine** — scores your profile across all 4 TechXConf tracks and 27 sessions
3. **Harness Guardrail Checks** — 5 automated pipeline conditions validate every recommendation
4. **Observability Dashboard** — real-time metrics, guardrail trigger charts, and event logs
5. **Session Planner** — browse, filter, and bookmark sessions to your personal schedule

## Architecture

```
frontend/        React 18 SPA (port 3000)
backend/         Express.js REST API (port 4000)
  ├── server.js          Entry point + middleware
  ├── database.js        SQLite (better-sqlite3) + schema + seed data
  ├── recommender.js     Career scoring engine
  ├── guardrails.js      Harness-style observability guardrail checks
  └── routes/
       ├── users.js
       ├── assessments.js
       ├── sessions.js
       └── observability.js
```

## Tracks & Sessions

| Track | Sessions |
|-------|----------|
| Industry & Innovation | 5 |
| AI & Agentic Intelligence | 8 |
| Cloud, DevOps & FinOps | 7 |
| Data & Observability | 7 |

## Guardrail Rules

| Rule ID | Name | Severity |
|---------|------|----------|
| G001 | Minimum Experience Check | Warning |
| G002 | Career Pivot Risk Check | Warning |
| G003 | Session Overload Guard | Info |
| G004 | Harness Alignment Check | Info |
| G005 | LLM Safety & Observability Gate | Warning |

## Quick Start

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

Open http://localhost:3000

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/users | Create user |
| GET | /api/users/:id | Get user profile + skills + assessments |
| POST | /api/assessments | Submit assessment → returns career plan |
| GET | /api/sessions | List all sessions (filterable by track) |
| POST | /api/sessions/bookmarks | Bookmark a session |
| GET | /api/observability/metrics | Dashboard metrics |
| GET | /api/observability/guardrail-report | Guardrail trigger breakdown |
