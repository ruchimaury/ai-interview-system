import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getMyApplications } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const getStatusLabel = (status) => {
  const map = {
    'applied': { label: 'Applied', class: 'status-applied' },
    'resume_analyzed': { label: 'Resume Analyzed', class: 'status-applied' },
    'test_completed': { label: 'Test Done', class: 'status-pending' },
    'interview_completed': { label: 'Interview Done', class: 'status-pending' },
    'selected': { label: '🎉 Selected', class: 'status-selected' },
    'rejected': { label: 'Not Selected', class: 'status-rejected' },
  };
  return map[status] || { label: status, class: 'status-applied' };
};

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyApplications().then(r => setApplications(r.data.applications)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <div className="page-container">
        {/* Welcome */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32, background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(6,214,160,0.1))' }}>
          {user?.photo && <img src={`http://localhost:5000${user.photo}`} alt={user.name} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '3px solid #6C63FF' }} onError={e => e.target.style.display = 'none'} />}
          <div>
            <h1 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800, color: '#fff' }}>Hello, {user?.name}! 👋</h1>
            <p style={{ color: '#94A3B8', marginTop: 4 }}>Track your applications and continue your journey</p>
          </div>
          <Link to="/jobs" className="btn btn-primary" style={{ marginLeft: 'auto' }}>Browse Jobs →</Link>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: 32 }}>
          {[
            { label: 'Applications', value: applications.length, icon: '📋' },
            { label: 'Tests Completed', value: applications.filter(a => a.status === 'test_completed' || a.status === 'interview_completed' || a.status === 'selected').length, icon: '🧪' },
            { label: 'Interviews Done', value: applications.filter(a => a.status === 'interview_completed' || a.status === 'selected').length, icon: '🎥' },
            { label: 'Selected', value: applications.filter(a => a.status === 'selected').length, icon: '🏆' },
          ].map(s => (
            <div key={s.label} className="glass-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontFamily: 'Syne', fontSize: 32, fontWeight: 800, color: '#6C63FF' }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#94A3B8' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Applications */}
        <div>
          <h2 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 16 }}>My Applications</h2>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : applications.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
              <h3 style={{ color: '#fff', marginBottom: 8 }}>No applications yet</h3>
              <p style={{ color: '#94A3B8', marginBottom: 24 }}>Browse jobs and apply to start your journey</p>
              <Link to="/jobs" className="btn btn-primary">Browse Jobs →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {applications.map(app => {
                const statusInfo = getStatusLabel(app.status);
                const canContinue = ['applied', 'resume_analyzed', 'test_completed'].includes(app.status);
                return (
                  <div key={app._id} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{app.job?.title}</h3>
                      <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>
                        {app.job?.department} • Applied {new Date(app.appliedAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      {app.resumeScore > 0 && <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>Resume</div>
                        <div style={{ fontWeight: 700, color: app.resumeScore >= 60 ? '#06D6A0' : '#F59E0B' }}>{app.resumeScore}%</div>
                      </div>}
                      {app.testScore > 0 && <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>Test</div>
                        <div style={{ fontWeight: 700, color: app.testScore >= 60 ? '#06D6A0' : '#F59E0B' }}>{app.testScore}%</div>
                      </div>}
                      {app.finalScore > 0 && <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>Final</div>
                        <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: '#6C63FF' }}>{app.finalScore}%</div>
                      </div>}
                      
                      <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>
                      
                      {canContinue && (
                        <Link to={`/apply/${app.job?._id}`} className="btn btn-primary btn-sm">Continue →</Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
