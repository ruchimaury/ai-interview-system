import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';

const defaultQuestion = () => ({
  question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
  correct_answer: 'A', marks: 1
});

export default function AdminCreateTest() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(30);
  const [questions, setQuestions] = useState([defaultQuestion()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`/api/jobs/${jobId}`).then(r => {
      setJob(r.data);
      setTitle(`${r.data.title} Assessment`);
    });
  }, [jobId]);

  const updateQ = (idx, field, val) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: val };
    setQuestions(updated);
  };

  const addQ = () => setQuestions([...questions, defaultQuestion()]);
  const removeQ = (idx) => setQuestions(questions.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!title) return setError('Test title required');
    for (let q of questions) {
      if (!q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d) {
        return setError('All question fields are required');
      }
    }
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/tests', { job_id: parseInt(jobId), title, duration_minutes: duration, questions });
      navigate('/admin/jobs');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create test');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/admin/jobs')} className="btn-secondary p-2">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Create Test</h1>
            {job && <p className="text-slate-400 text-sm">For: {job.title}</p>}
          </div>
        </div>

        {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6">{error}</div>}

        {/* Test Details */}
        <div className="glass-card p-6 mb-6">
          <h2 className="font-semibold text-white mb-4">Test Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Test Title</label>
              <input type="text" className="input" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="label">Duration (minutes)</label>
              <input type="number" className="input" value={duration} onChange={e => setDuration(parseInt(e.target.value))} min="5" max="120" />
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4 mb-6">
          {questions.map((q, idx) => (
            <div key={idx} className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-white">Question {idx + 1}</h3>
                {questions.length > 1 && (
                  <button onClick={() => removeQ(idx)} className="text-red-400 hover:text-red-300 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="mb-4">
                <label className="label">Question Text</label>
                <textarea rows={2} className="input resize-none" placeholder="Enter your question..."
                  value={q.question_text} onChange={e => updateQ(idx, 'question_text', e.target.value)} />
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                {['a', 'b', 'c', 'd'].map(opt => (
                  <div key={opt}>
                    <label className="label">Option {opt.toUpperCase()}</label>
                    <input type="text" className="input" placeholder={`Option ${opt.toUpperCase()}`}
                      value={q[`option_${opt}`]} onChange={e => updateQ(idx, `option_${opt}`, e.target.value)} />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="label">Correct Answer</label>
                  <div className="flex gap-2">
                    {['A', 'B', 'C', 'D'].map(opt => (
                      <button key={opt} type="button"
                        onClick={() => updateQ(idx, 'correct_answer', opt)}
                        className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                          q.correct_answer === opt ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-400 border border-slate-600 hover:border-green-500/50'
                        }`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Marks</label>
                  <input type="number" className="input w-20" min="1" max="10"
                    value={q.marks} onChange={e => updateQ(idx, 'marks', parseInt(e.target.value))} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={addQ} className="btn-secondary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Question
          </button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Save Test
          </button>
        </div>
      </div>
    </div>
  );
}
