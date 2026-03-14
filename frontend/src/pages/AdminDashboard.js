import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getDashboard } from '../utils/api';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard().then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <><Navbar /><div style={{ textAlign: 'center', padding: 80 }}><div className="spinner" style={{ margin: '0 auto' }} /></div></>;

  const stats = data?.stats || {};
  const recent = data?.recentApplications || [];

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">HR Dashboard</h1>
          <p className="page-subtitle">Monitor candidates, applications, and screening results</p>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
          <Link to="/admin/jobs" className="btn btn-primary">➕ Create Job</Link>
          <Link to="/admin/tests" className="btn btn-outline">📝 Manage Tests</Link>
          <Link to="/admin/applications" className="btn btn-outline">👥 All Applications</Link>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: 32 }}>
          {[
            { label: 'Active Jobs', value: stats.totalJobs || 0, icon: '💼', color: '#6C63FF' },
            { label: 'Candidates', value: stats.totalCandidates || 0, icon: '👥', color: '#06D6A0' },
            { label: 'Applications', value: stats.totalApplications || 0, icon: '📋', color: '#F59E0B' },
            { label: 'Interviews Done', value: stats.completedInterviews || 0, icon: '🎥', color: '#EF4444' },
          ].map(s => (
            <div key={s.label} className="glass-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontFamily: 'Syne', fontSize: 36, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#94A3B8' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Recent Applications */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, color: '#fff' }}>Recent Applications</h2>
            <Link to="/admin/applications" style={{ color: '#6C63FF', textDecoration: 'none', fontSize: 14 }}>View All →</Link>
          </div>

          {recent.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>No applications yet. Create a job first.</div>
          ) : (
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              {recent.map((app, i) => (
                <div key={app._id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: i < recent.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', flexWrap: 'wrap' }}>
                  {app.candidate?.photo && <img src={`http://localhost:5000${app.candidate.photo}`} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(108,99,255,0.3)' }} onError={e => e.target.style.display = 'none'} />}
                  <div style={{ flex: 1, minWidth: 150 }}>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{app.candidate?.name}</div>
                    <div style={{ fontSize: 13, color: '#94A3B8' }}>{app.job?.title}</div>
                  </div>
                  <div style={{ fontSize: 13, color: '#64748B' }}>{new Date(app.appliedAt).toLocaleDateString()}</div>
                  <Link to={`/admin/applications/${app._id}`} className="btn btn-outline btn-sm">View →</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
