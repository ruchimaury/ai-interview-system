import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getApplicationDetail, updateDecision } from '../utils/api';
import { toast } from 'react-toastify';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

export default function AdminCandidateReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getApplicationDetail(id).then(r => {
      setData(r.data);
      setDecision(r.data.application.hrDecision || 'pending');
      setNotes(r.data.application.hrNotes || '');
    }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, [id]);

  const handleDecision = async () => {
    setSaving(true);
    try {
      await updateDecision(id, { decision, notes });
      toast.success('Decision saved!');
    } catch (e) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <><Navbar /><div style={{ textAlign: 'center', padding: 80 }}><div className="spinner" style={{ margin: '0 auto' }} /></div></>;
  if (!data) return <><Navbar /><div style={{ textAlign: 'center', padding: 80, color: '#94A3B8' }}>Application not found</div></>;

  const { application, rank, totalApplicants } = data;
  const { candidate, job } = application;

  const getColor = (score) => score >= 70 ? '#06D6A0' : score >= 45 ? '#F59E0B' : '#EF4444';

  const radarData = [
    { subject: 'Resume', score: application.resumeScore || 0 },
    { subject: 'Test', score: application.testScore || 0 },
    { subject: 'Interview', score: application.interviewScore || 0 },
    { subject: 'Confidence', score: application.emotionAnalysis?.confident || 0 },
    { subject: 'Communication', score: Math.round((application.answerSummaries?.reduce((s, a) => s + a.score, 0) || 0) / Math.max(application.answerSummaries?.length || 1, 1)) },
  ];

  return (
    <>
      <Navbar />
      <div className="page-container">
        <button onClick={() => navigate(-1)} className="btn btn-outline btn-sm" style={{ marginBottom: 20 }}>← Back</button>

        {/* Candidate Header */}
        <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(6,214,160,0.08))', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            {candidate?.photo && <img src={`http://localhost:5000${candidate.photo}`} alt={candidate.name} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #6C63FF' }} onError={e => e.target.style.display = 'none'} />}
            <div style={{ flex: 1 }}>
              <h1 style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800, color: '#fff' }}>{candidate?.name}</h1>
              <div style={{ color: '#94A3B8', marginTop: 4 }}>{candidate?.email} {candidate?.phone && `• ${candidate.phone}`}</div>
              <div style={{ color: '#94A3B8', marginTop: 4 }}>Applied for: <span style={{ color: '#6C63FF', fontWeight: 600 }}>{job?.title}</span></div>
              {application.faceVerified && <span style={{ display: 'inline-block', marginTop: 8, fontSize: 12, color: '#06D6A0', background: 'rgba(6,214,160,0.1)', padding: '3px 10px', borderRadius: 10 }}>✅ Identity Verified</span>}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne', fontSize: 48, fontWeight: 900, color: getColor(application.finalScore) }}>{application.finalScore || 0}%</div>
              <div style={{ fontSize: 13, color: '#94A3B8' }}>Final Score</div>
              {rank && <div style={{ fontSize: 14, color: '#F59E0B', marginTop: 4 }}>Rank #{rank} of {totalApplicants}</div>}
            </div>
          </div>
        </div>

        <div className="grid-2">
          {/* Score Breakdown */}
          <div className="glass-card">
            <h3 style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 20 }}>📊 Score Breakdown</h3>
            {[
              { label: 'Resume Match', score: application.resumeScore, weight: '30%' },
              { label: 'Online Test', score: application.testScore, weight: '30%' },
              { label: 'AI Interview', score: application.interviewScore, weight: '40%' },
            ].map(s => (
              <div key={s.label} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 14, color: '#94A3B8' }}>{s.label} <span style={{ fontSize: 11, color: '#64748B' }}>({s.weight})</span></span>
                  <span style={{ fontWeight: 700, color: getColor(s.score || 0) }}>{s.score || 0}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${s.score || 0}%`, background: getColor(s.score || 0) }} />
                </div>
              </div>
            ))}

            {/* Emotion analysis */}
            {application.emotionAnalysis && Object.keys(application.emotionAnalysis).length > 0 && (
              <div style={{ marginTop: 20 }}>
                <h4 style={{ color: '#94A3B8', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Emotion Analysis</h4>
                {Object.entries(application.emotionAnalysis).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#94A3B8', width: 90, textTransform: 'capitalize' }}>{k}</span>
                    <div className="progress-bar" style={{ flex: 1 }}>
                      <div style={{ height: '100%', borderRadius: 3, width: `${v}%`, background: k === 'nervous' ? '#EF4444' : '#6C63FF' }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', width: 35, textAlign: 'right' }}>{v}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Radar Chart */}
          <div className="glass-card">
            <h3 style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>🎯 Performance Radar</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <Radar name="Score" dataKey="score" stroke="#6C63FF" fill="#6C63FF" fillOpacity={0.3} />
                <Tooltip contentStyle={{ background: '#1A1A35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              </RadarChart>
            </ResponsiveContainer>

            {/* Skills */}
            <div style={{ marginTop: 12 }}>
              {application.matchedSkills?.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>✅ Matched Skills</div>
                  {application.matchedSkills.map(s => <span key={s} className="skill-tag matched">{s}</span>)}
                </div>
              )}
              {application.missingSkills?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>⚠️ Missing Skills</div>
                  {application.missingSkills.map(s => <span key={s} className="skill-tag missing">{s}</span>)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Interview Answer Summaries - KEY SECTION FOR HR */}
        {application.answerSummaries?.length > 0 && (
          <div className="glass-card" style={{ marginTop: 24 }}>
            <h3 style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>🤖 AI Interview Analysis</h3>
            <p style={{ color: '#94A3B8', fontSize: 14, marginBottom: 20 }}>AI-generated summaries of candidate's interview answers for quick HR review</p>

            {application.answerSummaries.map((ans, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>Q{i + 1}: {ans.question}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 10, background: ans.sentiment === 'excellent' ? 'rgba(6,214,160,0.15)' : ans.sentiment === 'good' ? 'rgba(108,99,255,0.15)' : 'rgba(245,158,11,0.15)', color: ans.sentiment === 'excellent' ? '#06D6A0' : ans.sentiment === 'good' ? '#6C63FF' : '#F59E0B' }}>
                      {ans.sentiment}
                    </span>
                    <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 16, color: getColor(ans.score) }}>{ans.score}%</span>
                  </div>
                </div>

                <div style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.15)', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: '#6C63FF', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>🤖 AI Summary</div>
                  <div style={{ fontSize: 14, color: '#E2E8F0', lineHeight: 1.6 }}>{ans.aiSummary}</div>
                </div>

                <details style={{ cursor: 'pointer' }}>
                  <summary style={{ fontSize: 12, color: '#64748B' }}>Show original answer</summary>
                  <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 8, padding: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 6, lineHeight: 1.6 }}>{ans.candidateAnswer}</div>
                </details>
              </div>
            ))}
          </div>
        )}

        {/* Resume Analysis */}
        {application.resumeAnalysis && (
          <div className="glass-card" style={{ marginTop: 24 }}>
            <h3 style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 12 }}>📄 Resume Analysis</h3>
            <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6 }}>{application.resumeAnalysis}</p>
            {candidate?.experience > 0 && <div style={{ marginTop: 12, fontSize: 14, color: '#6C63FF' }}>💼 {candidate.experience} years experience detected</div>}
          </div>
        )}

        {/* HR Decision */}
        <div className="glass-card" style={{ marginTop: 24 }}>
          <h3 style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>⚖️ HR Decision</h3>
          <div className="grid-2" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Decision</label>
              <select className="form-select" value={decision} onChange={e => setDecision(e.target.value)}>
                <option value="pending">⏳ Pending Review</option>
                <option value="selected">✅ Select Candidate</option>
                <option value="rejected">❌ Reject</option>
                <option value="hold">⏸️ Hold for Later</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">HR Notes (Internal)</label>
            <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add your notes about this candidate..." />
          </div>
          <button className="btn btn-primary" onClick={handleDecision} disabled={saving}>
            {saving ? '⏳ Saving...' : '💾 Save Decision'}
          </button>
        </div>
      </div>
    </>
  );
}
