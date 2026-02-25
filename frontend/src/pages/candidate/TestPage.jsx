import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import { Clock, CheckCircle, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';

export default function TestPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef();

  useEffect(() => {
    const load = async () => {
      try {
        const appRes = await axios.get(`/api/applications/${applicationId}`);
        setApp(appRes.data);
        const testRes = await axios.get(`/api/tests/job/${appRes.data.job_id}`);
        setTest(testRes.data);
        setTimeLeft(testRes.data.duration_minutes * 60);
        setLoading(false);
      } catch {
        navigate('/dashboard');
      }
    };
    load();
  }, [applicationId]);

  useEffect(() => {
    if (!test || submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [test, submitted]);

  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const handleSubmit = async () => {
    if (submitted) return;
    setSubmitted(true);
    clearInterval(timerRef.current);
    try {
      const res = await axios.post('/api/tests/submit', {
        application_id: parseInt(applicationId),
        test_id: test.id,
        answers
      });
      setResult(res.data);
    } catch (err) {
      setResult({ score: 0, earned: 0, total: test?.questions?.length || 0, message: err.response?.data?.message || 'Submitted' });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (result) return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="glass-card p-10">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${result.score >= 60 ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
            <span className={`text-3xl font-bold ${result.score >= 60 ? 'text-green-400' : 'text-yellow-400'}`}>{result.score}%</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Test Completed!</h2>
          <p className="text-slate-400 mb-2">{result.earned} / {result.total} correct answers</p>
          <p className="text-slate-500 text-sm mb-8">{result.message}</p>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="glass p-4 rounded-xl">
              <div className="text-xl font-bold text-indigo-400">{result.earned}</div>
              <div className="text-xs text-slate-400">Correct</div>
            </div>
            <div className="glass p-4 rounded-xl">
              <div className="text-xl font-bold text-red-400">{result.total - result.earned}</div>
              <div className="text-xs text-slate-400">Wrong</div>
            </div>
          </div>
          <button onClick={() => navigate('/dashboard')} className="btn-primary w-full">
            Go to Dashboard → Start Interview
          </button>
        </div>
      </div>
    </div>
  );

  if (!test) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-card p-8 text-center">
        <AlertCircle className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
        <p className="text-slate-300">No test available for this job yet.</p>
        <button onClick={() => navigate('/dashboard')} className="btn-secondary mt-4">Back to Dashboard</button>
      </div>
    </div>
  );

  const q = test.questions[current];
  const options = ['A', 'B', 'C', 'D'];
  const optionText = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d };
  const answered = Object.keys(answers).length;
  const progress = (answered / test.questions.length) * 100;
  const isWarning = timeLeft < 120;

  return (
    <div className="min-h-screen">
      <Navbar />
      {/* Timer bar */}
      <div className="sticky top-16 z-40 glass border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <span className="text-sm text-slate-400">{test.title}</span>
            <span className="mx-2 text-slate-600">|</span>
            <span className="text-sm text-slate-400">{answered}/{test.questions.length} answered</span>
          </div>
          <div className={`flex items-center gap-2 font-mono font-bold text-lg ${isWarning ? 'text-red-400 animate-pulse' : 'text-white'}`}>
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>
        </div>
        <div className="progress-bar rounded-none h-1 bg-slate-800">
          <div className="progress-fill bg-indigo-500 h-full" style={{ width: `${((current + 1) / test.questions.length) * 100}%` }} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="glass-card p-6 sm:p-8">
          {/* Question */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="badge bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-sm">
                Question {current + 1} of {test.questions.length}
              </span>
              <span className="text-xs text-slate-500">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
            </div>
            <h2 className="text-lg font-medium text-white leading-relaxed">{q.question_text}</h2>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {options.map(opt => {
              const isSelected = answers[q.id] === opt;
              return (
                <button
                  key={opt}
                  onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/15 text-white'
                      : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {opt}
                  </div>
                  <span className="flex-1">{optionText[opt]}</span>
                  {isSelected && <CheckCircle className="w-5 h-5 text-indigo-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrent(Math.max(0, current - 1))}
              disabled={current === 0}
              className="btn-secondary flex items-center gap-2 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            
            <div className="flex gap-2">
              {/* Question dots */}
              <div className="hidden sm:flex gap-1.5 items-center">
                {test.questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      i === current ? 'bg-indigo-500 w-5' :
                      answers[test.questions[i].id] ? 'bg-green-500' : 'bg-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {current < test.questions.length - 1 ? (
              <button
                onClick={() => setCurrent(current + 1)}
                className="btn-primary flex items-center gap-2"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-500"
              >
                Submit Test <CheckCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
