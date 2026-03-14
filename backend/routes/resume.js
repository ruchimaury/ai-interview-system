const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { resumeUpload } = require('../middleware/upload');
const { extractTextFromPDF, calculateResumeMatch } = require('../utils/resumeAnalyzer');
const User = require('../models/User');
const Application = require('../models/Application');
const Job = require('../models/Job');
const path = require('path');
const fs = require('fs');

// Upload resume and analyze
router.post('/upload/:jobId', protect, resumeUpload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a resume file (PDF/DOC)' });
    }
    
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    
    const resumePath = `/uploads/resumes/${req.file.filename}`;
    const fullPath = path.join(__dirname, '../uploads/resumes', req.file.filename);
    
    // Extract text from PDF
    let resumeText = '';
    if (req.file.mimetype === 'application/pdf') {
      resumeText = await extractTextFromPDF(fullPath);
    } else {
      // For doc files, use basic text extraction
      resumeText = fs.readFileSync(fullPath, 'utf8').replace(/[^\x00-\x7F]/g, ' ');
    }
    
    // AI analysis: match with job skills
    const analysis = calculateResumeMatch(resumeText, job.requiredSkills);
    
    // Update user profile
    await User.findByIdAndUpdate(req.user._id, {
      resumePath,
      resumeText,
      skills: analysis.extractedSkills,
      experience: analysis.experience
    });
    
    // Create or update application
    let application = await Application.findOne({ candidate: req.user._id, job: req.params.jobId });
    if (!application) {
      application = new Application({ candidate: req.user._id, job: req.params.jobId });
    }
    
    application.resumeScore = analysis.score;
    application.matchedSkills = analysis.matchedSkills;
    application.missingSkills = analysis.missingSkills;
    application.resumeAnalysis = analysis.analysis;
    application.status = 'resume_analyzed';
    await application.save();
    
    res.json({
      success: true,
      message: 'Resume analyzed successfully!',
      analysis: {
        score: analysis.score,
        matchedSkills: analysis.matchedSkills,
        missingSkills: analysis.missingSkills,
        extractedSkills: analysis.extractedSkills,
        experience: analysis.experience,
        analysisText: analysis.analysis
      },
      applicationId: application._id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get application resume analysis
router.get('/analysis/:applicationId', protect, async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId)
      .populate('job', 'title requiredSkills')
      .populate('candidate', 'name email photo skills experience');
    
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    
    res.json({ success: true, application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
