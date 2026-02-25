const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Setup multer for resume upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/resumes');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `resume_${Date.now()}_${file.originalname}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Extract skills from text (simple keyword matching)
function extractSkills(text) {
  const skillKeywords = [
    'javascript', 'python', 'java', 'react', 'node.js', 'nodejs', 'express',
    'sql', 'mysql', 'mongodb', 'postgresql', 'html', 'css', 'typescript',
    'angular', 'vue', 'php', 'c++', 'c#', 'ruby', 'swift', 'kotlin',
    'docker', 'kubernetes', 'aws', 'azure', 'git', 'linux', 'rest api',
    'machine learning', 'deep learning', 'data science', 'tensorflow', 'pytorch',
    'flutter', 'react native', 'django', 'flask', 'spring', 'laravel',
    'figma', 'ui/ux', 'agile', 'scrum', 'devops', 'ci/cd', 'redis',
    'graphql', 'microservices', 'blockchain', 'android', 'ios'
  ];
  
  const lowerText = text.toLowerCase();
  return skillKeywords.filter(skill => lowerText.includes(skill));
}

// Calculate resume score based on skill match
function calculateResumeScore(resumeSkills, requiredSkills) {
  if (!requiredSkills || requiredSkills.length === 0) return 0;
  const resumeLower = resumeSkills.map(s => s.toLowerCase());
  const matched = requiredSkills.filter(skill => 
    resumeLower.some(rs => rs.includes(skill.toLowerCase()) || skill.toLowerCase().includes(rs))
  );
  return Math.round((matched.length / requiredSkills.length) * 100);
}

// Apply for a job with resume
router.post('/apply', authMiddleware, upload.single('resume'), async (req, res) => {
  const { job_id } = req.body;
  const candidate_id = req.user.id;

  if (!job_id) return res.status(400).json({ message: 'Job ID required' });
  if (!req.file) return res.status(400).json({ message: 'Resume required' });

  // Check if already applied
  const existing = db.prepare('SELECT id FROM applications WHERE candidate_id = ? AND job_id = ?').get(candidate_id, job_id);
  if (existing) return res.status(400).json({ message: 'Already applied for this job' });

  // Get job details
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(job_id);
  if (!job) return res.status(404).json({ message: 'Job not found' });

  const requiredSkills = JSON.parse(job.required_skills);
  const resumePath = req.file.path;
  
  let resumeText = '';
  let extractedSkills = [];
  let resumeScore = 0;

  try {
    // Try to parse PDF
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(resumePath);
    const pdfData = await pdfParse(dataBuffer);
    resumeText = pdfData.text;
    extractedSkills = extractSkills(resumeText);
    resumeScore = calculateResumeScore(extractedSkills, requiredSkills);
  } catch (err) {
    // If PDF parsing fails, use filename and give partial score
    resumeText = req.file.originalname;
    extractedSkills = extractSkills(resumeText);
    resumeScore = 30; // base score
  }

  const result = db.prepare(
    'INSERT INTO applications (candidate_id, job_id, resume_path, resume_skills, resume_score, status) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(candidate_id, job_id, resumePath, JSON.stringify(extractedSkills), resumeScore, 'applied');

  res.json({
    id: result.lastInsertRowid,
    resume_score: resumeScore,
    extracted_skills: extractedSkills,
    matched_skills: requiredSkills.filter(s => extractedSkills.some(es => es.toLowerCase().includes(s.toLowerCase()))),
    message: 'Application submitted successfully'
  });
});

// Get candidate's applications
router.get('/my', authMiddleware, (req, res) => {
  const apps = db.prepare(`
    SELECT a.*, j.title as job_title, j.required_skills, j.description,
    t.id as test_id
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    LEFT JOIN tests t ON t.job_id = j.id
    WHERE a.candidate_id = ?
    ORDER BY a.created_at DESC
  `).all(req.user.id);

  const parsed = apps.map(a => ({
    ...a,
    required_skills: JSON.parse(a.required_skills || '[]'),
    resume_skills: JSON.parse(a.resume_skills || '[]')
  }));
  res.json(parsed);
});

// Get all applications for a job (admin)
router.get('/job/:job_id', authMiddleware, adminMiddleware, (req, res) => {
  const apps = db.prepare(`
    SELECT a.*, u.name as candidate_name, u.email as candidate_email
    FROM applications a
    JOIN users u ON a.candidate_id = u.id
    WHERE a.job_id = ?
    ORDER BY a.final_score DESC
  `).all(req.params.job_id);

  const parsed = apps.map((a, idx) => ({
    ...a,
    rank: idx + 1,
    resume_skills: JSON.parse(a.resume_skills || '[]')
  }));
  res.json(parsed);
});

// Get application by id
router.get('/:id', authMiddleware, (req, res) => {
  const app = db.prepare(`
    SELECT a.*, j.title as job_title, j.required_skills, u.name as candidate_name
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    JOIN users u ON a.candidate_id = u.id
    WHERE a.id = ?
  `).get(req.params.id);
  
  if (!app) return res.status(404).json({ message: 'Application not found' });
  res.json({
    ...app,
    required_skills: JSON.parse(app.required_skills || '[]'),
    resume_skills: JSON.parse(app.resume_skills || '[]')
  });
});

// Calculate and update final score
function updateFinalScore(application_id) {
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(application_id);
  if (!app) return;

  const resume_weight = 0.3;
  const test_weight = 0.4;
  const interview_weight = 0.3;

  const final_score = Math.round(
    (app.resume_score * resume_weight) +
    (app.test_score * test_weight) +
    (app.interview_score * interview_weight)
  );

  db.prepare('UPDATE applications SET final_score = ? WHERE id = ?').run(final_score, application_id);
  return final_score;
}

module.exports = { router, updateFinalScore };
