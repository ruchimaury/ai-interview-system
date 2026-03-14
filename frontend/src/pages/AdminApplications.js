import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getAllApplications, getJobs, getRankings } from '../utils/api';

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ jobId: '', status: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.jobId) params.jobId = filter.jobId;
      if (filter.status) params.status = filter.status;
      const [appsRes, jobsRes] = await Promise.all([getAllApplications(params), getJobs()]);
      setApplications(appsRes.data.applications);
      setJobs(jobsRes.data.jobs);
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const getScoreColor = (score) => score >= 70 ? '#06D6A0' : score >= 45 ? '#F59E0B' : '#EF4444';

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">All Applications</h1>
          <p className="page-subtitle">Review and manage candidate applications</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <select className="form-select" style={{ width: 200 }} value={filter.jobId} onChange={e => setFilter({...filter, jobId: e.target.value})}>
            <option value="">All Jobs</option>
            {jobs.map(j => <option key={j._id} value={j._id}>{j.title}</option>)}
          </select>
          <select className="form-select" style={{ width: 180 }} value={filter.status} onChange={e => setFilter({...filter, status: e.target.value})}>
            <option value="">All Status</option>
            {['applied', 'resume_analyzed', 'test_completed', 'interview_completed', 'selected', 'rejected'].map(s => <option key={s}>{s}</option>)}
          </select>
          {filter.jobId && <Link to={`/admin/rankings/${filter.jobId}`} className="btn btn-primary btn-sm">🏆 View Rankings</Link>}
        </div>

        <div style={{ fontSize: 14, color: '#94A3B8', marginBottom: 16 }}>{applications.length} applications found</div>

        {loading ? <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div> : (
          <>
            {applications.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: 60 }}>
                <div style={{ fontSize: 48 }}>📭</div>
                <p style={{ color: '#94A3B8', marginTop: 16 }}>No applications found</p>
              </div>
            ) : (
              <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 80px 80px 80px 80px 100px 80px', gap: 12, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  <span>Candidate</span><span>Job</span><span>Resume</span><span>Test</span><span>Interview</span><span>Final</span><span>Status</span><span>Action</span>
                </div>
                {applications.map(app => (
                  <div key={app._id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 80px 80px 80px 80px 100px 80px', gap: 12, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {app.candidate?.photo && <img src={`http://localhost:5000${app.candidate.photo}`} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />}
                      <div>
                        <div style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>{app.candidate?.name}</div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>{app.candidate?.email}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: '#94A3B8' }}>{app.job?.title}</div>
                    <div style={{ fontWeight: 700, color: getScoreColor(app.resumeScore) }}>{app.resumeScore || '-'}%</div>
                    <div style={{ fontWeight: 700, color: getScoreColor(app.testScore) }}>{app.testScore || '-'}%</div>
                    <div style={{ fontWeight: 700, color: getScoreColor(app.interviewScore) }}>{app.interviewScore || '-'}%</div>
                    <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 16, color: getScoreColor(app.finalScore) }}>{app.finalScore || '-'}%</div>
                    <div>
                      {app.faceVerified && <span title="Face Verified">✅ </span>}
                      <span className={`status-badge ${app.hrDecision === 'selected' ? 'status-selected' : app.hrDecision === 'rejected' ? 'status-rejected' : 'status-pending'}`} style={{ fontSize: 11 }}>
                        {app.hrDecision || 'pending'}
                      </span>
                    </div>
                    <Link to={`/admin/applications/${app._id}`} className="btn btn-outline btn-sm">View →</Link>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
