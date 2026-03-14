const https = require('https');

// Call Claude AI API for real answer scoring
const callClaudeAPI = (prompt) => {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const text = parsed.content?.[0]?.text || '';
          resolve(text);
        } catch (e) { reject(e); }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

// Real AI scoring using Claude
const analyzeAnswerWithAI = async (question, answer) => {
  if (!answer || answer.trim().length < 5) {
    return { score: 0, feedback: 'No answer provided', sentiment: 'poor', wordCount: 0, fillerCount: 0, aiSummary: 'Candidate did not answer this question.' };
  }

  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const fillerWords = ['um', 'uh', 'like', 'basically', 'literally', 'actually', 'honestly', 'kind of', 'sort of'];
  const fillerCount = fillerWords.filter(w => answer.toLowerCase().includes(w)).length;

  try {
    const prompt = `You are a strict HR interviewer evaluating a candidate's answer.

QUESTION: "${question}"

CANDIDATE'S ANSWER: "${answer}"

Evaluate this answer strictly and objectively. Score from 0-100 based on:
- Relevance to the question (0-25 points)
- Depth and specificity (0-25 points)
- Communication clarity (0-25 points)
- Professional quality (0-25 points)

Be STRICT. A vague, off-topic, or very short answer should score LOW (below 40).
A good relevant answer with examples scores MEDIUM (50-70).
An excellent, specific, well-structured answer scores HIGH (75-100).

Respond ONLY in this exact JSON format (no other text):
{"score": <number 0-100>, "feedback": "<one sentence feedback>", "summary": "<2-3 sentence HR summary of this answer>", "sentiment": "<excellent|good|average|poor>"}`;

    const aiResponse = await callClaudeAPI(prompt);

    // Parse JSON response
    const cleanResponse = aiResponse.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleanResponse);

    return {
      score: Math.max(0, Math.min(100, result.score || 0)),
      feedback: result.feedback || '',
      aiSummary: result.summary || '',
      sentiment: result.sentiment || 'average',
      wordCount,
      fillerCount
    };
  } catch (e) {
    console.error('Claude API error, using fallback:', e.message);
    // Fallback scoring if API fails
    return fallbackAnalyze(question, answer, wordCount, fillerCount);
  }
};

// Fallback if API not available
const fallbackAnalyze = (question, answer, wordCount, fillerCount) => {
  const words = answer.toLowerCase().split(/\s+/).filter(Boolean);
  const positiveWords = ['experience','achieved','improved','developed','created','managed','led','built','designed','implemented','solved','increased','reduced','optimized','delivered'];
  const foundPositive = positiveWords.filter(w => words.includes(w));

  let score = 30;
  if (wordCount >= 30) score += 10;
  if (wordCount >= 60) score += 10;
  if (wordCount >= 100) score += 10;
  if (wordCount > 300) score -= 10;
  score += Math.min(foundPositive.length * 4, 20);
  score -= Math.min(fillerCount * 3, 15);
  const hasSpecifics = /\d+|percent|%|years?|months?|team|project/.test(answer.toLowerCase());
  if (hasSpecifics) score += 10;
  score = Math.max(5, Math.min(90, score));

  const sentiment = score >= 70 ? 'excellent' : score >= 55 ? 'good' : score >= 35 ? 'average' : 'poor';
  return {
    score: Math.round(score),
    feedback: wordCount < 20 ? 'Answer too brief' : wordCount >= 60 ? 'Adequate response' : 'Could be more detailed',
    aiSummary: `Candidate provided a ${sentiment} response with ${wordCount} words.`,
    sentiment,
    wordCount,
    fillerCount
  };
};

const analyzeAnswer = (question, answer) => {
  return fallbackAnalyze(question, answer,
    answer ? answer.trim().split(/\s+/).filter(Boolean).length : 0,
    ['um','uh','like','basically','literally'].filter(w => (answer||'').toLowerCase().includes(w)).length
  );
};

const analyzeEmotions = (answers) => {
  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return { confident: 40, nervous: 30, happy: 20, neutral: 10 };
  }
  const avgScore = answers.reduce((sum, a) => sum + (a.score || 50), 0) / answers.length;
  return {
    confident: Math.min(95, Math.round(avgScore + 10)),
    nervous: Math.max(5, Math.round(50 - avgScore * 0.3)),
    happy: Math.min(90, Math.round(avgScore * 0.8)),
    neutral: Math.max(5, Math.round(30 - avgScore * 0.2))
  };
};

const calculateInterviewScore = (answers) => {
  if (!answers || !Array.isArray(answers) || answers.length === 0) return 0;
  return Math.round(answers.reduce((sum, a) => sum + (a.score || 0), 0) / answers.length);
};

const generateAnswerSummary = (question, answer) => {
  const analysis = fallbackAnalyze(question, answer,
    answer ? answer.trim().split(/\s+/).filter(Boolean).length : 0, 0);
  return `Score: ${analysis.score}/100 | ${analysis.feedback}`;
};

const generateHRSummary = (application) => {
  try {
    const resumeScore = application.resumeScore || 0;
    const testScore = application.testScore || 0;
    const interviewScore = application.interviewScore || 0;
    const finalScore = Math.round(resumeScore * 0.3 + testScore * 0.3 + interviewScore * 0.4);
    let overallRating, recommendation;
    if (finalScore >= 75) { overallRating = 'Highly Recommended'; recommendation = 'Strong candidate. Recommend immediately.'; }
    else if (finalScore >= 55) { overallRating = 'Recommended'; recommendation = 'Good candidate. Worth considering.'; }
    else if (finalScore >= 35) { overallRating = 'Consider with Caution'; recommendation = 'Average candidate. Review before deciding.'; }
    else { overallRating = 'Not Recommended'; recommendation = 'Below expectations.'; }
    const tabSwitches = application.tabSwitchCount || 0;
    const warnings = application.antiCheatLog?.length || 0;
    const integrityNote = tabSwitches === 0 && warnings === 0 ? '✅ Clean session' : tabSwitches >= 3 ? `🚫 DISQUALIFIED — ${tabSwitches} tab switches` : `⚠️ ${tabSwitches} tab switch(es), ${warnings} warning(s)`;
    return {
      overallRating,
      summary: `Score: ${finalScore}% (Resume: ${resumeScore}%, Test: ${testScore}%, Interview: ${interviewScore}%). ${recommendation} ${integrityNote}`,
      recommendation,
      scores: { resume: resumeScore, test: testScore, interview: interviewScore, final: finalScore },
      integrity: { tabSwitches, warnings, note: integrityNote }
    };
  } catch (e) {
    return { overallRating: 'Pending', summary: 'Review manually.', recommendation: 'Manual review', scores: { resume: 0, test: 0, interview: 0, final: 0 }, integrity: { tabSwitches: 0, warnings: 0, note: 'Unknown' } };
  }
};

module.exports = { analyzeAnswer, analyzeAnswerWithAI, analyzeEmotions, calculateInterviewScore, generateAnswerSummary, generateHRSummary };