import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function Result() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);

  useEffect(() => {
    axios.get(`${API}/applications/${appId}`).then(r => setApp(r.data)).catch(() => navigate('/dashboard'));
  }, [appId]);

  if (!app) return <Layout><div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div></Layout>;

  const scores = [
    { label: 'Resume Analysis', value: app.resume_score, weight: '30%', icon: '📄', desc: 'Skill matching & experience' },
    { label: 'Online Test', value: app.test_score, weight: '35%', icon: '📝', desc: 'Knowledge assessment' },
    { label: 'AI Interview', value: app.interview_score, weight: '35%', icon: '🎙️', desc: 'Communication & confidence' },
  ];

  const getColor = (v) => v >= 75 ? '#10b981' : v >= 50 ? '#f59e0b' : '#f87171';
  const getLabel = (v) => v >= 75 ? 'Excellent' : v >= 50 ? 'Good' : 'Needs Improvement';

  return (
    <Layout>
      <div style={{ maxWidth: 700, margin: '0 auto' }} className="fade-in">
        <button className="btn-secondary" onClick={() => navigate('/dashboard')} style={{ marginBottom: '1.5rem' }}>← Dashboard</button>

        {/* Final Score */}
        <div className="card" style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '2.5rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))', borderColor: 'rgba(99,102,241,0.3)' }}>
          {app.rank > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 1rem', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 999, fontSize: '0.85rem', color: '#a5a8ff', marginBottom: '1rem' }}>
              🏆 Rank #{app.rank} for this position
            </div>
          )}
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '4rem', fontWeight: 800 }} className="gradient-text">
            {app.final_score ? app.final_score.toFixed(1) + '%' : 'Pending'}
          </div>
          <div style={{ color: '#888898', marginTop: '0.5rem' }}>Final Score</div>
          {app.final_score && (
            <div style={{ display: 'inline-block', padding: '0.3rem 1rem', background: `${getColor(app.final_score)}22`, color: getColor(app.final_score), borderRadius: 999, fontSize: '0.9rem', fontWeight: 600, marginTop: '0.75rem', border: `1px solid ${getColor(app.final_score)}44` }}>
              {getLabel(app.final_score)}
            </div>
          )}
        </div>

        {/* Score breakdown */}
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: '1rem' }}>Score Breakdown</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {scores.map(s => (
            <div key={s.label} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
                  <div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>{s.label}</div>
                    <div style={{ fontSize: '0.78rem', color: '#666678' }}>{s.desc} · Weight: {s.weight}</div>
                  </div>
                </div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.3rem', color: getColor(s.value || 0) }}>
                  {s.value ? s.value.toFixed(1) + '%' : '—'}
                </div>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: (s.value || 0) + '%', background: `linear-gradient(90deg, ${getColor(s.value || 0)}, ${getColor(s.value || 0)}88)` }}/>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <button className="btn-secondary" onClick={() => navigate('/jobs')}>Browse More Jobs</button>
        </div>
      </div>
    </Layout>
  );
}
