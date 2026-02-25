const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'interview.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'candidate',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    required_skills TEXT NOT NULL,
    experience_level TEXT DEFAULT 'junior',
    is_active INTEGER DEFAULT 1,
    admin_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    resume_path TEXT,
    resume_skills TEXT,
    resume_score REAL DEFAULT 0,
    test_score REAL DEFAULT 0,
    interview_score REAL DEFAULT 0,
    final_score REAL DEFAULT 0,
    rank INTEGER,
    status TEXT DEFAULT 'applied',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES users(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id)
  );

  CREATE TABLE IF NOT EXISTS tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id)
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    marks INTEGER DEFAULT 1,
    FOREIGN KEY (test_id) REFERENCES tests(id)
  );

  CREATE TABLE IF NOT EXISTS test_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL,
    test_id INTEGER NOT NULL,
    answers TEXT,
    score REAL DEFAULT 0,
    completed_at DATETIME,
    FOREIGN KEY (application_id) REFERENCES applications(id),
    FOREIGN KEY (test_id) REFERENCES tests(id)
  );

  CREATE TABLE IF NOT EXISTS interviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL,
    transcript TEXT,
    emotions TEXT,
    confidence_score REAL DEFAULT 0,
    communication_score REAL DEFAULT 0,
    relevance_score REAL DEFAULT 0,
    overall_score REAL DEFAULT 0,
    completed_at DATETIME,
    FOREIGN KEY (application_id) REFERENCES applications(id)
  );
`);

// Create default admin if not exists
const bcrypt = require('bcryptjs');
const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@company.com');
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
    'HR Admin', 'admin@company.com', hashedPassword, 'admin'
  );
  console.log('✅ Default admin created: admin@company.com / admin123');
}

console.log('✅ Database initialized successfully');

module.exports = db;
