# ASIS — AI Student Intelligence System

## Project Structure

```
asis-v2/
├── backend/
│   ├── server.js          ← Express entry point
│   ├── routes/
│   │   ├── ai.js          ← All Anthropic AI calls
│   │   ├── marks.js       ← Marks tracker API
│   │   └── burnout.js     ← Burnout check-in API
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── public/index.html
    └── src/
        ├── index.js        ← React entry
        ├── index.css       ← All styles
        ├── App.js          ← Root component
        ├── AppContext.js   ← Global state
        ├── api/
        │   └── index.js   ← All backend calls (AI, Marks, Burnout)
        ├── components/
        │   └── AppShell.js ← Sidebar + page switcher
        └── pages/
            ├── LoginPage.js
            ├── HomePage.js
            ├── NotesPage.js
            ├── BuddyPage.js
            ├── OtherPages.js  ← ExamPage, QPPage, GapsPage, BurnoutPage
            └── *.js           ← Re-export shims
```

## Setup

### 1. Backend
```bash
cd backend
cp .env.example .env
# Edit .env → add your ANTHROPIC_API_KEY
npm install
npm run dev     # starts on http://localhost:3001
```

### 2. Frontend
```bash
cd frontend
npm install
npm start       # starts on http://localhost:3000
```

`"proxy": "http://localhost:3001"` in frontend/package.json handles all /api/* routing.

## What goes where

| Thing                  | Where it lives          |
|------------------------|-------------------------|
| Anthropic API key      | backend/.env            |
| All AI prompts         | backend/routes/ai.js    |
| Marks & burnout data   | backend (in-memory)     |
| Notes/folders          | frontend localStorage   |
| All backend API calls  | frontend/src/api/index.js |
| Global state           | frontend/src/AppContext.js |

## Backend API Endpoints

| Method | Path                  | What it does              |
|--------|-----------------------|---------------------------|
| POST   | /api/ai/chat          | Study Buddy chat          |
| POST   | /api/ai/exam-strategy | Generate exam plan        |
| POST   | /api/ai/generate-qp   | Generate question paper   |
| POST   | /api/ai/check-answers | Grade student answers     |
| POST   | /api/ai/analyze-gaps  | Knowledge gap analysis    |
| POST   | /api/ai/burnout-tips  | Burnout recovery tips     |
| GET    | /api/marks/:uid       | Get marks history         |
| POST   | /api/marks/:uid       | Add marks entry           |
| DELETE | /api/marks/:uid/:id   | Delete marks entry        |
| GET    | /api/burnout/:uid     | Get burnout history       |
| POST   | /api/burnout/:uid     | Save daily check-in       |

## Production upgrade checklist
- Replace in-memory Maps in routes with MongoDB or PostgreSQL
- Add JWT auth middleware on protected routes
- Add rate limiting on /api/ai/* endpoints
- Set CORS origin to your actual frontend domain
