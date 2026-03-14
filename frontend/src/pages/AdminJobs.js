import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { getJobs, createJob, deleteJob } from '../utils/api';
import { toast } from 'react-toastify';

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', requiredSkills: '', department: '', location: 'Remote', experience: '0-2 years' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getJobs().then(r => setJobs(r.data.jobs)).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const skills = form.requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
      const res = await createJob({ ...form, requiredSkills: skills });
      setJobs(prev => [res.data.job, ...prev]);
      setShowForm(false);
      setForm({ title: '', description: '', requiredSkills: '', department: '', location: 'Remote', experience: '0-2 years' });
      toast.success('Job created!');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this job?')) return;
    try {
      await deleteJob(id);
      setJobs(prev => prev.filter(j => j._id !== id));
      toast.success('Job deactivated');
    } catch (e) {
      toast.error('Failed to deactivate');
    }
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-title">Job Management</h1>
            <p className="page-subtitle">Create and manage job openings</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '➕ Create Job'}
          </button>
        </div>

        {showForm && (
          <div className="glass-card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Create New Job</h3>
            <form onSubmit={handleCreate}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Job Title *</label>
                  <input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Senior React Developer" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input className="form-input" value={form.department} onChange={e => setForm({...form, department: e.target.value})} placeholder="e.g. Engineering" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Required Skills * (comma separated)</label>
                <input className="form-input" value={form.requiredSkills} onChange={e => setForm({...form, requiredSkills: e.target.value})} placeholder="e.g. React, JavaScript, Node.js, MongoDB" required />
              </div>
              <div className="form-group">
                <label className="form-label">Job Description *</label>
                <textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe the role, responsibilities..." required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <select className="form-select" value={form.location} onChange={e => setForm({...form, location: e.target.value})}>
                    {['Remote', 'On-site', 'Hybrid', 'Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Experience Required</label>
                  <select className="form-select" value={form.experience} onChange={e => setForm({...form, experience: e.target.value})}>
                    {['Fresher', '0-1 years', '1-3 years', '3-5 years', '5-8 years', '8+ years'].map(e => <option key={e}>{e}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? '⏳ Creating...' : '✅ Create Job'}
              </button>
            </form>
          </div>
        )}

        {loading ? <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {jobs.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: 60 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>💼</div>
                <p style={{ color: '#94A3B8' }}>No jobs yet. Create your first job posting!</p>
              </div>
            ) : jobs.map(job => (
              <div key={job._id} className="glass-card" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{job.title}</h3>
                  <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>{job.department} • {job.location} • {job.experience}</div>
                  <div style={{ marginTop: 8 }}>
                    {job.requiredSkills?.slice(0, 4).map(s => <span key={s} className="skill-tag">{s}</span>)}
                    {job.requiredSkills?.length > 4 && <span className="skill-tag">+{job.requiredSkills.length - 4}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(job._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
