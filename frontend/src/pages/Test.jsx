import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function Test() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    axios.get(`${API}/applications/${appId}`).then(r => {
      setApp(r.data);
      return axios.get(`${API}/tests/${r.data.job_id}`);
    }).then(r => {
      setQuestions(r.data);
      setTimeLeft(r.data.length * 60);
    }).catch(() => navigate('/dashboard'));
  }, [appId]);

  useEffect(() => {
    if (!timeLeft || result) return;
    if (timeLeft <= 0) { submitTest(); return; }
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, result]);

  const submitTest = async () => {
    setLoading(true);
    const arr = questions.map((_, i) => answers[i] ?? -1);
    try {
      const r = await axios.post(`${API}/tests/submit`, { application_id: parseInt(appId), answers: arr });
      setResult(r.data);
    } catch (err) {
      if (err.response?.data?.detail === 'Test already submitted') {
        setResult({ already: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  if (result) {
    return (
      <Layout>
        <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', padding: '3rem' }} className="fade-in">
          <div className="card" style={{ padding: '2.5rem' }}>
            {result.already ? (
              <>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>ℹ️</div>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: '0.5rem' }}>Already Submitted</h2>
                <p style={{ color: '#666678', marginBottom: '1.5rem' }}>You have already completed this test.</p>
              </>
            ) : (
              <>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: '0.5rem' }}>Test Complete!</h2>
                <div style={{ margin: '1.5rem 0', padding: '1rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12 }}>
                  <div style={{ fontSize: '0.85rem', color: '#888898', marginBottom: '0.25rem' }}>Your Score</div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '2rem', fontWeight: 800, color: '#a5a8ff' }}>{result.score?.toFixed(1)}%</div>
                  <div style={{ fontSize: '0.82rem', color: '#666678', marginTop: '0.25rem' }}>{result.correct}/{result.total} correct</div>
                </div>
              </>
            )}
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => navigate(`/interview/${appId}`)}>Proceed to Interview →</button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!questions.length) {
    return (
      <Layout>
        <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', padding: '3rem' }} className="fade-in">
          <div className="card" style={{ padding: '2.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: '0.5rem' }}>No Test Available</h2>
            <p style={{ color: '#666678', marginBottom: '1.5rem', fontSize: '0.9rem' }}>The admin hasn't added questions for this job yet. Proceed directly to interview.</p>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => navigate(`/interview/${appId}`)}>Go to Interview →</button>
          </div>
        </div>
      </Layout>
    );
  }

  const q = questions[current];
  const progress = (Object.keys(answers).length / questions.length) * 100;

  return (
    <Layout>
      <div style={{ maxWidth: 700, margin: '0 auto' }} className="fade-in">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.4rem' }}>Online Test</h1>
            <p style={{ color: '#666678', fontSize: '0.85rem' }}>Question {current + 1} of {questions.length}</p>
          </div>
          {timeLeft !== null && (
            <div style={{ padding: '0.5rem 1rem', background: timeLeft < 60 ? 'rgba(248,113,113,0.15)' : 'rgba(99,102,241,0.15)', border: `1px solid ${timeLeft < 60 ? 'rgba(248,113,113,0.3)' : 'rgba(99,102,241,0.3)'}`, borderRadius: 10, fontFamily: 'Syne, sans-serif', fontWeight: 700, color: timeLeft < 60 ? '#f87171' : '#a5a8ff', fontSize: '1.1rem' }}>
              ⏱ {formatTime(timeLeft)}
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="progress-bar" style={{ marginBottom: '2rem', height: 8 }}>
          <div className="progress-fill" style={{ width: progress + '%' }}/>
        </div>

        {/* Question */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '1.05rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Q{current + 1}. {q.question}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {q.options?.map((opt, i) => (
              <div key={i} onClick={() => setAnswers({ ...answers, [current]: i })}
                style={{ padding: '1rem', borderRadius: 12, border: answers[current] === i ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.08)', background: answers[current] === i ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', border: answers[current] === i ? '2px solid #6366f1' : '2px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#a5a8ff', fontSize: '0.85rem', fontWeight: 700, background: answers[current] === i ? 'rgba(99,102,241,0.3)' : 'transparent' }}>
                  {String.fromCharCode(65 + i)}
                </div>
                <span style={{ color: answers[current] === i ? '#e8e8f0' : '#aaaabc', fontSize: '0.95rem' }}>{opt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
          <button className="btn-secondary" disabled={current === 0} onClick={() => setCurrent(c => c - 1)}>← Previous</button>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', flex: 1 }}>
            {questions.map((_, i) => (
              <div key={i} onClick={() => setCurrent(i)}
                style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: i === current ? '#6366f1' : answers[i] !== undefined ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.05)', color: i === current ? 'white' : answers[i] !== undefined ? '#10b981' : '#666678', border: i === current ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>
                {i + 1}
              </div>
            ))}
          </div>
          {current < questions.length - 1 ? (
            <button className="btn-primary" onClick={() => setCurrent(c => c + 1)}>Next →</button>
          ) : (
            <button className="btn-primary" onClick={submitTest} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit ✓'}
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
}
