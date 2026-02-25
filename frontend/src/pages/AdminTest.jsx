import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function AdminTest() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState({ question: '', options: ['', '', '', ''], correct: 0 });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    axios.get(`${API}/jobs/${jobId}`).then(r => setJob(r.data));
    axios.get(`${API}/tests/${jobId}`).then(r => setQuestions(r.data));
  }, [jobId]);

  const addQuestion = async (e) => {
    e.preventDefault();
    const opts = form.options.filter(o => o.trim());
    if (opts.length < 2) return alert('Add at least 2 options');
    setLoading(true);
    try {
      await axios.post(`${API}/tests/question`, {
        job_id: parseInt(jobId),
        question: form.question,
        options: opts,
        correct_answer: form.correct
      });
      setSuccess('Question added!');
      setForm({ question: '', options: ['', '', '', ''], correct: 0 });
      const r = await axios.get(`${API}/tests/${jobId}`);
      setQuestions(r.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Error');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: 700 }} className="fade-in">
        <button className="btn-secondary" onClick={() => navigate('/admin')} style={{ marginBottom: '1.5rem' }}>← Dashboard</button>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.5rem', marginBottom: '0.3rem' }}>Test Questions</h1>
        {job && <p style={{ color: '#666678', marginBottom: '2rem' }}>For: <strong style={{ color: '#a5a8ff' }}>{job.title}</strong></p>}

        {/* Add question form */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: '1.5rem' }}>Add Question</h3>
          {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '0.75rem', marginBottom: '1rem', color: '#10b981', fontSize: '0.9rem' }}>{success}</div>}

          <form onSubmit={addQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#888898' }}>Question *</label>
              <textarea className="input-field" rows={2} placeholder="Enter your question..." required
                value={form.question} onChange={e => setForm({...form, question: e.target.value})}/>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.85rem', color: '#888898' }}>Options (mark correct answer)</label>
              {form.options.map((opt, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <input type="radio" name="correct" checked={form.correct === i} onChange={() => setForm({...form, correct: i})}
                    style={{ accentColor: '#6366f1', width: 18, height: 18, cursor: 'pointer', flexShrink: 0 }}/>
                  <input className="input-field" placeholder={`Option ${String.fromCharCode(65+i)}`}
                    value={opt} onChange={e => { const o = [...form.options]; o[i] = e.target.value; setForm({...form, options: o}); }}
                    style={{ padding: '0.6rem 1rem', border: form.correct === i ? '1px solid rgba(99,102,241,0.5)' : '' }}/>
                </div>
              ))}
              <p style={{ fontSize: '0.8rem', color: '#555570', marginTop: '0.3rem' }}>Select radio button next to the correct answer</p>
            </div>

            <button className="btn-primary" type="submit" disabled={loading} style={{ alignSelf: 'flex-start' }}>
              {loading ? 'Adding...' : '➕ Add Question'}
            </button>
          </form>
        </div>

        {/* Questions list */}
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: '1rem' }}>Questions ({questions.length})</h3>
        {questions.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem', color: '#666678' }}>No questions added yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {questions.map((q, i) => (
              <div key={q.id} className="card">
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, marginBottom: '0.75rem' }}>Q{i+1}. {q.question}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {q.options?.map((opt, oi) => (
                    <div key={oi} style={{ fontSize: '0.88rem', color: '#888898', padding: '0.4rem 0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                      {String.fromCharCode(65+oi)}. {opt}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
