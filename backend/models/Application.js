const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },

  status: {
    type: String,
    enum: ['applied', 'resume_analyzed', 'test_scheduled', 'test_completed', 'interview_scheduled', 'interview_completed', 'selected', 'rejected'],
    default: 'applied'
  },

  // Resume
  resumeScore: { type: Number, default: 0 },
  matchedSkills: [{ type: String }],
  missingSkills: [{ type: String }],
  resumeAnalysis: { type: String, default: '' },

  // Test
  testScore: { type: Number, default: 0 },
  testAnswers: [{ questionId: String, selectedAnswer: String, isCorrect: Boolean, timeTaken: Number }],
  testCompletedAt: { type: Date },

  // Interview
  interviewScore: { type: Number, default: 0 },
  interviewVideoPath: { type: String, default: null },
  interviewTranscript: { type: String, default: '' },

  // AI Emotion Analysis
  emotionAnalysis: {
    confident: { type: Number, default: 0 },
    nervous: { type: Number, default: 0 },
    happy: { type: Number, default: 0 },
    neutral: { type: Number, default: 0 }
  },

  // Per-question AI summaries
  answerSummaries: [{
    question: String,
    candidateAnswer: String,
    aiSummary: String,
    sentiment: String,
    score: Number,
    wordCount: Number,
    fillerCount: Number
  }],

  // Anti-Cheat
  tabSwitchCount: { type: Number, default: 0 },
  antiCheatLog: [{
    time: String,
    msg: String
  }],

  // HR AI Summary
  hrSummary: {
    overallRating: { type: String, default: '' },
    summary: { type: String, default: '' },
    recommendation: { type: String, default: '' },
    scores: {
      resume: { type: Number, default: 0 },
      test: { type: Number, default: 0 },
      interview: { type: Number, default: 0 }
    },
    integrity: {
      tabSwitches: { type: Number, default: 0 },
      warnings: { type: Number, default: 0 }
    }
  },

  // Final Score
  finalScore: { type: Number, default: 0 },
  rank: { type: Number, default: 0 },

  // Face Verification
  faceVerified: { type: Boolean, default: false },
  faceVerificationLog: [{ timestamp: Date, status: String, confidence: Number }],

  // HR
  hrNotes: { type: String, default: '' },
  hrDecision: { type: String, enum: ['pending', 'selected', 'rejected', 'hold'], default: 'pending' },

  appliedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

applicationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.resumeScore || this.testScore || this.interviewScore) {
    this.finalScore = Math.round(
      (this.resumeScore * 0.30) +
      (this.testScore * 0.30) +
      (this.interviewScore * 0.40)
    );
  }
  next();
});

module.exports = mongoose.model('Application', applicationSchema);