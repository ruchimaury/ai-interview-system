import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

function ScoreBar({ label, value }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
        <span style={{ color: '#888898' }}>{label}</span>
        <span style={{ color: '#a5a8ff', fontWeight: 600 }}>{value ? value.toFixed(1) + '%' : 'N/A'}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: value ? value + '%' : '0%' }}/>
      </div>
    </div>
  );
}

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [apps, setApps] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API}/applications/my`).then(r => setApps(r.data)).catch(() => {});
  }, []);

  const completed = apps.filter(a => a.status === 'completed');
  const pending = apps.filter(a => a.status !== 'completed');

  return (
    <Layout>
      <div style={{ maxWidth: 900 }} className="fade-in">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: '#666678' }}>Track your applications and complete your screening process</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Applied', value: apps.length, icon: '📋', color: '#6366f1' },
            { label: 'In Progress', value: pending.length, icon: '⏳', color: '#f59e0b' },
            { label: 'Completed', value: completed.length, icon: '✅', color: '#10b981' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.4rem' }}>{s.icon}</span>
                <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.6rem', fontWeight: 700, color: s.color }}>{s.value}</span>
              </div>
              <div style={{ color: '#666678', fontSize: '0.85rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.1rem', fontWeight: 700 }}>My Applications</h2>
          <button className="btn-primary" onClick={() => navigate('/jobs')}>Browse Jobs</button>
        </div>

        {apps.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, marginBottom: '0.5rem' }}>No applications yet</div>
            <p style={{ color: '#666678', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Browse available jobs and apply to get started</p>
            <button className="btn-primary" onClick={() => navigate('/jobs')}>View Jobs</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {apps.map(app => (
              <AppCard key={app.id} app={app} navigate={navigate}/>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function AppCard({ app, navigate }) {
  const statusColors = {
    applied: '#f59e0b', test_done: '#6366f1', completed: '#10b981'
  };
  const statusLabels = {
    applied: 'Resume Reviewed', test_done: 'Test Done', completed: 'Completed'
  };

  const nextStep = () => {
    if (app.status === 'applied') navigate(`/test/${app.id}`);
    else if (app.status === 'test_done') navigate(`/interview/${app.id}`);
    else navigate(`/result/${app.id}`);
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>{app.job_title}</h3>
            <span style={{ padding: '0.2rem 0.7rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, background: `${statusColors[app.status]}22`, color: statusColors[app.status] }}>
              {statusLabels[app.status] || app.status}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <ScoreBadge label="Resume" value={app.resume_score}/>
            <ScoreBadge label="Test" value={app.test_score}/>
            <ScoreBadge label="Interview" value={app.interview_score}/>
            {app.final_score > 0 && <ScoreBadge label="Final" value={app.final_score} highlight/>}
          </div>

          {app.status === 'completed' && app.rank > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.8rem', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 999, fontSize: '0.82rem', color: '#a5a8ff' }}>
              🏆 Rank #{app.rank}
            </div>
          )}
        </div>

        <button className="btn-primary" onClick={nextStep}>
          {app.status === 'applied' ? 'Take Test →' : app.status === 'test_done' ? 'Do Interview →' : 'View Result →'}
        </button>
      </div>
    </div>
  );
}

function ScoreBadge({ label, value, highlight }) {
  if (!value) return <div style={{ fontSize: '0.82rem', color: '#444458' }}>{label}: —</div>;
  return (
    <div style={{ fontSize: '0.82rem' }}>
      <span style={{ color: '#666678' }}>{label}: </span>
      <span style={{ fontWeight: 600, color: highlight ? '#a855f7' : '#a5a8ff' }}>{value.toFixed(1)}%</span>
    </div>
  );
}
