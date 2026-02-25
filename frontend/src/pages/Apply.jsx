import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function Apply() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    axios.get(`${API}/jobs/${jobId}`).then(r => setJob(r.data)).catch(() => navigate('/jobs'));
  }, [jobId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true); setError('');
    const fd = new FormData();
    fd.append('resume', file);
    try {
      const r = await axios.post(`${API}/apply/${jobId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess(r.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Application failed');
    } finally {
      setLoading(false);
    }
  };

  if (!job) return <Layout><div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div></Layout>;

  if (success) {
    return (
      <Layout>
        <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', padding: '3rem' }} className="fade-in">
          <div className="card" style={{ padding: '2.5rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: '0.5rem' }}>Application Submitted!</h2>
            <div style={{ margin: '1.5rem 0', padding: '1rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12 }}>
              <div style={{ fontSize: '0.85rem', color: '#888898', marginBottom: '0.25rem' }}>Resume Match Score</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>{success.resume_score}%</div>
            </div>
            <p style={{ color: '#666678', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Your resume has been analyzed. Proceed to the online test to continue.</p>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => navigate(`/test/${success.application_id}`)}>
              Take Online Test →
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ maxWidth: 600, margin: '0 auto' }} className="fade-in">
        <button className="btn-secondary" onClick={() => navigate('/jobs')} style={{ marginBottom: '1.5rem' }}>← Back</button>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.3rem', marginBottom: '0.5rem' }}>{job.title}</h2>
          <p style={{ color: '#777788', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: 1.6 }}>{job.description}</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {job.skills?.map(s => <span key={s} className="skill-tag">{s}</span>)}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: '1.5rem' }}>Upload Your Resume</h3>

          {error && (
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '0.75rem', marginBottom: '1rem', color: '#f87171', fontSize: '0.9rem' }}>{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ border: '2px dashed rgba(99,102,241,0.3)', borderRadius: 14, padding: '2rem', textAlign: 'center', marginBottom: '1.5rem', cursor: 'pointer', transition: 'border-color 0.2s', background: file ? 'rgba(99,102,241,0.05)' : 'transparent' }}
              onClick={() => document.getElementById('resume-input').click()}>
              <input id="resume-input" type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: 'none' }}
                onChange={e => setFile(e.target.files[0])}/>
              {file ? (
                <>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{file.name}</div>
                  <div style={{ fontSize: '0.82rem', color: '#666678' }}>{(file.size / 1024).toFixed(1)} KB</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⬆️</div>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Click to upload resume</div>
                  <div style={{ fontSize: '0.82rem', color: '#666678' }}>PDF, DOC, DOCX, TXT supported</div>
                </>
              )}
            </div>

            <div style={{ background: 'rgba(99,102,241,0.08)', borderRadius: 10, padding: '1rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#888898' }}>
              <strong style={{ color: '#a5a8ff' }}>AI will analyze:</strong> Skills matching, experience level, keyword relevance with job requirements
            </div>

            <button className="btn-primary" type="submit" disabled={!file || loading} style={{ width: '100%', justifyContent: 'center', padding: '0.9rem' }}>
              {loading ? 'Analyzing Resume...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
