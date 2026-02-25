const express = require('express');
const router = express.Router();
const db = require('../database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Admin dashboard stats
router.get('/stats', authMiddleware, adminMiddleware, (req, res) => {
  const totalJobs = db.prepare('SELECT COUNT(*) as count FROM jobs').get().count;
  const activeJobs = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE is_active = 1').get().count;
  const totalCandidates = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = "candidate"').get().count;
  const totalApplications = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
  const completedInterviews = db.prepare('SELECT COUNT(*) as count FROM interviews').get().count;
  const avgFinalScore = db.prepare('SELECT AVG(final_score) as avg FROM applications WHERE final_score > 0').get().avg;

  res.json({
    totalJobs,
    activeJobs,
    totalCandidates,
    totalApplications,
    completedInterviews,
    avgFinalScore: Math.round(avgFinalScore || 0)
  });
});

// Get ranked candidates for a job
router.get('/rankings/:job_id', authMiddleware, adminMiddleware, (req, res) => {
  const candidates = db.prepare(`
    SELECT 
      a.id as application_id,
      a.resume_score, a.test_score, a.interview_score, a.final_score, a.status,
      a.created_at,
      u.name as candidate_name, u.email,
      i.confidence_score, i.communication_score, i.relevance_score,
      a.resume_skills
    FROM applications a
    JOIN users u ON a.candidate_id = u.id
    LEFT JOIN interviews i ON i.application_id = a.id
    WHERE a.job_id = ?
    ORDER BY a.final_score DESC
  `).all(req.params.job_id);

  const ranked = candidates.map((c, idx) => ({
    ...c,
    rank: idx + 1,
    resume_skills: JSON.parse(c.resume_skills || '[]'),
    grade: c.final_score >= 80 ? 'A' : c.final_score >= 60 ? 'B' : c.final_score >= 40 ? 'C' : 'D'
  }));

  res.json(ranked);
});

// Recent activity
router.get('/activity', authMiddleware, adminMiddleware, (req, res) => {
  const recent = db.prepare(`
    SELECT a.id, a.status, a.final_score, a.created_at,
    u.name as candidate_name, j.title as job_title
    FROM applications a
    JOIN users u ON a.candidate_id = u.id
    JOIN jobs j ON a.job_id = j.id
    ORDER BY a.created_at DESC
    LIMIT 10
  `).all();
  
  res.json(recent);
});

module.exports = router;
