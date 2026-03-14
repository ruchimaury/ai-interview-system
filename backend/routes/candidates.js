const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const { protect } = require('../middleware/auth');

// Get my applications
router.get('/my-applications', protect, async (req, res) => {
  try {
    const applications = await Application.find({ candidate: req.user._id })
      .populate('job', 'title description requiredSkills department location')
      .sort('-appliedAt');
    
    res.json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single application status
router.get('/application/:id', protect, async (req, res) => {
  try {
    const application = await Application.findOne({ _id: req.params.id, candidate: req.user._id })
      .populate('job', 'title requiredSkills description');
    
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
