from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List
import sqlite3
import jwt
import bcrypt
import json
import os
import re
import random
from datetime import datetime, timedelta
import uvicorn

app = FastAPI(title="AI Interview Screening System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "ai_interview_secret_2024"
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

os.makedirs("uploads", exist_ok=True)

# ─────────────────────────────────────────────
# DATABASE SETUP
# ─────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect("interview.db")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'candidate',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        skills TEXT,
        admin_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        job_id INTEGER,
        resume_path TEXT,
        resume_score REAL DEFAULT 0,
        test_score REAL DEFAULT 0,
        interview_score REAL DEFAULT 0,
        final_score REAL DEFAULT 0,
        rank INTEGER DEFAULT 0,
        status TEXT DEFAULT 'applied',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER,
        question TEXT,
        options TEXT,
        correct_answer INTEGER
    );
    CREATE TABLE IF NOT EXISTS test_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        application_id INTEGER,
        answers TEXT,
        score REAL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS interview_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        application_id INTEGER,
        transcript TEXT,
        confidence_score REAL,
        emotion_score REAL,
        clarity_score REAL,
        overall_score REAL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    # Seed admin
    admin_pw = bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()).decode()
    try:
        c.execute("INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)",
                  ("Admin HR", "admin@company.com", admin_pw, "admin"))
    except:
        pass
    conn.commit()
    conn.close()

init_db()

# ─────────────────────────────────────────────
# AUTH HELPERS
# ─────────────────────────────────────────────
def create_token(data: dict):
    data["exp"] = datetime.utcnow() + timedelta(hours=24)
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

# ─────────────────────────────────────────────
# MODELS
# ─────────────────────────────────────────────
class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class JobCreate(BaseModel):
    title: str
    description: str
    skills: List[str]

class TestQuestion(BaseModel):
    job_id: int
    question: str
    options: List[str]
    correct_answer: int

class TestSubmit(BaseModel):
    application_id: int
    answers: List[int]

class InterviewSubmit(BaseModel):
    application_id: int
    transcript: str
    duration_seconds: int

# ─────────────────────────────────────────────
# AUTH ROUTES
# ─────────────────────────────────────────────
@app.post("/api/auth/register")
def register(user: UserRegister):
    conn = get_db()
    c = conn.cursor()
    hashed = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt()).decode()
    try:
        c.execute("INSERT INTO users (name, email, password) VALUES (?,?,?)",
                  (user.name, user.email, hashed))
        conn.commit()
        uid = c.lastrowid
        token = create_token({"id": uid, "email": user.email, "role": "candidate", "name": user.name})
        return {"token": token, "user": {"id": uid, "name": user.name, "email": user.email, "role": "candidate"}}
    except sqlite3.IntegrityError:
        raise HTTPException(400, "Email already registered")
    finally:
        conn.close()

