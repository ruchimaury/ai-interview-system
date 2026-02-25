const express = require('express');
const router = express.Router();
const db = require('../database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get all active jobs (public)
router.get('/', (req, res) => {
  const jobs = db.prepare('SELECT j.*, u.name as admin_name FROM jobs j LEFT JOIN users u ON j.admin_id = u.id WHERE j.is_active = 1 ORDER BY j.created_at DESC').all();
  const parsed = jobs.map(j => ({ ...j, required_skills: JSON.parse(j.required_skills) }));
  res.json(parsed);
});

// Get all jobs (admin)
router.get('/all', authMiddleware, adminMiddleware, (req, res) => {
  const jobs = db.prepare('SELECT j.*, u.name as admin_name, (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as applicant_count FROM jobs j LEFT JOIN users u ON j.admin_id = u.id ORDER BY j.created_at DESC').all();
  const parsed = jobs.map(j => ({ ...j, required_skills: JSON.parse(j.required_skills) }));
  res.json(parsed);
});

// Get single job
router.get('/:id', (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  res.json({ ...job, required_skills: JSON.parse(job.required_skills) });
});

// Create job (admin)
router.post('/', authMiddleware, adminMiddleware, (req, res) => {
  const { title, description, required_skills, experience_level } = req.body;
  if (!title || !required_skills) return res.status(400).json({ message: 'Title and skills required' });

  const result = db.prepare('INSERT INTO jobs (title, description, required_skills, experience_level, admin_id) VALUES (?, ?, ?, ?, ?)').run(
    title, description, JSON.stringify(required_skills), experience_level || 'junior', req.user.id
  );
  res.json({ id: result.lastInsertRowid, message: 'Job created successfully' });
});

// Update job (admin)
router.put('/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { title, description, required_skills, experience_level, is_active } = req.body;
  db.prepare('UPDATE jobs SET title=?, description=?, required_skills=?, experience_level=?, is_active=? WHERE id=?').run(
    title, description, JSON.stringify(required_skills), experience_level, is_active ? 1 : 0, req.params.id
  );
  res.json({ message: 'Job updated' });
});

// Delete job (admin)
router.delete('/:id', authMiddleware, adminMiddleware, (req, res) => {
  db.prepare('DELETE FROM jobs WHERE id = ?').run(req.params.id);
  res.json({ message: 'Job deleted' });
});

module.exports = router;
