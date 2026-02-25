import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import { Login, Register } from './pages/Auth';
import CandidateDashboard from './pages/CandidateDashboard';
import Jobs from './pages/Jobs';
import Apply from './pages/Apply';
import Test from './pages/Test';
import Interview from './pages/Interview';
import Result from './pages/Result';
import AdminDashboard from './pages/AdminDashboard';
import AdminJobs from './pages/AdminJobs';
import AdminTest from './pages/AdminTest';
import AdminReport from './pages/AdminReport';
import AdminCandidates from './pages/AdminCandidates';
import './index.css';

function PrivateRoute({ children, adminOnly }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6366f1', fontFamily: 'Syne, sans-serif', fontSize: '1.1rem' }}>Loading...</div>;
  if (!user) return <Navigate to="/login"/>;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard"/>;
  if (!adminOnly && user.role === 'admin') return <Navigate to="/admin"/>;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'}/>;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing/>}/>
          <Route path="/login" element={<PublicRoute><Login/></PublicRoute>}/>
          <Route path="/register" element={<PublicRoute><Register/></PublicRoute>}/>

          {/* Candidate routes */}
          <Route path="/dashboard" element={<PrivateRoute><CandidateDashboard/></PrivateRoute>}/>
          <Route path="/jobs" element={<PrivateRoute><Jobs/></PrivateRoute>}/>
          <Route path="/apply/:jobId" element={<PrivateRoute><Apply/></PrivateRoute>}/>
          <Route path="/test/:appId" element={<PrivateRoute><Test/></PrivateRoute>}/>
          <Route path="/interview/:appId" element={<PrivateRoute><Interview/></PrivateRoute>}/>
          <Route path="/result/:appId" element={<PrivateRoute><Result/></PrivateRoute>}/>

          {/* Admin routes */}
          <Route path="/admin" element={<PrivateRoute adminOnly><AdminDashboard/></PrivateRoute>}/>
          <Route path="/admin/jobs" element={<PrivateRoute adminOnly><AdminJobs/></PrivateRoute>}/>
          <Route path="/admin/test/:jobId" element={<PrivateRoute adminOnly><AdminTest/></PrivateRoute>}/>
          <Route path="/admin/report/:jobId" element={<PrivateRoute adminOnly><AdminReport/></PrivateRoute>}/>
          <Route path="/admin/candidates" element={<PrivateRoute adminOnly><AdminCandidates/></PrivateRoute>}/>

          <Route path="*" element={<Navigate to="/"/>}/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
