import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { register } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const photoRef = useRef();
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image too large (max 5MB)'); return; }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!photo) { setError('📷 Profile photo is required for identity verification'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }

    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('email', form.email);
    formData.append('password', form.password);
    formData.append('phone', form.phone);
    formData.append('photo', photo);

    setLoading(true);
    try {
      const res = await register(formData);
      loginUser(res.data.token, res.data.user);
      toast.success('Registration successful! Welcome! 🎉');
      navigate('/jobs');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 500 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #6C63FF, #06D6A0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 16px' }}>🤖</div>
          <h1 style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800, color: '#fff' }}>Create Account</h1>
          <p style={{ color: '#64748B', fontSize: 14, marginTop: 8 }}>Join AI Interview Screening System</p>
        </div>

        <div className="glass-card">
          {error && <div className="alert alert-error">{error}</div>}

          {/* Photo Upload - Prominent */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div
              onClick={() => photoRef.current.click()}
              style={{
                width: 120, height: 120, borderRadius: '50%', margin: '0 auto 12px',
                border: photoPreview ? '3px solid #06D6A0' : '2px dashed rgba(108,99,255,0.5)',
                cursor: 'pointer', overflow: 'hidden', position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: photoPreview ? 'transparent' : 'rgba(108,99,255,0.05)',
                transition: 'all 0.2s'
              }}>
              {photoPreview
                ? <img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ textAlign: 'center' }}><div style={{ fontSize: 32 }}>📷</div><div style={{ fontSize: 11, color: '#6C63FF', marginTop: 4 }}>Add Photo</div></div>
              }
            </div>
            <input type="file" ref={photoRef} accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
            <div style={{ fontSize: 13, color: '#94A3B8' }}>
              {photoPreview ? '✅ Photo ready for verification' : '⚠️ Profile photo required for identity verification'}
            </div>
            {!photoPreview && (
              <button onClick={() => photoRef.current.click()} className="btn btn-outline btn-sm" style={{ marginTop: 8 }}>
                Upload Photo
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Your full name" required />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone (optional)</label>
              <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+91 9876543210" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Min. 6 characters" required />
            </div>

            <div style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 13, color: '#A5B4FC' }}>
              🔒 Your photo is used for identity verification during the interview process. It will never be shared publicly.
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? '⏳ Creating Account...' : '🚀 Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748B' }}>
            Already have an account? <Link to="/login" style={{ color: '#6C63FF', textDecoration: 'none' }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
