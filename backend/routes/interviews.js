const express = require('express');
const router = express.Router();
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');
const { updateFinalScore } = require('./applications');

// AI Interview Questions based on job skills
function generateInterviewQuestions(requiredSkills) {
  const questionBank = {
    javascript: [
      'Explain closures in JavaScript with an example.',
      'What is the difference between let, var, and const?',
      'How does the event loop work in JavaScript?'
    ],
    python: [
      'What are Python decorators and how do you use them?',
      'Explain the difference between a list and a tuple.',
      'What is a Python generator?'
    ],
    react: [
      'Explain the React component lifecycle.',
      'What is the difference between state and props?',
      'How does React hooks work?'
    ],
    java: [
      'Explain the concept of polymorphism in Java.',
      'What is the difference between an interface and an abstract class?',
      'Explain Java memory management.'
    ],
    sql: [
      'What is the difference between INNER JOIN and LEFT JOIN?',
      'Explain database normalization.',
      'What are indexes and why are they important?'
    ],
    default: [
      'Tell me about yourself and your experience.',
      'What are your greatest strengths?',
      'Where do you see yourself in 5 years?',
      'Describe a challenging project you worked on.',
      'How do you handle tight deadlines and pressure?'
    ]
  };

  let questions = [...questionBank.default];
  requiredSkills.forEach(skill => {
    const skillLower = skill.toLowerCase();
    const skillQuestions = questionBank[skillLower] || [];
    questions = [...questions, ...skillQuestions.slice(0, 1)];
  });

  return questions.slice(0, 6);
}

// Analyze interview response using simple NLP
function analyzeResponse(question, answer) {
  if (!answer || answer.trim().length < 10) {
    return { relevance: 10, confidence: 10, clarity: 10 };
  }

  const wordCount = answer.split(' ').length;
  const hasKeyTerms = /experience|project|team|build|develop|work|implement|manage|create|design/i.test(answer);
  const isDetailed = wordCount > 30;
  const isVeryDetailed = wordCount > 60;

  let relevance = 40;
  if (hasKeyTerms) relevance += 30;
  if (isDetailed) relevance += 20;
  if (isVeryDetailed) relevance += 10;

  let confidence = 50;
  const positiveWords = /confident|experience|skilled|expert|proficient|successfully|achieved/i.test(answer);
  if (positiveWords) confidence += 25;
  if (isDetailed) confidence += 25;

  let clarity = 50;
  const hasStructure = /first|second|then|also|furthermore|because|therefore/i.test(answer);
  if (hasStructure) clarity += 25;
  if (isDetailed) clarity += 25;

  return {
    relevance: Math.min(100, relevance),
    confidence: Math.min(100, confidence),
    clarity: Math.min(100, clarity)
  };
}

// Get interview questions for an application
router.get('/questions/:application_id', authMiddleware, (req, res) => {
  const app = db.prepare(`
    SELECT a.*, j.required_skills FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE a.id = ?
  `).get(req.params.application_id);

  if (!app) return res.status(404).json({ message: 'Application not found' });
  
  const requiredSkills = JSON.parse(app.required_skills || '[]');
  const questions = generateInterviewQuestions(requiredSkills);
  
  res.json({ questions, application_id: req.params.application_id });
});

// Submit interview responses
router.post('/submit', authMiddleware, (req, res) => {
  const { application_id, responses } = req.body;
  // responses: [{question, answer}]

  if (!application_id || !responses || responses.length === 0) {
    return res.status(400).json({ message: 'Invalid data' });
  }

  // Check if already completed
  const existing = db.prepare('SELECT id FROM interviews WHERE application_id = ?').get(application_id);
  if (existing) return res.status(400).json({ message: 'Interview already completed' });

  // Analyze all responses
  let totalRelevance = 0, totalConfidence = 0, totalClarity = 0;
  const analysis = responses.map(r => {
    const scores = analyzeResponse(r.question, r.answer);
    totalRelevance += scores.relevance;
    totalConfidence += scores.confidence;
    totalClarity += scores.clarity;
    return { ...r, ...scores };
  });

  const count = responses.length;
  const avgRelevance = Math.round(totalRelevance / count);
  const avgConfidence = Math.round(totalConfidence / count);
  const avgClarity = Math.round(totalClarity / count);
  const overallScore = Math.round((avgRelevance + avgConfidence + avgClarity) / 3);

  // Mock emotion detection (in real system, use computer vision)
  const emotions = {
    neutral: Math.floor(Math.random() * 30) + 40,
    happy: Math.floor(Math.random() * 30) + 20,
    nervous: Math.floor(Math.random() * 20) + 10,
    confident: Math.floor(Math.random() * 20) + 20
  };

  const transcript = responses.map((r, i) => 
    `Q${i+1}: ${r.question}\nA: ${r.answer}`
  ).join('\n\n');

  db.prepare(`
    INSERT INTO interviews (application_id, transcript, emotions, confidence_score, communication_score, relevance_score, overall_score, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(application_id, transcript, JSON.stringify(emotions), avgConfidence, avgClarity, avgRelevance, overallScore);

  // Update application
  db.prepare('UPDATE applications SET interview_score = ?, status = ? WHERE id = ?').run(overallScore, 'interview_completed', application_id);
  
  const finalScore = updateFinalScore(application_id);

  res.json({
    overall_score: overallScore,
    confidence_score: avgConfidence,
    communication_score: avgClarity,
    relevance_score: avgRelevance,
    emotions,
    final_score: finalScore,
    analysis,
    message: 'Interview completed successfully'
  });
});

// Get interview result for an application
router.get('/result/:application_id', authMiddleware, (req, res) => {
  const interview = db.prepare('SELECT * FROM interviews WHERE application_id = ?').get(req.params.application_id);
  if (!interview) return res.status(404).json({ message: 'Interview not found' });
  
  res.json({
    ...interview,
    emotions: JSON.parse(interview.emotions || '{}')
  });
});

// Admin: get all interview results for a job
router.get('/job/:job_id', authMiddleware, (req, res) => {
  const results = db.prepare(`
    SELECT i.*, a.final_score, a.resume_score, a.test_score, u.name as candidate_name, u.email
    FROM interviews i
    JOIN applications a ON i.application_id = a.id
    JOIN users u ON a.candidate_id = u.id
    WHERE a.job_id = ?
    ORDER BY a.final_score DESC
  `).all(req.params.job_id);
  
  res.json(results.map(r => ({ ...r, emotions: JSON.parse(r.emotions || '{}') })));
});

module.exports = router;
