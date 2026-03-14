import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getJobs } from '../utils/api';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getJobs().then(r => setJobs(r.data.jobs)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.description.toLowerCase().includes(search.toLowerCase()) ||
    j.requiredSkills?.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Available Positions</h1>
          <p className="page-subtitle">Find your perfect role and start your AI-powered interview journey</p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <input
            className="form-input"
            placeholder="🔍 Search by job title, skills, or department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 500 }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : filtered.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h3 style={{ color: '#fff' }}>{search ? 'No jobs matching your search' : 'No jobs available yet'}</h3>
          </div>
        ) : (
          <div className="grid-2">
            {filtered.map(job => (
              <div key={job._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 16, transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                    <h3 style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, color: '#fff' }}>{job.title}</h3>
                    <span className="status-badge status-applied">{job.department || 'General'}</span>
                  </div>
                  <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6, marginBottom: 12 }}>
                    {job.description.substring(0, 150)}{job.description.length > 150 ? '...' : ''}
                  </p>
                  <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#64748B', marginBottom: 12 }}>
                    <span>📍 {job.location || 'Remote'}</span>
                    <span>💼 {job.experience || 'Any'}</span>
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Required Skills</div>
                  <div style={{ marginBottom: 16 }}>
                    {job.requiredSkills?.slice(0, 6).map(skill => (
                      <span key={skill} className="skill-tag">{skill}</span>
                    ))}
                    {job.requiredSkills?.length > 6 && <span className="skill-tag">+{job.requiredSkills.length - 6} more</span>}
                  </div>
                  <Link to={`/apply/${job._id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    Apply Now →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
