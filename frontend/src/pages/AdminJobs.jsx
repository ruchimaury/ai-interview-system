import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', skills: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => axios.get(`${API}/jobs`).then(r => setJobs(r.data));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    const skills = form.skills.split(',').map(s => s.trim()).filter(Boolean);
    try {
      await axios.post(`${API}/jobs`, { title: form.title, description: form.description, skills });
      setSuccess('Job created successfully!');
      setForm({ title: '', description: '', skills: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  const deleteJob = async (id) => {
    if (!window.confirm('Delete this job?')) return;
    await axios.delete(`${API}/jobs/${id}`);
    load();
  };

  return (
    <Layout>
      <div style={{ maxWidth: 900 }} className="fade-in">
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.8rem', marginBottom: '2rem' }}>Manage Jobs</h1>

        {/* Create form */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: '1.5rem' }}>➕ Post New Job</h3>

          {error && <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '0.75rem', marginBottom: '1rem', color: '#f87171', fontSize: '0.9rem' }}>{error}</div>}
          {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '0.75rem', marginBottom: '1rem', color: '#10b981', fontSize: '0.9rem' }}>{success}</div>}

          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#888898' }}>Job Title *</label>
              <input className="input-field" placeholder="e.g. Senior React Developer" required
                value={form.title} onChange={e => setForm({...form, title: e.target.value})}/>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#888898' }}>Description</label>
              <textarea className="input-field" rows={3} placeholder="Job description..."
                value={form.description} onChange={e => setForm({...form, description: e.target.value})}/>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#888898' }}>Required Skills (comma separated) *</label>
              <input className="input-field" placeholder="React, Node.js, Python, MongoDB..."
                value={form.skills} onChange={e => setForm({...form, skills: e.target.value})}/>
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {form.skills.split(',').filter(s => s.trim()).map((s, i) => (
                  <span key={i} className="skill-tag">{s.trim()}</span>
                ))}
              </div>
            </div>
            <button className="btn-primary" type="submit" disabled={loading} style={{ alignSelf: 'flex-start', padding: '0.8rem 2rem' }}>
              {loading ? 'Creating...' : '✓ Create Job'}
            </button>
          </form>
        </div>

        {/* Jobs list */}
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: '1rem' }}>Posted Jobs ({jobs.length})</h3>
        {jobs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem', color: '#666678' }}>No jobs posted yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {jobs.map(job => (
              <div key={job.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: '0.4rem' }}>{job.title}</h4>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {job.skills?.map(s => <span key={s} className="skill-tag">{s}</span>)}
                  </div>
                </div>
                <button className="btn-danger" onClick={() => deleteJob(job.id)}>Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
