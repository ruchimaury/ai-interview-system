const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const User = require('../models/User');
const Job = require('../models/Job');
const Test = require('../models/Test');
const { protect, adminOnly } = require('../middleware/auth');

// Dashboard stats
router.get('/dashboard', protect, adminOnly, async (req, res) => {
  try {
    const [totalJobs, totalCandidates, totalApplications, completedInterviews] = await Promise.all([
      Job.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'candidate' }),
      Application.countDocuments(),
      Application.countDocuments({ status: 'interview_completed' })
    ]);
    
    const recentApplications = await Application.find()
      .populate('candidate', 'name email photo')
      .populate('job', 'title')
      .sort('-appliedAt')
      .limit(5);
    
    res.json({
      success: true,
      stats: { totalJobs, totalCandidates, totalApplications, completedInterviews },
      recentApplications
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all applications with full details for HR
router.get('/applications', protect, adminOnly, async (req, res) => {
  try {
    const { jobId, status, sortBy } = req.query;
    const filter = {};
    if (jobId) filter.job = jobId;
    if (status) filter.status = status;
    
    const sortOption = sortBy === 'score' ? { finalScore: -1 } : { appliedAt: -1 };
    
    const applications = await Application.find(filter)
      .populate('candidate', 'name email phone photo skills experience')
      .populate('job', 'title requiredSkills department')
      .sort(sortOption);
    
    // Auto-rank by final score per job
    const jobGroups = {};
    applications.forEach(app => {
      const jobId = app.job?._id?.toString();
      if (jobId) {
        if (!jobGroups[jobId]) jobGroups[jobId] = [];
        jobGroups[jobId].push(app);
      }
    });
    
    // Assign ranks
    Object.values(jobGroups).forEach(group => {
      group.sort((a, b) => b.finalScore - a.finalScore);
      group.forEach((app, i) => { app._rankInJob = i + 1; });
    });
    
    res.json({ success: true, applications, total: applications.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single application detailed report for HR
router.get('/applications/:id', protect, adminOnly, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('candidate', 'name email phone photo skills experience resumePath')
      .populate('job', 'title requiredSkills description department');
    
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    
    // Get rank among all applicants for this job
    const allForJob = await Application.find({ job: application.job._id })
      .sort({ finalScore: -1 });
    const rank = allForJob.findIndex(a => a._id.toString() === application._id.toString()) + 1;
    
    res.json({ success: true, application, rank, totalApplicants: allForJob.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update HR decision
router.patch('/applications/:id/decision', protect, adminOnly, async (req, res) => {
  try {
    const { decision, notes } = req.body;
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { hrDecision: decision, hrNotes: notes, status: decision === 'selected' ? 'selected' : decision === 'rejected' ? 'rejected' : 'interview_completed' },
      { new: true }
    ).populate('candidate', 'name email').populate('job', 'title');
    
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    
    res.json({ success: true, message: `Candidate ${decision}`, application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get rankings for a specific job
router.get('/rankings/:jobId', protect, adminOnly, async (req, res) => {
  try {
    const applications = await Application.find({ job: req.params.jobId })
      .populate('candidate', 'name email phone photo skills experience')
      .sort({ finalScore: -1 });
    
    const ranked = applications.map((app, index) => ({
      rank: index + 1,
      candidate: app.candidate,
      resumeScore: app.resumeScore,
      testScore: app.testScore,
      interviewScore: app.interviewScore,
      finalScore: app.finalScore,
      status: app.status,
      hrDecision: app.hrDecision,
      faceVerified: app.faceVerified,
      matchedSkills: app.matchedSkills,
      emotionAnalysis: app.emotionAnalysis,
      applicationId: app._id
    }));
    
    const job = await Job.findById(req.params.jobId).select('title requiredSkills');
    res.json({ success: true, rankings: ranked, job, total: ranked.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
