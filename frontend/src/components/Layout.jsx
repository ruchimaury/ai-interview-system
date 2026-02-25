import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const icons = {
  dashboard: '📊', jobs: '💼', applications: '📋', interview: '🎙️',
  reports: '📈', candidates: '👥', tests: '📝', logout: '🚪', profile: '👤', menu: '☰'
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const adminLinks = [
    { path: '/admin', label: 'Dashboard', icon: 'dashboard' },
    { path: '/admin/jobs', label: 'Manage Jobs', icon: 'jobs' },
    { path: '/admin/candidates', label: 'Candidates', icon: 'candidates' },
  ];

  const candidateLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/jobs', label: 'Browse Jobs', icon: 'jobs' },
    { path: '/applications', label: 'My Applications', icon: 'applications' },
  ];

  const links = user?.role === 'admin' ? adminLinks : candidateLinks;

  const SidebarContent = () => (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', padding: '0 0.5rem' }}>
        <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#6366f1,#a855f7)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>🤖</div>
        <div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.95rem' }}>AI Interview</div>
          <div style={{ fontSize: '0.75rem', color: '#555570' }}>{user?.role === 'admin' ? 'Admin Panel' : 'Candidate'}</div>
        </div>
      </div>

      <nav style={{ flex: 1 }}>
        {links.map(l => (
          <a key={l.path} className={`sidebar-link ${loc.pathname === l.path ? 'active' : ''}`}
            onClick={() => { navigate(l.path); setMobileOpen(false); }}>
            <span>{icons[l.icon]}</span> {l.label}
          </a>
        ))}
      </nav>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', marginTop: '1rem' }}>
        <div style={{ padding: '0.75rem 1rem', marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name}</div>
          <div style={{ fontSize: '0.75rem', color: '#555570' }}>{user?.email}</div>
        </div>
        <a className="sidebar-link" onClick={() => { logout(); navigate('/'); }}>
          <span>🚪</span> Sign Out
        </a>
      </div>
    </>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop sidebar */}
      <div className="sidebar hide-mobile" style={{ display: 'flex', flexDirection: 'column' }}>
        <SidebarContent/>
      </div>

      {/* Mobile nav */}
      <div style={{ display: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(10,10,15,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0.75rem 1rem', alignItems: 'center', justifyContent: 'space-between' }}
        className="mobile-top-nav" id="mobile-top-nav">
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>🤖 AI Interview</div>
        <button onClick={() => setMobileOpen(!mobileOpen)} style={{ background: 'none', border: 'none', color: '#e8e8f0', fontSize: '1.3rem', cursor: 'pointer' }}>☰</button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="modal-overlay" onClick={() => setMobileOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 260, background: '#0d0d18', borderRight: '1px solid rgba(255,255,255,0.08)', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', zIndex: 1001 }}>
            <SidebarContent/>
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '2rem', maxWidth: '100%' }}>
        {children}
      </div>
    </div>
  );
}
