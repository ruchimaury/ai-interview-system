import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { getJobs, createTest, getAllTests } from '../utils/api';
import { toast } from 'react-toastify';

const emptyQuestion = { question: '', options: ['', '', '', ''], correctAnswer: '', skill: '', difficulty: 'medium' };

export default function AdminTests() {
  const [jobs, setJobs] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ jobId: '', title: '', description: '', duration: 30, passingScore: 60 });
  const [questions, setQuestions] = useState([{ ...emptyQuestion, options: ['', '', '', ''] }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getJobs(), getAllTests()])
      .then(([jr, tr]) => { setJobs(jr.data.jobs); setTests(tr.data.tests); })
      .finally(() => setLoading(false));
  }, []);

  const addQuestion = () => setQuestions(prev => [...prev, { ...emptyQuestion, options: ['', '', '', ''] }]);
  const removeQuestion = (i) => setQuestions(prev => prev.filter((_, idx) => idx !== i));
  const updateQuestion = (i, field, value) => setQuestions(prev => prev.map((q, idx) => idx === i ? { ...q, [field]: value } : q));
  const updateOption = (qi, oi, value) => setQuestions(prev => prev.map((q, idx) => idx === qi ? { ...q, options: q.options.map((o, oidx) => oidx === oi ? value : o) } : q));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.jobId) { toast.error('Select a job'); return; }
    if (questions.some(q => !q.question || !q.correctAnswer || q.options.some(o => !o))) {
      toast.error('Fill all question fields'); return;
    }
    setSaving(true);
    try {
      const res = await createTest({ ...form, questions });
      setTests(prev => [res.data.test, ...prev]);
      setShowForm(false);
      setForm({ jobId: '', title: '', description: '', duration: 30, passingScore: 60 });
      setQuestions([{ ...emptyQuestion, options: ['', '', '', ''] }]);
      toast.success('Test created!');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div><h1 className="page-title">Test Management</h1><p className="page-subtitle">Create MCQ tests for job positions</p></div>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? '✕ Cancel' : '➕ Create Test'}</button>
        </div>

        {showForm && (
          <div className="glass-card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Create New Test</h3>
            <form onSubmit={handleCreate}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Select Job *</label>
                  <select className="form-select" value={form.jobId} onChange={e => setForm({...form, jobId: e.target.value})} required>
                    <option value="">-- Select Job --</option>
                    {jobs.map(j => <option key={j._id} value={j._id}>{j.title}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Test Title *</label>
                  <input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. React Developer Assessment" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (minutes)</label>
                  <input className="form-input" type="number" value={form.duration} onChange={e => setForm({...form, duration: +e.target.value})} min={5} max={120} />
                </div>
                <div className="form-group">
                  <label className="form-label">Passing Score (%)</label>
                  <input className="form-input" type="number" value={form.passingScore} onChange={e => setForm({...form, passingScore: +e.target.value})} min={0} max={100} />
                </div>
              </div>

              <h4 style={{ color: '#fff', fontWeight: 700, marginBottom: 16 }}>Questions ({questions.length})</h4>
              {questions.map((q, qi) => (
                <div key={qi} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontWeight: 700, color: '#6C63FF' }}>Q{qi + 1}</span>
                    {questions.length > 1 && <button type="button" onClick={() => removeQuestion(qi)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 16 }}>✕</button>}
                  </div>
                  <div className="form-group">
                    <input className="form-input" value={q.question} onChange={e => updateQuestion(qi, 'question', e.target.value)} placeholder="Question text..." required />
                  </div>
                  <div className="grid-2">
                    {q.options.map((opt, oi) => (
                      <div key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ color: '#6C63FF', fontWeight: 700, minWidth: 20 }}>{String.fromCharCode(65+oi)}.</span>
                        <input className="form-input" value={opt} onChange={e => updateOption(qi, oi, e.target.value)} placeholder={`Option ${String.fromCharCode(65+oi)}`} required />
                      </div>
                    ))}
                  </div>
                  <div className="grid-2" style={{ marginTop: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Correct Answer</label>
                      <select className="form-select" value={q.correctAnswer} onChange={e => updateQuestion(qi, 'correctAnswer', e.target.value)} required>
                        <option value="">-- Select --</option>
                        {q.options.map((opt, oi) => <option key={oi} value={opt}>{String.fromCharCode(65+oi)}: {opt}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Skill Category</label>
                      <input className="form-input" value={q.skill} onChange={e => updateQuestion(qi, 'skill', e.target.value)} placeholder="e.g. React, JavaScript" />
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-outline" onClick={addQuestion}>➕ Add Question</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳ Creating...' : '✅ Create Test'}</button>
              </div>
            </form>
          </div>
        )}

        {loading ? <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tests.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: 60 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
                <p style={{ color: '#94A3B8' }}>No tests yet. Create tests for your job positions.</p>
              </div>
            ) : tests.map(t => (
              <div key={t._id} className="glass-card" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{t.title}</h3>
                  <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>
                    {t.job?.title} • {t.questions?.length} questions • {t.duration} mins • Pass: {t.passingScore}%
                  </div>
                </div>
                <span className="status-badge status-selected">Active</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
