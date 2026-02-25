import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API}/jobs`).then(r => setJobs(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div style={{ maxWidth: 900 }} className="fade-in">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>Browse Jobs</h1>
          <p style={{ color: '#666678' }}>{jobs.length} positions available</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666678' }}>Loading...</div>
        ) : jobs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💼</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>No jobs posted yet</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {jobs.map(job => (
              <div key={job.id} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/apply/${job.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{job.title}</h3>
                    <p style={{ color: '#777788', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: 1.6 }}>{job.description}</p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {job.skills?.map(s => <span key={s} className="skill-tag">{s}</span>)}
                    </div>
                  </div>
                  <button className="btn-primary" onClick={e => { e.stopPropagation(); navigate(`/apply/${job.id}`); }}>
                    Apply Now →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
