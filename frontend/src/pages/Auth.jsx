import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AuthForm({ mode }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      let user;
      if (mode === 'login') {
        user = await login(form.email, form.password);
      } else {
        user = await register(form.name, form.email, form.password);
      }
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '2rem' }}>
      <div className="orb" style={{ width: 400, height: 400, background: '#6366f1', top: -80, right: -80 }}/>
      <div className="orb" style={{ width: 300, height: 300, background: '#a855f7', bottom: -60, left: -60, animationDelay: '4s' }}/>

      <div className="glass fade-in" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, borderRadius: 24, padding: '2.5rem' }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#6366f1,#a855f7)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.4rem' }}>🤖</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.3rem' }}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p style={{ color: '#666678', fontSize: '0.9rem' }}>AI Interview Screening System</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem', color: '#f87171', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#888898' }}>Full Name</label>
              <input className="input-field" placeholder="John Doe" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}/>
            </div>
          )}
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#888898' }}>Email</label>
            <input className="input-field" type="email" placeholder="you@example.com" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}/>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#888898' }}>Password</label>
            <input className="input-field" type="password" placeholder="••••••••" required value={form.password} onChange={e => setForm({...form, password: e.target.value})}/>
          </div>

          <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.9rem' }}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#666678', fontSize: '0.9rem' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <Link to={mode === 'login' ? '/register' : '/login'} style={{ color: '#a5a8ff', textDecoration: 'none', fontWeight: 600 }}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </Link>
        </p>

        {mode === 'login' && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(99,102,241,0.08)', borderRadius: 10, fontSize: '0.82rem', color: '#666678', textAlign: 'center' }}>

          </div>
        )}
      </div>
    </div>
  );
}

export function Login() { return <AuthForm mode="login"/>; }
export function Register() { return <AuthForm mode="register"/>; }
