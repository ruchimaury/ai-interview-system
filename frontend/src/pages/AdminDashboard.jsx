import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API}/admin/stats`).then(r => setStats(r.data));
    axios.get(`${API}/jobs`).then(r => setJobs(r.data));
  }, []);

  return (
    <Layout>
      <div style={{ maxWidth: 1000 }} className="fade-in">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.8rem', fontWeight: 700 }}>Admin Dashboard</h1>
          <p style={{ color: '#666678' }}>Overview of your hiring pipeline</p>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Total Jobs', value: stats.total_jobs, icon: '💼', color: '#6366f1' },
              { label: 'Candidates', value: stats.total_candidates, icon: '👥', color: '#a855f7' },
              { label: 'Applications', value: stats.total_applications, icon: '📋', color: '#f59e0b' },
              { label: 'Completed', value: stats.completed_interviews, icon: '✅', color: '#10b981' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.8rem', fontWeight: 700, color: s.color }}>{s.value}</span>
                </div>
                <div style={{ color: '#666678', fontSize: '0.85rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Jobs with reports */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>Active Jobs</h2>
          <button className="btn-primary" onClick={() => navigate('/admin/jobs')}>Manage Jobs</button>
        </div>

        {jobs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💼</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, marginBottom: '0.5rem' }}>No jobs yet</div>
            <button className="btn-primary" onClick={() => navigate('/admin/jobs')}>Create First Job</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {jobs.map(job => (
              <div key={job.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: '0.5rem' }}>{job.title}</h3>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {job.skills?.slice(0, 4).map(s => <span key={s} className="skill-tag">{s}</span>)}
                    {job.skills?.length > 4 && <span className="skill-tag">+{job.skills.length - 4}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn-secondary" onClick={() => navigate(`/admin/report/${job.id}`)}>View Report</button>
                  <button className="btn-secondary" onClick={() => navigate(`/admin/test/${job.id}`)}>Add Questions</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
