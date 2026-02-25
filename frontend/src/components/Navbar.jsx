import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Brain, LayoutDashboard, Briefcase, LogOut, Menu, X, 
  Users, BarChart3, ChevronDown
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';
  const navLinks = isAdmin ? [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/jobs', icon: Briefcase, label: 'Jobs' },
  ] : [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/jobs', icon: Briefcase, label: 'Browse Jobs' },
  ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">HireIQ</span>
            {isAdmin && (
              <span className="badge bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 ml-1">Admin</span>
            )}
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  location.pathname === to
                    ? 'bg-indigo-600/20 text-indigo-300'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <span className="text-sm text-slate-300">{user?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-400"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 py-3 px-4 space-y-1">
          {navLinks.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
