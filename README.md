# 🤖 AI Interview Screening System

Complete automated candidate screening platform with Resume AI, Face Verification, Online Tests, and Video Interview Analysis.

---

## ✅ Features

| Feature | Description |
|---|---|
| 📷 Photo Registration | Candidate must upload photo at registration (used for identity verification) |
| 📄 AI Resume Analysis | Extracts skills, calculates job match score, identifies gaps |
| 🔍 Face Verification | Verifies candidate identity before test using registered photo |
| 📝 MCQ Online Test | Timed MCQ test with camera monitoring during test |
| 🎥 AI Video Interview | Camera-on interview with emotion analysis & confidence scoring |
| 🤖 Answer Summarization | AI summarizes each interview answer for HR review |
| 🏆 Auto Rankings | Candidates automatically ranked by combined AI score |
| 👔 HR Dashboard | Full candidate reports with scores, radar charts, AI insights |

---

## 📁 Project Structure

```
ai-interview-system/
├── backend/               ← Node.js + Express + MongoDB
│   ├── models/            ← User, Job, Test, Application schemas
│   ├── routes/            ← auth, jobs, tests, interviews, admin, resume
│   ├── middleware/        ← JWT auth, file upload (multer)
│   ├── utils/             ← resumeAnalyzer.js, interviewAnalyzer.js
│   ├── uploads/           ← photos/, resumes/, videos/ (auto-created)
│   ├── server.js          ← Main entry point
│   └── .env               ← Environment variables
│
└── frontend/              ← React + Tailwind
    └── src/
        ├── pages/         ← All pages
        ├── components/    ← Navbar
        ├── context/       ← AuthContext
        └── utils/         ← API service
```

---

## 🚀 How to Run (PyCharm)

### Step 1: Install Prerequisites

Make sure you have installed:
- **Node.js** 18+ → https://nodejs.org
- **MongoDB** → https://www.mongodb.com/try/download/community
- Start MongoDB service before running

### Step 2: Open Two Terminals in PyCharm

**Terminal 1 — Backend:**
```bash
cd ai-interview-system/backend
npm install
npm run dev
```
Backend runs on: **http://localhost:5000**

**Terminal 2 — Frontend:**
```bash
cd ai-interview-system/frontend
npm install
npm start
```
Frontend runs on: **http://localhost:3000**

---

## 👤 Create Admin Account

Use Postman / ThunderClient / curl to create admin:

```bash
POST http://localhost:5000/api/auth/create-admin
Content-Type: application/json

{
  "name": "HR Admin",
  "email": "admin@company.com",
  "password": "admin123",
  "adminSecret": "ADMIN_SECRET_2024"
}
```

Then login at http://localhost:3000/login with those credentials.

---

## 👥 Candidate Flow

1. **Register** → Upload photo (required for face verification)
2. **Browse Jobs** → Select a job position
3. **Upload Resume** → AI analyzes and scores resume (0-100)
4. **Face Verification** → Camera opens, AI verifies identity matches registered photo
5. **MCQ Test** → Timed test with camera monitoring
6. **AI Video Interview** → Camera ON, answer 5 questions, AI analyzes each answer
7. **View Results** → See final score on dashboard

---

## 📊 Scoring Formula

```
Final Score = (Resume Score × 30%) + (Test Score × 30%) + (Interview Score × 40%)
```

**Interview Score** factors:
- Answer length & depth
- Positive/achievement keywords
- Sentence structure
- Relevance to question
- Low filler words (um, uh, basically...)

---

## 🔑 API Endpoints

### Auth
- `POST /api/auth/register` — Register with photo
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user

### Jobs (Public)
- `GET /api/jobs` — All active jobs
- `GET /api/jobs/:id` — Single job

### Jobs (Admin only)
- `POST /api/jobs` — Create job
- `PUT /api/jobs/:id` — Update job
- `DELETE /api/jobs/:id` — Deactivate job

### Resume
- `POST /api/resume/upload/:jobId` — Upload & analyze resume

### Tests
- `GET /api/tests/job/:jobId` — Get test for job
- `POST /api/tests/submit/:testId` — Submit answers
- `POST /api/tests` — Create test (Admin)

### Interviews
- `GET /api/interviews/questions/:jobId` — Get interview questions
- `POST /api/interviews/submit/:appId` — Submit interview answers
- `POST /api/interviews/face-verify/:appId` — Log face verification

### Admin
- `GET /api/admin/dashboard` — Dashboard stats
- `GET /api/admin/applications` — All applications (filterable)
- `GET /api/admin/applications/:id` — Full candidate report
- `PATCH /api/admin/applications/:id/decision` — HR decision
- `GET /api/admin/rankings/:jobId` — Job rankings

---

## ⚙️ Environment Variables (backend/.env)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai_interview_db
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

---

## 🛠️ Tech Stack

**Backend:** Node.js, Express, MongoDB (Mongoose), JWT, Multer, pdf-parse  
**Frontend:** React 18, React Router v6, Axios, Recharts, React-Webcam, React-Toastify  
**AI/ML:** Custom NLP skill extraction, keyword scoring, emotion heuristics  

---

## 📝 Notes

- Camera permissions required for Face Verification and Interview
- Resume PDF/DOC parsing requires readable text (not scanned images)
- For production: integrate real face-api.js for accurate face matching
- MongoDB must be running before starting backend
