import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '2rem' }}>
      <div className="orb" style={{ width: 500, height: 500, background: '#6366f1', top: -100, left: -100, animationDelay: '0s' }}/>
      <div className="orb" style={{ width: 400, height: 400, background: '#a855f7', bottom: -80, right: -80, animationDelay: '3s' }}/>
      <div className="orb" style={{ width: 300, height: 300, background: '#ec4899', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', animationDelay: '6s' }}/>

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 700 }} className="fade-in">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 999, marginBottom: '2rem', fontSize: '0.85rem', color: '#a5a8ff' }}>
          <span>🤖</span> Powered by AI Analysis
        </div>

        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem' }}>
          The Future of<br/>
          <span className="gradient-text">Hiring is Here</span>
        </h1>

        <p style={{ color: '#888898', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: 500, margin: '0 auto 2.5rem' }}>
          AI-powered screening system that analyzes resumes, conducts tests, and evaluates interviews — giving you the best candidates automatically.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => navigate('/register')} style={{ fontSize: '1rem', padding: '0.9rem 2rem' }}>
            Get Started Free →
          </button>
          <button className="btn-secondary" onClick={() => navigate('/login')} style={{ fontSize: '1rem', padding: '0.9rem 2rem' }}>
            Sign In
          </button>
        </div>

        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '4rem', flexWrap: 'wrap' }}>
          {[['Resume AI', 'Smart skill matching'], ['Live Tests', 'Auto-scored MCQ'], ['AI Interview', 'Emotion & confidence']].map(([t, d]) => (
            <div key={t} className="card" style={{ textAlign: 'left', minWidth: 160 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: '0.3rem', color: '#e8e8f0' }}>{t}</div>
              <div style={{ fontSize: '0.82rem', color: '#666678' }}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
