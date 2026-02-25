import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function AdminCandidates() {
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    axios.get(`${API}/admin/candidates`).then(r => setCandidates(r.data));
  }, []);

  return (
    <Layout>
      <div style={{ maxWidth: 900 }} className="fade-in">
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.8rem', marginBottom: '0.3rem' }}>Candidates</h1>
        <p style={{ color: '#666678', marginBottom: '2rem' }}>{candidates.length} registered candidates</p>

        {candidates.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#666678' }}>No candidates registered yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {candidates.map(c => (
              <div key={c.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>
                    {c.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: '0.82rem', color: '#555570' }}>{c.email}</div>
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#555570' }}>Joined {new Date(c.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
