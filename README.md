# 🤖 AI Interview Screening System

Full-stack hiring automation: Resume AI + Online Test + AI Interview + Auto Ranking

## Tech Stack
- **Backend**: Python FastAPI + SQLite
- **Frontend**: React 18 + CSS (no Tailwind build needed)

---

## 🚀 HOW TO RUN (PyCharm)

### Step 1 — Backend Start Karo

1. PyCharm mein **`backend/`** folder open karo
2. Terminal mein:
```
cd backend
pip install -r requirements.txt
python main.py
```
3. Backend chalega: **http://localhost:8000**
4. API docs: **http://localhost:8000/docs**

---

### Step 2 — Frontend Start Karo

1. **Naya terminal** kholo (PyCharm mein + button)
2. Commands:
```
cd frontend
npm install
npm start
```
3. Browser automatically open hoga: **http://localhost:3000**

---

## 👤 Login Credentials

### Admin (HR)
- Email: `admin@company.com`
- Password: `admin123`

### Candidate
- Register karein: http://localhost:3000/register

---

## 📋 Admin Workflow
1. Login with admin credentials
2. **Manage Jobs** → Create job with title + description + required skills
3. **Add Questions** → Test ke liye MCQ questions add karo (per job)
4. **View Report** → Candidates ki ranking aur scores dekho

## 👥 Candidate Workflow
1. Register/Login
2. **Browse Jobs** → Koi job choose karo
3. **Resume Upload** → AI skill matching hoga
4. **Online Test** → MCQ test do (auto-scored)
5. **AI Interview** → 5 questions, mic se jawab do (speech-to-text)
6. **View Result** → Final score + rank dekho

---

## 📁 Project Structure
```
ai-interview-system/
├── backend/
│   ├── main.py          ← FastAPI app (all API routes)
│   ├── requirements.txt
│   ├── interview.db     ← SQLite (auto-created on first run)
│   ├── uploads/         ← Resume files (auto-created)
│   └── run.sh / run.bat
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── index.css
    │   ├── context/AuthContext.jsx
    │   └── pages/
    │       ├── Landing.jsx
    │       ├── Auth.jsx
    │       ├── CandidateDashboard.jsx
    │       ├── Jobs.jsx
    │       ├── Apply.jsx
    │       ├── Test.jsx
    │       ├── Interview.jsx
    │       ├── Result.jsx
    │       ├── AdminDashboard.jsx
    │       ├── AdminJobs.jsx
    │       ├── AdminTest.jsx
    │       ├── AdminReport.jsx
    │       └── AdminCandidates.jsx
    └── run.sh / run.bat
```

---

## 🔧 Troubleshooting

**"Module not found" error (Python)**
```
pip install fastapi uvicorn python-multipart PyJWT bcrypt pydantic
```

**"npm not found"**
→ Node.js install karo: https://nodejs.org (LTS version)

**CORS error frontend pe**
→ Make sure backend port 8000 pe chal raha hai pehle, phir frontend start karo

**Port 8000 already in use**
```
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux  
lsof -ti:8000 | xargs kill
```

**Speech recognition kaam nahi kar raha**
→ Chrome browser use karo (Firefox mein limited support)
→ HTTPS required in some browsers (localhost pe OK hai)
