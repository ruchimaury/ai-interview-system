const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Job = require('../models/Job');
const { protect } = require('../middleware/auth');
const { analyzeAnswerWithAI, generateHRSummary } = require('../utils/interviewAnalyzer');

// GET interview questions
router.get('/questions/:jobId', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const questions = job.interviewQuestions?.length > 0
      ? job.interviewQuestions
      : [
          { id: 'q1', question: 'Tell me about yourself and your professional background.' },
          { id: 'q2', question: 'What are your key technical skills and how have you applied them?' },
          { id: 'q3', question: 'Describe a challenging project you worked on and how you handled it.' },
          { id: 'q4', question: 'Where do you see yourself in 5 years?' },
          { id: 'q5', question: 'Why do you want to work for our company?' }
        ];

    res.json({ questions });
  } catch (e) {
    console.error('Get questions error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST submit interview
router.post('/submit/:applicationId', protect, async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    const { answers, transcript, antiCheatLog, tabSwitchCount } = req.body;
    const answersArray = Array.isArray(answers) ? answers : [];

    console.log(`🤖 Analyzing ${answersArray.length} answers with Claude AI...`);

    // Analyze each answer with real Claude AI
    const answerSummaries = await Promise.all(
      answersArray.map(async (a, index) => {
        console.log(`  Analyzing Q${index + 1}...`);
        const analysis = await analyzeAnswerWithAI(a.question || '', a.answer || '');
        return {
          question: a.question || '',
          candidateAnswer: a.answer || '',
          aiSummary: analysis.aiSummary,
          sentiment: analysis.sentiment,
          score: analysis.score,
          wordCount: analysis.wordCount || 0,
          fillerCount: analysis.fillerCount || 0
        };
      })
    );

    console.log('✅ All answers analyzed!');

    // Calculate interview score
    const interviewScore = answerSummaries.length > 0
      ? Math.round(answerSummaries.reduce((s, a) => s + a.score, 0) / answerSummaries.length)
      : 0;

    // Emotion analysis
    const emotionAnalysis = {
      confident: Math.min(95, Math.round(interviewScore + 10)),
      nervous: Math.max(5, Math.round(50 - interviewScore * 0.3)),
      happy: Math.min(90, Math.round(interviewScore * 0.8)),
      neutral: Math.max(5, Math.round(30 - interviewScore * 0.2))
    };

    const finalScore = Math.round(
      (application.resumeScore || 0) * 0.3 +
      (application.testScore || 0) * 0.3 +
      interviewScore * 0.4
    );

    // Save to DB
    application.answerSummaries = answerSummaries;
    application.emotionAnalysis = emotionAnalysis;
    application.interviewScore = interviewScore;
    application.finalScore = finalScore;
    application.interviewTranscript = transcript || '';
    application.tabSwitchCount = tabSwitchCount || 0;
    application.antiCheatLog = Array.isArray(antiCheatLog) ? antiCheatLog : [];
    application.status = 'interview_completed';

    // HR Summary
    try {
      application.hrSummary = generateHRSummary(application);
    } catch (hrErr) {
      console.error('HR Summary error:', hrErr);
    }

    await application.save();

    console.log(`🎯 Interview Score: ${interviewScore}% | Final Score: ${finalScore}%`);

    res.json({
      message: 'Interview submitted successfully',
      result: {
        interviewScore,
        finalScore,
        emotions: emotionAnalysis,
        answersCount: answerSummaries.length
      }
    });

  } catch (e) {
    console.error('Interview submit error:', e);
    res.status(500).json({ message: 'Server error: ' + e.message });
  }
});

// POST face verify
router.post('/face-verify/:applicationId', protect, async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    application.faceVerified = req.body.verified || false;
    application.faceVerificationLog = application.faceVerificationLog || [];
    application.faceVerificationLog.push({
      timestamp: new Date(),
      status: req.body.verified ? 'verified' : 'failed',
      confidence: req.body.confidence || 0
    });
    await application.save();

    res.json({ message: 'Face verification saved', verified: application.faceVerified });
  } catch (e) {
    console.error('Face verify error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;