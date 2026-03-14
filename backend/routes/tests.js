const express = require('express');
const router = express.Router();
const Test = require('../models/Test');
const Application = require('../models/Application');
const { protect, adminOnly } = require('../middleware/auth');

// Get test for a job
router.get('/job/:jobId', protect, async (req, res) => {
  try {
    const test = await Test.findOne({ job: req.params.jobId, isActive: true });
    if (!test) return res.status(404).json({ success: false, message: 'No test found for this job' });
    
    // Return questions WITHOUT correct answers for candidates
    const testForCandidate = {
      _id: test._id,
      title: test.title,
      description: test.description,
      duration: test.duration,
      passingScore: test.passingScore,
      questions: test.questions.map(q => ({
        _id: q._id,
        question: q.question,
        options: q.options,
        skill: q.skill,
        difficulty: q.difficulty,
        timeLimit: q.timeLimit
      }))
    };
    
    res.json({ success: true, test: testForCandidate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Submit test answers
router.post('/submit/:testId', protect, async (req, res) => {
  try {
    const { answers, jobId, timeTaken } = req.body;
    const test = await Test.findById(req.params.testId);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    
    // Evaluate answers
    let correctCount = 0;
    const processedAnswers = [];
    
    test.questions.forEach(question => {
      const candidateAnswer = answers[question._id.toString()];
      const isCorrect = candidateAnswer === question.correctAnswer;
      if (isCorrect) correctCount++;
      
      processedAnswers.push({
        questionId: question._id.toString(),
        selectedAnswer: candidateAnswer || 'Not answered',
        isCorrect,
        timeTaken: timeTaken?.[question._id.toString()] || 0
      });
    });
    
    const scorePercentage = Math.round((correctCount / test.questions.length) * 100);
    const passed = scorePercentage >= test.passingScore;
    
    // Update application
    const application = await Application.findOneAndUpdate(
      { candidate: req.user._id, job: jobId },
      {
        testScore: scorePercentage,
        testAnswers: processedAnswers,
        testCompletedAt: new Date(),
        status: 'test_completed'
      },
      { new: true }
    );
    
    res.json({
      success: true,
      message: passed ? 'Test completed! You passed!' : 'Test completed.',
      result: {
        score: scorePercentage,
        correctAnswers: correctCount,
        totalQuestions: test.questions.length,
        passed,
        passingScore: test.passingScore
      },
      applicationId: application?._id
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create test (Admin)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { jobId, title, description, questions, duration, passingScore } = req.body;
    if (!jobId || !title || !questions || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Job, title and questions required' });
    }
    
    const test = await Test.create({
      job: jobId, title, description, questions, duration, passingScore,
      createdBy: req.user._id
    });
    
    res.status(201).json({ success: true, message: 'Test created', test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all tests (Admin)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const tests = await Test.find().populate('job', 'title').sort('-createdAt');
    res.json({ success: true, tests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
