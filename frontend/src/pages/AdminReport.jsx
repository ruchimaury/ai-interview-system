import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function AdminReport() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState([]);
  const [job, setJob] = useState(null);

  useEffect(() => {
    axios.get(`${API}/jobs/${jobId}`).then(r => setJob(r.data));
    axios.get(`${API}/admin/reports/${jobId}`).then(r => setReport(r.data));
  }, [jobId]);

  const getColor = (v) => !v ? '#555570' : v >= 75 ? '#10b981' : v >= 50 ? '#f59e0b' : '#f87171';

  return (
    <Layout>
      <div style={{ maxWidth: 1000 }} className="fade-in">
        <button className="btn-secondary" onClick={() => navigate('/admin')} style={{ marginBottom: '1.5rem' }}>← Dashboard</button>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.5rem', marginBottom: '0.3rem' }}>Candidate Report</h1>
          {job && <p style={{ color: '#666678' }}>Position: <strong style={{ color: '#a5a8ff' }}>{job.title}</strong> · {report.length} applicants</p>}
        </div>

        {report.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>No applications yet</div>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['Rank', 'Candidate', 'Status', 'Resume', 'Test', 'Interview', 'Final Score'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#555570', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.map((r, i) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '1rem' }}>
                        {r.rank > 0 ? (
                          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: r.rank <= 3 ? '#f59e0b' : '#888898' }}>
                            {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : `#${r.rank}`}
                          </span>
                        ) : <span style={{ color: '#444458' }}>—</span>}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.candidate_name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#555570' }}>{r.candidate_email}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ padding: '0.2rem 0.7rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
                          background: r.status === 'completed' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                          color: r.status === 'completed' ? '#10b981' : '#f59e0b' }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: getColor(r.resume_score), fontWeight: 600, fontSize: '0.9rem' }}>
                        {r.resume_score ? r.resume_score.toFixed(1) + '%' : '—'}
                      </td>
                      <td style={{ padding: '1rem', color: getColor(r.test_score), fontWeight: 600, fontSize: '0.9rem' }}>
                        {r.test_score ? r.test_score.toFixed(1) + '%' : '—'}
                      </td>
                      <td style={{ padding: '1rem', color: getColor(r.interview_score), fontWeight: 600, fontSize: '0.9rem' }}>
                        {r.interview_score ? r.interview_score.toFixed(1) + '%' : '—'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {r.final_score ? (
                          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: getColor(r.final_score) }}>
                            {r.final_score.toFixed(1)}%
                          </span>
                        ) : <span style={{ color: '#444458' }}>Pending</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
