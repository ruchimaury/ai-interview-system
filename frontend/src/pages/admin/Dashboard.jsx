import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import { Briefcase, Users, BarChart3, CheckCircle, TrendingUp, Plus, ChevronRight, Clock } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('/api/reports/stats'),
      axios.get('/api/reports/activity'),
    ]).then(([s, a]) => {
      setStats(s.data);
      setActivity(a.data);
      setLoading(false);
    });
  }, []);

  const statusBadge = {
    applied: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    test_completed: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
    interview_completed: 'bg-green-500/10 text-green-300 border-green-500/20',
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-slate-400 mt-1">Monitor your recruitment pipeline</p>
          </div>
          <Link to="/admin/jobs/create" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Job
          </Link>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="text-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Total Jobs', value: stats?.totalJobs, icon: Briefcase, color: 'text-blue-400', sub: `${stats?.activeJobs} active` },
                { label: 'Total Candidates', value: stats?.totalCandidates, icon: Users, color: 'text-purple-400', sub: 'registered' },
                { label: 'Applications', value: stats?.totalApplications, icon: BarChart3, color: 'text-yellow-400', sub: 'received' },
                { label: 'Interviews Done', value: stats?.completedInterviews, icon: CheckCircle, color: 'text-green-400', sub: 'completed' },
                { label: 'Avg Final Score', value: `${stats?.avgFinalScore}%`, icon: TrendingUp, color: 'text-indigo-400', sub: 'across all' },
                { label: 'Active Jobs', value: stats?.activeJobs, icon: Briefcase, color: 'text-cyan-400', sub: 'accepting apps' },
              ].map(({ label, value, icon: Icon, color, sub }) => (
                <div key={label} className="glass-card p-5 animate-in">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-slate-400 text-sm mb-1">{label}</p>
                      <p className="text-2xl font-bold text-white">{value}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                { to: '/admin/jobs/create', label: 'Create New Job', icon: Plus, desc: 'Post a new position' },
                { to: '/admin/jobs', label: 'Manage Jobs', icon: Briefcase, desc: 'View all job postings' },
              ].map(({ to, label, icon: Icon, desc }) => (
                <Link key={to} to={to} className="glass-card p-5 hover:border-indigo-500/30 transition-all flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{label}</p>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 ml-auto" />
                </Link>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="glass-card p-6">
              <h2 className="font-semibold text-white mb-5">Recent Applications</h2>
              {activity.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">No applications yet</p>
              ) : (
                <div className="space-y-3">
                  {activity.map(item => (
                    <div key={item.id} className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0">
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-sm font-bold text-indigo-400">
                        {item.candidate_name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{item.candidate_name}</p>
                        <p className="text-slate-500 text-xs truncate">Applied for {item.job_title}</p>
                      </div>
                      <div className="text-right">
                        <span className={`badge border text-xs ${statusBadge[item.status] || statusBadge.applied}`}>
                          {item.status?.replace('_', ' ')}
                        </span>
                        {item.final_score > 0 && (
                          <p className="text-xs text-indigo-400 mt-1 font-medium">{item.final_score}%</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
