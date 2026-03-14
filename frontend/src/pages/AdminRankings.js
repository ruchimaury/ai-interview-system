import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getRankings } from '../utils/api';

export default function AdminRankings() {
  const { jobId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRankings(jobId).then(r => setData(r.data)).finally(() => setLoading(false));
  }, [jobId]);

  const getColor = (score) => score >= 70 ? '#06D6A0' : score >= 45 ? '#F59E0B' : '#EF4444';

  if (loading) return <><Navbar /><div style={{ textAlign: 'center', padding: 80 }}><div className="spinner" style={{ margin: '0 auto' }} /></div></>;

  const rankings = data?.rankings || [];
  const job = data?.job;

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">🏆 Candidate Rankings</h1>
          {job && <p className="page-subtitle">{job.title} • {rankings.length} candidates ranked by AI</p>}
        </div>

        {rankings.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
            <p style={{ color: '#94A3B8' }}>No candidates have completed the process yet</p>
          </div>
        ) : (
          <>
            {/* Top 3 podium */}
            {rankings.length >= 3 && (
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'flex-end', marginBottom: 40, padding: '20px 0' }}>
                {[rankings[1], rankings[0], rankings[2]].map((r, i) => {
                  const heights = [160, 200, 140];
                  const podiumRanks = [2, 1, 3];
                  const medals = ['🥈', '🥇', '🥉'];
                  if (!r) return null;
                  return (
                    <div key={r.applicationId} style={{ textAlign: 'center', flex: i === 1 ? '0 0 200px' : '0 0 160px' }}>
                      {r.candidate?.photo && <img src={`http://localhost:5000${r.candidate.photo}`} alt="" style={{ width: i === 1 ? 72 : 56, height: i === 1 ? 72 : 56, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${i === 1 ? '#F59E0B' : '#64748B'}`, marginBottom: 8 }} onError={e => e.target.style.display = 'none'} />}
                      <div style={{ fontSize: 24 }}>{medals[i]}</div>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{r.candidate?.name}</div>
                      <div style={{ fontFamily: 'Syne', fontWeight: 900, fontSize: 20, color: getColor(r.finalScore) }}>{r.finalScore}%</div>
                      <div style={{
                        height: heights[i], marginTop: 12,
                        background: i === 1 ? 'linear-gradient(180deg, rgba(245,158,11,0.3), rgba(245,158,11,0.1))' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${i === 1 ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Syne', fontWeight: 900, fontSize: 28, color: '#64748B'
                      }}>#{podiumRanks[i]}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full Rankings Table */}
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontFamily: 'Syne', fontWeight: 700, color: '#fff' }}>Full Rankings</h3>
                <span style={{ fontSize: 13, color: '#94A3B8' }}>Sorted by Final AI Score (Resume 30% + Test 30% + Interview 40%)</span>
              </div>
              {rankings.map((r, i) => (
                <div key={r.applicationId} style={{
                  display: 'flex', gap: 16, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                  alignItems: 'center', flexWrap: 'wrap',
                  background: i === 0 ? 'rgba(245,158,11,0.05)' : i === 1 ? 'rgba(148,163,184,0.03)' : 'transparent'
                }}>
                  <div style={{ width: 40, textAlign: 'center', fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : i === 2 ? '#CD7F32' : '#64748B' }}>
                    #{i + 1}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 150 }}>
                    {r.candidate?.photo && <img src={`http://localhost:5000${r.candidate.photo}`} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: r.faceVerified ? '2px solid #06D6A0' : '2px solid rgba(255,255,255,0.1)' }} onError={e => e.target.style.display = 'none'} />}
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{r.candidate?.name}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>{r.candidate?.email}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    {[['Resume', r.resumeScore], ['Test', r.testScore], ['Interview', r.interviewScore]].map(([label, score]) => (
                      <div key={label} style={{ textAlign: 'center', minWidth: 50 }}>
                        <div style={{ fontSize: 11, color: '#64748B' }}>{label}</div>
                        <div style={{ fontWeight: 700, color: getColor(score || 0) }}>{score || '-'}%</div>
                      </div>
                    ))}
                    
                    <div style={{ textAlign: 'center', minWidth: 60 }}>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>FINAL</div>
                      <div style={{ fontFamily: 'Syne', fontWeight: 900, fontSize: 20, color: getColor(r.finalScore) }}>{r.finalScore}%</div>
                    </div>
                    
                    {r.faceVerified && <span title="Face Verified" style={{ fontSize: 16 }}>✅</span>}
                    
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 10, background: r.hrDecision === 'selected' ? 'rgba(6,214,160,0.15)' : r.hrDecision === 'rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: r.hrDecision === 'selected' ? '#06D6A0' : r.hrDecision === 'rejected' ? '#EF4444' : '#F59E0B' }}>
                      {r.hrDecision || 'pending'}
                    </span>
                    
                    <Link to={`/admin/applications/${r.applicationId}`} className="btn btn-outline btn-sm">View Report →</Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
