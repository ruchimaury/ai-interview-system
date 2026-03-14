import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CandidateDashboard from './pages/CandidateDashboard';
import JobsPage from './pages/JobsPage';
import ApplicationFlow from './pages/ApplicationFlow';
import AdminDashboard from './pages/AdminDashboard';
import AdminJobs from './pages/AdminJobs';
import AdminTests from './pages/AdminTests';
import AdminApplications from './pages/AdminApplications';
import AdminCandidateReport from './pages/AdminCandidateReport';
import AdminRankings from './pages/AdminRankings';

const ProtectedRoute = ({ children, adminRequired }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0F0F23' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (adminRequired && user.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      
      {/* Candidate Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><CandidateDashboard /></ProtectedRoute>} />
      <Route path="/jobs" element={<ProtectedRoute><JobsPage /></ProtectedRoute>} />
      <Route path="/apply/:jobId" element={<ProtectedRoute><ApplicationFlow /></ProtectedRoute>} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute adminRequired><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/jobs" element={<ProtectedRoute adminRequired><AdminJobs /></ProtectedRoute>} />
      <Route path="/admin/tests" element={<ProtectedRoute adminRequired><AdminTests /></ProtectedRoute>} />
      <Route path="/admin/applications" element={<ProtectedRoute adminRequired><AdminApplications /></ProtectedRoute>} />
      <Route path="/admin/applications/:id" element={<ProtectedRoute adminRequired><AdminCandidateReport /></ProtectedRoute>} />
      <Route path="/admin/rankings/:jobId" element={<ProtectedRoute adminRequired><AdminRankings /></ProtectedRoute>} />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="bg-gradient">
          <AppRoutes />
          <ToastContainer
            position="top-right" autoClose={4000}
            toastStyle={{ background: '#1A1A35', color: '#E2E8F0', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}
