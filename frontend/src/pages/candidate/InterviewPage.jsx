import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import { Mic, MicOff, CheckCircle, ArrowRight, Brain, MessageSquare } from 'lucide-react';

export default function InterviewPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [listening, setListening] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    axios.get(`/api/interviews/questions/${applicationId}`).then(r => {
      setQuestions(r.data.questions);
      setLoading(false);
    }).catch(() => navigate('/dashboard'));

    // Setup speech recognition if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (e) => {
        const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
        setCurrentAnswer(transcript);
      };
      recognitionRef.current.onend = () => setListening(false);
    }
  }, [applicationId]);

  const toggleMic = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  const handleNext = () => {
    const newAnswers = [...answers, { question: questions[current], answer: currentAnswer }];
    setAnswers(newAnswers);
    setCurrentAnswer('');
    if (listening) { recognitionRef.current?.stop(); setListening(false); }

    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      submitInterview(newAnswers);
    }
  };

  const submitInterview = async (finalAnswers) => {
    setSubmitted(true);
    try {
      const res = await axios.post('/api/interviews/submit', {
        application_id: parseInt(applicationId),
        responses: finalAnswers
      });
      setResult(res.data);
    } catch (err) {
      navigate('/dashboard');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (submitted && !result) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Brain className="w-12 h-12 text-indigo-400 mx-auto mb-4 animate-pulse" />
        <h2 className="text-xl font-bold text-white mb-2">AI is analyzing your interview...</h2>
        <p className="text-slate-400">Processing responses, emotions, and confidence</p>
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mt-6" />
      </div>
    </div>
  );

  if (result) return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="glass-card p-8 text-center animate-in">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Interview Complete!</h2>
          <p className="text-slate-400 mb-8">AI analysis finished. Here's your performance:</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Overall', value: result.overall_score, color: 'text-indigo-400' },
              { label: 'Confidence', value: result.confidence_score, color: 'text-blue-400' },
              { label: 'Communication', value: result.communication_score, color: 'text-purple-400' },
              { label: 'Relevance', value: result.relevance_score, color: 'text-cyan-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass p-4 rounded-xl">
                <div className={`text-2xl font-bold ${color}`}>{value}%</div>
                <div className="text-xs text-slate-400 mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Emotion breakdown */}
          {result.emotions && (
            <div className="mb-8 text-left">
              <h3 className="text-sm font-medium text-slate-400 mb-3">Emotion Analysis</h3>
              <div className="space-y-2">
                {Object.entries(result.emotions).map(([emotion, val]) => (
                  <div key={emotion}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 capitalize">{emotion}</span>
                      <span className="text-slate-300">{val}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill bg-indigo-500" style={{ width: `${val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass p-4 rounded-xl mb-6">
            <div className="text-3xl font-bold text-indigo-400">{result.final_score}%</div>
            <div className="text-sm text-slate-400 mt-1">Final Score (Resume + Test + Interview)</div>
          </div>

          <button onClick={() => navigate(`/result/${applicationId}`)} className="btn-primary w-full flex items-center justify-center gap-2">
            View Full Report <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const progress = ((current) / questions.length) * 100;

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Progress */}
      <div className="sticky top-16 z-40 glass border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-300">
            <Brain className="w-4 h-4" />
            <span className="text-sm font-medium">AI Interview</span>
          </div>
          <span className="text-sm text-slate-400">Question {current + 1} of {questions.length}</span>
        </div>
        <div className="h-1 bg-slate-800">
          <div className="h-full bg-indigo-500 transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* AI Avatar */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-indigo-500/20 border-2 border-indigo-500/40 flex items-center justify-center mx-auto mb-4 relative">
            <Brain className="w-10 h-10 text-indigo-400" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-slate-900" />
          </div>
          <p className="text-slate-400 text-sm">AI Interviewer is asking...</p>
        </div>

        {/* Question card */}
        <div className="glass-card p-6 sm:p-8 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-medium text-white leading-relaxed">{questions[current]}</h2>
            </div>
          </div>
        </div>

        {/* Answer area */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm text-slate-400 font-medium">Your Answer</label>
            <button
              onClick={toggleMic}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                listening ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
              }`}
            >
              {listening ? <><MicOff className="w-3.5 h-3.5" /> Stop Recording</> : <><Mic className="w-3.5 h-3.5" /> Voice Input</>}
            </button>
          </div>
          
          <textarea
            ref={textareaRef}
            rows={5}
            className="input resize-none"
            placeholder="Type your answer here or use voice input above..."
            value={currentAnswer}
            onChange={e => setCurrentAnswer(e.target.value)}
          />

          <div className="flex justify-between items-center mt-4">
            <span className="text-xs text-slate-500">{currentAnswer.split(' ').filter(Boolean).length} words</span>
            <button
              onClick={handleNext}
              disabled={currentAnswer.trim().length < 5}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {current < questions.length - 1 ? (
                <>Next Question <ArrowRight className="w-4 h-4" /></>
              ) : (
                <>Finish Interview <CheckCircle className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