@app.post("/api/auth/login")
def login(form: OAuth2PasswordRequestForm = Depends()):
    conn = get_db()
    c = conn.cursor()
    user = c.execute("SELECT * FROM users WHERE email=?", (form.username,)).fetchone()
    conn.close()
    if not user or not bcrypt.checkpw(form.password.encode(), user["password"].encode()):
        raise HTTPException(400, "Invalid credentials")
    token = create_token({"id": user["id"], "email": user["email"], "role": user["role"], "name": user["name"]})
    return {"access_token": token, "token_type": "bearer",
            "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]}}

@app.get("/api/auth/me")
def me(current=Depends(get_current_user)):
    return current

# ─────────────────────────────────────────────
# JOB ROUTES
# ─────────────────────────────────────────────
@app.post("/api/jobs")
def create_job(job: JobCreate, current=Depends(get_current_user)):
    if current["role"] != "admin":
        raise HTTPException(403, "Admin only")
    conn = get_db()
    c = conn.cursor()
    c.execute("INSERT INTO jobs (title, description, skills, admin_id) VALUES (?,?,?,?)",
              (job.title, job.description, json.dumps(job.skills), current["id"]))
    conn.commit()
    jid = c.lastrowid
    conn.close()
    return {"id": jid, "message": "Job created"}

@app.get("/api/jobs")
def list_jobs():
    conn = get_db()
    jobs = conn.execute("SELECT * FROM jobs ORDER BY created_at DESC").fetchall()
    conn.close()
    result = []
    for j in jobs:
        result.append({
            "id": j["id"], "title": j["title"], "description": j["description"],
            "skills": json.loads(j["skills"]), "created_at": j["created_at"]
        })
    return result

@app.get("/api/jobs/{job_id}")
def get_job(job_id: int):
    conn = get_db()
    j = conn.execute("SELECT * FROM jobs WHERE id=?", (job_id,)).fetchone()
    conn.close()
    if not j:
        raise HTTPException(404, "Job not found")
    return {"id": j["id"], "title": j["title"], "description": j["description"],
            "skills": json.loads(j["skills"]), "created_at": j["created_at"]}

@app.delete("/api/jobs/{job_id}")
def delete_job(job_id: int, current=Depends(get_current_user)):
    if current["role"] != "admin":
        raise HTTPException(403, "Admin only")
    conn = get_db()
    conn.execute("DELETE FROM jobs WHERE id=?", (job_id,))
    conn.commit()
    conn.close()
    return {"message": "Deleted"}

# ─────────────────────────────────────────────
# APPLICATION / RESUME
# ─────────────────────────────────────────────
@app.post("/api/apply/{job_id}")
async def apply(job_id: int, resume: UploadFile = File(...), current=Depends(get_current_user)):
    conn = get_db()
    c = conn.cursor()

    # Check already applied
    exists = c.execute("SELECT id FROM applications WHERE user_id=? AND job_id=?",
                       (current["id"], job_id)).fetchone()
    if exists:
        conn.close()
        raise HTTPException(400, "Already applied")

    # Save resume
    resume_path = f"uploads/{current['id']}_{job_id}_{resume.filename}"
    content = await resume.read()
    with open(resume_path, "wb") as f:
        f.write(content)

    # Parse resume text for skill matching
    resume_text = ""
    try:
        resume_text = content.decode("utf-8", errors="ignore").lower()
    except:
        pass

    # Get job skills
    job = c.execute("SELECT skills FROM jobs WHERE id=?", (job_id,)).fetchone()
    job_skills = json.loads(job["skills"]) if job else []

    # Score based on skill match
    matched = sum(1 for skill in job_skills if skill.lower() in resume_text)
    resume_score = (matched / len(job_skills) * 100) if job_skills else 50
    # Add some variation
    resume_score = min(100, resume_score + random.randint(5, 20))

    c.execute("INSERT INTO applications (user_id, job_id, resume_path, resume_score) VALUES (?,?,?,?)",
              (current["id"], job_id, resume_path, resume_score))
    conn.commit()
    app_id = c.lastrowid
    conn.close()
    return {"application_id": app_id, "resume_score": round(resume_score, 2)}

@app.get("/api/applications/my")
def my_applications(current=Depends(get_current_user)):
    conn = get_db()
    apps = conn.execute("""
        SELECT a.*, j.title as job_title, j.skills 
        FROM applications a JOIN jobs j ON a.job_id=j.id 
        WHERE a.user_id=? ORDER BY a.created_at DESC
    """, (current["id"],)).fetchall()
    conn.close()
    return [dict(a) for a in apps]

@app.get("/api/applications/{app_id}")
def get_application(app_id: int, current=Depends(get_current_user)):
    conn = get_db()
    app = conn.execute("SELECT * FROM applications WHERE id=?", (app_id,)).fetchone()
    conn.close()
    if not app:
        raise HTTPException(404, "Not found")
    if app["user_id"] != current["id"] and current["role"] != "admin":
        raise HTTPException(403, "Forbidden")
    return dict(app)

# ─────────────────────────────────────────────
# TEST ROUTES
# ─────────────────────────────────────────────
@app.post("/api/tests/question")
def add_question(q: TestQuestion, current=Depends(get_current_user)):
    if current["role"] != "admin":
        raise HTTPException(403, "Admin only")
    conn = get_db()
    conn.execute("INSERT INTO tests (job_id, question, options, correct_answer) VALUES (?,?,?,?)",
                 (q.job_id, q.question, json.dumps(q.options), q.correct_answer))
    conn.commit()
    conn.close()
    return {"message": "Question added"}

@app.get("/api/tests/{job_id}")
def get_test(job_id: int, current=Depends(get_current_user)):
    conn = get_db()
    questions = conn.execute("SELECT * FROM tests WHERE job_id=?", (job_id,)).fetchall()
    conn.close()
    result = []
    for q in questions:
        result.append({
            "id": q["id"],
            "question": q["question"],
            "options": json.loads(q["options"]),
            # Don't send correct answer to candidate
        })
    return result

@app.post("/api/tests/submit")
def submit_test(data: TestSubmit, current=Depends(get_current_user)):
    conn = get_db()
    c = conn.cursor()

    # Get application
    app = c.execute("SELECT * FROM applications WHERE id=?", (data.application_id,)).fetchone()
    if not app or app["user_id"] != current["id"]:
        conn.close()
        raise HTTPException(403, "Forbidden")

    # Get questions
    questions = c.execute("SELECT * FROM tests WHERE job_id=?", (app["job_id"],)).fetchall()

    correct = 0
    for i, q in enumerate(questions):
        if i < len(data.answers) and data.answers[i] == q["correct_answer"]:
            correct += 1

    score = (correct / len(questions) * 100) if questions else 70

    # Check if already submitted
    existing = c.execute("SELECT id FROM test_results WHERE application_id=?", (data.application_id,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(400, "Test already submitted")

    c.execute("INSERT INTO test_results (application_id, answers, score) VALUES (?,?,?)",
              (data.application_id, json.dumps(data.answers), score))
    c.execute("UPDATE applications SET test_score=?, status='test_done' WHERE id=?",
              (score, data.application_id))
    conn.commit()
    conn.close()
    return {"score": round(score, 2), "correct": correct, "total": len(questions)}

# ─────────────────────────────────────────────
# INTERVIEW ROUTES
# ─────────────────────────────────────────────
@app.post("/api/interview/submit")
def submit_interview(data: InterviewSubmit, current=Depends(get_current_user)):
    conn = get_db()
    c = conn.cursor()

    app = c.execute("SELECT * FROM applications WHERE id=?", (data.application_id,)).fetchone()
    if not app or app["user_id"] != current["id"]:
        conn.close()
        raise HTTPException(403, "Forbidden")

    # AI-simulated scoring based on transcript analysis
    text = data.transcript.lower()
    words = len(text.split())

    # Confidence: longer responses = more confident (capped)
    confidence = min(100, 40 + (words / 5))

    # Clarity: check for filler words
    fillers = ["um", "uh", "like", "you know", "basically", "actually"]
    filler_count = sum(text.count(f) for f in fillers)
    clarity = max(30, 90 - filler_count * 5)

    # Emotion: random but weighted positive
    emotion = random.randint(55, 90)

    overall = (confidence * 0.35 + clarity * 0.35 + emotion * 0.30)

    existing = c.execute("SELECT id FROM interview_results WHERE application_id=?", (data.application_id,)).fetchone()
    if existing:
        c.execute("UPDATE interview_results SET transcript=?, confidence_score=?, emotion_score=?, clarity_score=?, overall_score=? WHERE application_id=?",
                  (data.transcript, confidence, emotion, clarity, overall, data.application_id))
    else:
        c.execute("INSERT INTO interview_results (application_id, transcript, confidence_score, emotion_score, clarity_score, overall_score) VALUES (?,?,?,?,?,?)",
                  (data.application_id, data.transcript, confidence, emotion, clarity, overall))

    # Calculate final score
    resume_score = app["resume_score"] or 0
    test_score = app["test_score"] or 0
    final = (resume_score * 0.30 + test_score * 0.35 + overall * 0.35)

    c.execute("UPDATE applications SET interview_score=?, final_score=?, status='completed' WHERE id=?",
              (overall, final, data.application_id))
    conn.commit()

    # Update ranks for this job
    _update_ranks(conn, app["job_id"])
    conn.close()

    return {
        "confidence_score": round(confidence, 2),
        "clarity_score": round(clarity, 2),
        "emotion_score": round(emotion, 2),
        "overall_score": round(overall, 2),
        "final_score": round(final, 2)
    }

def _update_ranks(conn, job_id):
    c = conn.cursor()
    apps = c.execute(
        "SELECT id, final_score FROM applications WHERE job_id=? AND status='completed' ORDER BY final_score DESC",
        (job_id,)
    ).fetchall()
    for rank, a in enumerate(apps, 1):
        c.execute("UPDATE applications SET rank=? WHERE id=?", (rank, a["id"]))
    conn.commit()

@app.get("/api/interview/questions/{job_id}")
def get_interview_questions(job_id: int):
    conn = get_db()
    job = conn.execute("SELECT * FROM jobs WHERE id=?", (job_id,)).fetchone()
    conn.close()
    if not job:
        raise HTTPException(404, "Job not found")
    skills = json.loads(job["skills"])
    questions = [
        f"Tell me about yourself and your experience with {skills[0] if skills else 'your field'}.",
        f"What projects have you worked on related to {skills[1] if len(skills) > 1 else 'this role'}?",
        "What is your biggest professional achievement?",
        "How do you handle tight deadlines and pressure?",
        f"Why do you want to work as a {job['title']}?"
    ]
    return {"questions": questions, "job_title": job["title"]}

# ─────────────────────────────────────────────
# ADMIN REPORTS
# ─────────────────────────────────────────────
@app.get("/api/admin/reports/{job_id}")
def job_report(job_id: int, current=Depends(get_current_user)):
    if current["role"] != "admin":
        raise HTTPException(403, "Admin only")
    conn = get_db()
    apps = conn.execute("""
        SELECT a.*, u.name as candidate_name, u.email as candidate_email
        FROM applications a JOIN users u ON a.user_id=u.id
        WHERE a.job_id=? ORDER BY a.final_score DESC
    """, (job_id,)).fetchall()
    conn.close()
    return [dict(a) for a in apps]

@app.get("/api/admin/stats")
def admin_stats(current=Depends(get_current_user)):
    if current["role"] != "admin":
        raise HTTPException(403, "Admin only")
    conn = get_db()
    total_jobs = conn.execute("SELECT COUNT(*) as c FROM jobs").fetchone()["c"]
    total_candidates = conn.execute("SELECT COUNT(*) as c FROM users WHERE role='candidate'").fetchone()["c"]
    total_apps = conn.execute("SELECT COUNT(*) as c FROM applications").fetchone()["c"]
    completed = conn.execute("SELECT COUNT(*) as c FROM applications WHERE status='completed'").fetchone()["c"]
    conn.close()
    return {
        "total_jobs": total_jobs,
        "total_candidates": total_candidates,
        "total_applications": total_apps,
        "completed_interviews": completed
    }

@app.get("/api/admin/candidates")
def all_candidates(current=Depends(get_current_user)):
    if current["role"] != "admin":
        raise HTTPException(403, "Admin only")
    conn = get_db()
    users = conn.execute("SELECT id, name, email, created_at FROM users WHERE role='candidate'").fetchall()
    conn.close()
    return [dict(u) for u in users]

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
