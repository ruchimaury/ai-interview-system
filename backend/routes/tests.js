const express = require('express');
const router = express.Router();
const db = require('../database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { updateFinalScore } = require('./applications');

// Get test for a job
router.get('/job/:job_id', authMiddleware, (req, res) => {
  const test = db.prepare('SELECT * FROM tests WHERE job_id = ?').get(req.params.job_id);
  if (!test) return res.status(404).json({ message: 'No test found for this job' });
  
  // Don't send correct answers to candidate
  const questions = db.prepare('SELECT id, question_text, option_a, option_b, option_c, option_d, marks FROM questions WHERE test_id = ?').all(test.id);
  res.json({ ...test, questions });
});

// Get test with answers (admin)
router.get('/:id/admin', authMiddleware, adminMiddleware, (req, res) => {
  const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(req.params.id);
  if (!test) return res.status(404).json({ message: 'Test not found' });
  const questions = db.prepare('SELECT * FROM questions WHERE test_id = ?').all(test.id);
  res.json({ ...test, questions });
});

// Create test (admin)
router.post('/', authMiddleware, adminMiddleware, (req, res) => {
  const { job_id, title, duration_minutes, questions } = req.body;
  if (!job_id || !title || !questions) return res.status(400).json({ message: 'Missing required fields' });

  const testResult = db.prepare('INSERT INTO tests (job_id, title, duration_minutes) VALUES (?, ?, ?)').run(job_id, title, duration_minutes || 30);
  const test_id = testResult.lastInsertRowid;

  const insertQ = db.prepare('INSERT INTO questions (test_id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  
  questions.forEach(q => {
    insertQ.run(test_id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.marks || 1);
  });

  res.json({ id: test_id, message: 'Test created successfully' });
});

// Submit test attempt
router.post('/submit', authMiddleware, async (req, res) => {
  const { application_id, test_id, answers } = req.body;
  
  // Check if already attempted
  const existing = db.prepare('SELECT id FROM test_attempts WHERE application_id = ? AND test_id = ?').get(application_id, test_id);
  if (existing) return res.status(400).json({ message: 'Test already submitted' });

  // Calculate score
  const questions = db.prepare('SELECT * FROM questions WHERE test_id = ?').all(test_id);
  let totalMarks = 0, earnedMarks = 0;

  questions.forEach(q => {
    totalMarks += q.marks;
    if (answers[q.id] === q.correct_answer) earnedMarks += q.marks;
  });

  const scorePercent = totalMarks > 0 ? Math.round((earnedMarks / totalMarks) * 100) : 0;

  // Save attempt
  db.prepare('INSERT INTO test_attempts (application_id, test_id, answers, score, completed_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)').run(
    application_id, test_id, JSON.stringify(answers), scorePercent
  );

  // Update application test score
  db.prepare('UPDATE applications SET test_score = ?, status = ? WHERE id = ?').run(scorePercent, 'test_completed', application_id);
  
  updateFinalScore(application_id);

  res.json({
    score: scorePercent,
    earned: earnedMarks,
    total: totalMarks,
    message: 'Test submitted successfully'
  });
});

// Add default questions for a job (admin helper)
router.post('/generate-sample/:job_id', authMiddleware, adminMiddleware, (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.job_id);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  
  const requiredSkills = JSON.parse(job.required_skills);
  
  // Sample general questions
  const sampleQuestions = [
    {
      question_text: 'What does OOP stand for?',
      option_a: 'Object Oriented Programming',
      option_b: 'Open Online Platform',
      option_c: 'Object Operating Protocol',
      option_d: 'None of the above',
      correct_answer: 'A',
      marks: 1
    },
    {
      question_text: 'Which data structure uses LIFO principle?',
      option_a: 'Queue',
      option_b: 'Stack',
      option_c: 'Array',
      option_d: 'Tree',
      correct_answer: 'B',
      marks: 1
    },
    {
      question_text: 'What is the time complexity of binary search?',
      option_a: 'O(n)',
      option_b: 'O(n²)',
      option_c: 'O(log n)',
      option_d: 'O(1)',
      correct_answer: 'C',
      marks: 1
    },
    {
      question_text: 'Which HTTP method is used to update a resource?',
      option_a: 'GET',
      option_b: 'POST',
      option_c: 'PUT',
      option_d: 'DELETE',
      correct_answer: 'C',
      marks: 1
    },
    {
      question_text: 'What does SQL stand for?',
      option_a: 'Structured Query Language',
      option_b: 'Simple Query Language',
      option_c: 'Standard Query Logic',
      option_d: 'System Query Language',
      correct_answer: 'A',
      marks: 1
    }
  ];

  const existingTest = db.prepare('SELECT id FROM tests WHERE job_id = ?').get(req.params.job_id);
  if (existingTest) return res.status(400).json({ message: 'Test already exists for this job' });

  const testResult = db.prepare('INSERT INTO tests (job_id, title, duration_minutes) VALUES (?, ?, ?)').run(
    req.params.job_id, `${job.title} Assessment`, 30
  );
  
  const insertQ = db.prepare('INSERT INTO questions (test_id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  sampleQuestions.forEach(q => {
    insertQ.run(testResult.lastInsertRowid, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.marks);
  });

  res.json({ message: 'Sample test created', test_id: testResult.lastInsertRowid });
});

module.exports = router;
