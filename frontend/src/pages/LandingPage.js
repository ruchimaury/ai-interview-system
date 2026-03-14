import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  const features = [
    { icon: '📷', title: 'Photo Verification', desc: 'Candidate registers with photo — system verifies identity at every step via AI face matching' },
    { icon: '📄', title: 'Smart Resume Analysis', desc: 'AI extracts skills from resume and matches them with job requirements, giving precise score' },
    { icon: '🧪', title: 'Technical MCQ Test', desc: 'Candidates take MCQ test with camera ON — identity is continuously verified during test' },
    { icon: '🎥', title: 'AI Video Interview', desc: 'Video interview with emotion detection, confidence analysis, and auto-transcript generation' },
    { icon: '🧠', title: 'Answer Summarization', desc: 'AI summarizes each answer for HR — saves hours of manual review with sentiment analysis' },
    { icon: '🏆', title: 'Smart Ranking', desc: 'Automatic ranking of candidates by combined score (Resume 30% + Test 30% + Interview 40%)' },
  ];

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Space Grotesk, sans-serif' }}>
      {/* Hero */}
      <div style={{
        position: 'relative', overflow: 'hidden', padding: '80px 24px 100px',
        background: 'linear-gradient(135deg, #0F0F23 0%, #1a0f3c 60%, #0F0F23 100%)',
        textAlign: 'center'
      }}>
        {/* Orbs */}
        <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,214,160,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        
        <div style={{ position: 'relative', maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(108,99,255,0.2)', border: '1px solid rgba(108,99,255,0.4)', borderRadius: 20, fontSize: 13, color: '#A5B4FC', marginBottom: 24 }}>
            🤖 Powered by AI & Machine Learning
          </div>
          <h1 style={{ fontFamily: 'Syne', fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 24 }}>
            <span style={{ color: '#fff' }}>AI Interview</span><br />
            <span style={{ background: 'linear-gradient(135deg, #6C63FF, #06D6A0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Screening System</span>
          </h1>
          <p style={{ fontSize: 18, color: '#94A3B8', lineHeight: 1.7, marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' }}>
            Automatically shortlist the best candidates using Resume AI, Face Verification, Online Tests, and Video Interview Analysis — all in one platform.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg">Get Started Free →</Link>
            <Link to="/login" className="btn btn-outline btn-lg">Sign In</Link>
          </div>
          
          {/* Stats */}
          <div style={{ display: 'flex', gap: 40, justifyContent: 'center', marginTop: 60, flexWrap: 'wrap' }}>
            {[['10x', 'Faster Hiring'], ['95%', 'Accuracy'], ['100%', 'Automated'], ['0', 'Manual Bias']].map(([num, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne', fontSize: 32, fontWeight: 800, color: '#6C63FF' }}>{num}</div>
                <div style={{ fontSize: 13, color: '#64748B' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontFamily: 'Syne', fontSize: 36, fontWeight: 800, color: '#fff' }}>Everything You Need</h2>
          <p style={{ color: '#64748B', marginTop: 12 }}>Complete end-to-end automated hiring pipeline</p>
        </div>
        <div className="grid-3">
          {features.map(f => (
            <div key={f.title} className="glass-card" style={{ transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Process Steps */}
      <div style={{ padding: '60px 24px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Syne', fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 48 }}>How It Works</h2>
          <div style={{ display: 'flex', gap: 0, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { step: '1', label: 'Register with Photo', desc: 'Identity stored for verification' },
              { step: '2', label: 'Upload Resume', desc: 'AI analyzes skills & experience' },
              { step: '3', label: 'Online MCQ Test', desc: 'With camera verification' },
              { step: '4', label: 'Video Interview', desc: 'AI records & analyzes' },
              { step: '5', label: 'HR Review', desc: 'AI summaries + rankings' },
            ].map((s, i, arr) => (
              <React.Fragment key={s.step}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 120, padding: '0 8px' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #06D6A0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: '#fff' }}>{s.step}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: '#64748B', textAlign: 'center' }}>{s.desc}</div>
                </div>
                {i < arr.length - 1 && <div style={{ flex: 1, height: 2, background: 'rgba(108,99,255,0.3)', margin: 'auto 8px', minWidth: 20 }} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Syne', fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Ready to Transform Hiring?</h2>
        <p style={{ color: '#94A3B8', marginBottom: 32 }}>Start screening candidates smarter with AI</p>
        <Link to="/register" className="btn btn-primary btn-lg">Create Your Account →</Link>
      </div>
    </div>
  );
}
