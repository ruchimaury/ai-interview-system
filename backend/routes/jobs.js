const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const { protect, adminOnly } = require('../middleware/auth');

// Get all active jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true }).populate('createdBy', 'name').sort('-createdAt');
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single job
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('createdBy', 'name');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create job (Admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { title, description, requiredSkills, department, location, experience } = req.body;
    if (!title || !description || !requiredSkills || requiredSkills.length === 0) {
      return res.status(400).json({ success: false, message: 'Title, description, and skills required' });
    }
    
    const job = await Job.create({
      title, description,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : requiredSkills.split(',').map(s => s.trim()),
      department, location, experience,
      createdBy: req.user._id
    });
    
    res.status(201).json({ success: true, message: 'Job created successfully', job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update job (Admin)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, message: 'Job updated', job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete job (Admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Job.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Job deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
