import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { Briefcase, CheckCircle, Clock, Award, ArrowRight, FileText, Mic, ClipboardList } from 'lucide-react';

const statusConfig = {
  applied: { label: 'Resume Submitted', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', icon: FileText },
  test_completed: { label: 'Test Done', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', icon: ClipboardList },
  interview_completed: { label: 'Interview Done', color: 'text-green-400 bg-green-400/10 border-green-400/20', icon: Mic },
};

function ScoreBar({ label, value, color = 'bg-indigo-500' }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 font-medium">{value}%</span>
      </div>
      <div className="progress-bar">
        <div className={`progress-fill ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/applications/my').then(r => {
      setApplications(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const completed = applications.filter(a => a.status === 'interview_completed').length;
  const inProgress = applications.filter(a => a.status !== 'interview_completed').length;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8 animate-in">
          <h1 className="text-2xl font-bold text-white">
            Welcome back, <span className="text-indigo-400">{user?.name}</span> 👋
          </h1>
          <p className="text-slate-400 mt-1">Track your applications and complete your assessments</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Applied', value: applications.length, icon: Briefcase, color: 'text-blue-400' },
            { label: 'In Progress', value: inProgress, icon: Clock, color: 'text-yellow-400' },
            { label: 'Completed', value: completed, icon: CheckCircle, color: 'text-green-400' },
            { label: 'Best Score', value: Math.max(0, ...applications.map(a => a.final_score || 0)) + '%', icon: Award, color: 'text-indigo-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass-card p-5 animate-in">
              <Icon className={`w-6 h-6 ${color} mb-3`} />
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-sm text-slate-400">{label}</div>
            </div>
          ))}
        </div>

        {/* Applications */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">My Applications</h2>
          <Link to="/jobs" className="btn-primary text-sm py-2 flex items-center gap-2">
            Browse Jobs <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : applications.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">No applications yet</h3>
            <p className="text-slate-500 mb-6">Browse available jobs and apply with your resume</p>
            <Link to="/jobs" className="btn-primary">Browse Jobs</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const cfg = statusConfig[app.status] || statusConfig.applied;
              const StatusIcon = cfg.icon;
              const hasTest = app.test_id;
              const testDone = app.test_score > 0;
              const interviewDone = app.status === 'interview_completed';

              return (
                <div key={app.id} className="glass-card p-6 animate-in">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white text-lg">{app.job_title}</h3>
                        <span className={`badge border ${cfg.color} flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </div>

                      {/* Score bars */}
                      {(app.resume_score > 0 || app.test_score > 0 || app.interview_score > 0) && (
                        <div className="mt-4 space-y-2.5 max-w-sm">
                          {app.resume_score > 0 && <ScoreBar label="Resume Match" value={app.resume_score} color="bg-blue-500" />}
                          {app.test_score > 0 && <ScoreBar label="Test Score" value={app.test_score} color="bg-yellow-500" />}
                          {app.interview_score > 0 && <ScoreBar label="Interview" value={app.interview_score} color="bg-green-500" />}
                          {app.final_score > 0 && (
                            <div className="pt-2 border-t border-white/10">
                              <ScoreBar label="Final Score" value={app.final_score} color="bg-indigo-500" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 min-w-[160px]">
                      {/* Action buttons based on status */}
                      {hasTest && !testDone && (
                        <Link to={`/test/${app.id}`} className="btn-primary text-sm py-2 text-center flex items-center justify-center gap-2">
                          <ClipboardList className="w-4 h-4" />
                          Take Test
                        </Link>
                      )}
                      {testDone && !interviewDone && (
                        <Link to={`/interview/${app.id}`} className="btn-primary text-sm py-2 text-center flex items-center justify-center gap-2">
                          <Mic className="w-4 h-4" />
                          Start Interview
                        </Link>
                      )}
                      {interviewDone && (
                        <Link to={`/result/${app.id}`} className="btn-secondary text-sm py-2 text-center flex items-center justify-center gap-2">
                          <Award className="w-4 h-4" />
                          View Results
                        </Link>
                      )}
                      {!hasTest && !testDone && (
                        <span className="text-xs text-slate-500 text-center mt-2">Waiting for test setup</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
