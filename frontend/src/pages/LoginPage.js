import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { login } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(form);
      loginUser(res.data.token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.name}! 👋`);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #6C63FF, #06D6A0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 16px' }}>🤖</div>
          <h1 style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800, color: '#fff' }}>Welcome Back</h1>
          <p style={{ color: '#64748B', fontSize: 14, marginTop: 8 }}>Sign in to your account</p>
        </div>

        <div className="glass-card">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Your password" required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
              {loading ? '⏳ Signing in...' : '🔑 Sign In'}
            </button>
          </form>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '20px 0', paddingTop: 20 }}>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>Admin? Use your admin credentials to access HR dashboard.</p>
          </div>

          <p style={{ textAlign: 'center', fontSize: 14, color: '#64748B' }}>
            New candidate? <Link to="/register" style={{ color: '#6C63FF', textDecoration: 'none' }}>Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
