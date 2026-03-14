import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const isAdmin = user?.role === 'admin';

  const navLinks = isAdmin
    ? [
        { to: '/admin', label: 'Dashboard' },
        { to: '/admin/jobs', label: 'Jobs' },
        { to: '/admin/tests', label: 'Tests' },
        { to: '/admin/applications', label: 'Applications' },
      ]
    : [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/jobs', label: 'Browse Jobs' },
      ];

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(15,15,35,0.9)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 24px'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', height: 64, gap: 32 }}>
        {/* Logo */}
        <Link to={isAdmin ? '/admin' : '/dashboard'} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #6C63FF, #06D6A0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
          <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 16, color: '#fff' }}>AI<span style={{ color: '#6C63FF' }}>Interview</span></span>
        </Link>

        {/* Nav links - desktop */}
        <div style={{ display: 'flex', gap: 4, flex: 1 }} className="hide-mobile">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} style={{
              padding: '8px 16px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 500,
              color: location.pathname === l.to ? '#6C63FF' : '#94A3B8',
              background: location.pathname === l.to ? 'rgba(108,99,255,0.1)' : 'transparent'
            }}>{l.label}</Link>
          ))}
        </div>

        {/* User area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
          {user?.photo && (
            <img src={`http://localhost:5000${user.photo}`} alt={user.name}
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #6C63FF' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }} className="hide-mobile">
            <span style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0' }}>{user?.name}</span>
            <span style={{ fontSize: 11, color: '#6C63FF', textTransform: 'uppercase', letterSpacing: 0.5 }}>{user?.role}</span>
          </div>
          <button onClick={handleLogout} className="btn btn-outline btn-sm" style={{ marginLeft: 8 }}>Logout</button>
        </div>
      </div>

      <style>{`.hide-mobile { } @media(max-width:768px){ .hide-mobile{display:none!important} }`}</style>
    </nav>
  );
};

export default Navbar;
