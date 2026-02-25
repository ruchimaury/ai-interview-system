import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import { ArrowLeft, Users, Award, BarChart3, Mail, ChevronRight } from 'lucide-react';

export default function AdminCandidates() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`/api/jobs/${jobId}`),
      axios.get(`/api/reports/rankings/${jobId}`)
    ]).then(([j, c]) => {
      setJob(j.data);
      setCandidates(c.data);
      setLoading(false);
    });
  }, [jobId]);

  const statusBadge = {
    applied: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    test_completed: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    interview_completed: 'bg-green-500/10 text-green-400 border-green-500/20',
  };

  const gradeColors = { A: 'text-green-400', B: 'text-blue-400', C: 'text-yellow-400', D: 'text-red-400' };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/admin/jobs')} className="btn-secondary p-2">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Candidates</h1>
            {job && <p className="text-slate-400 text-sm">{job.title} — {candidates.length} applicants</p>}
          </div>
          <Link to={`/admin/report/${jobId}`} className="btn-primary ml-auto flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> View Report
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : candidates.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">No applicants yet</h3>
            <p className="text-slate-500">Share the job link with candidates</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/10 text-xs text-slate-500 font-medium uppercase tracking-wider">
              <div className="col-span-1">Rank</div>
              <div className="col-span-3">Candidate</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1 text-center">Resume</div>
              <div className="col-span-1 text-center">Test</div>
              <div className="col-span-1 text-center">Interview</div>
              <div className="col-span-1 text-center">Final</div>
              <div className="col-span-2 text-center">Grade</div>
            </div>
            
            {candidates.map((c) => (
              <div key={c.application_id} className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/2 items-center ${c.rank <= 3 ? 'bg-indigo-500/3' : ''}`}>
                <div className="col-span-1">
                  <span className={`text-sm font-bold ${c.rank === 1 ? 'text-yellow-400' : c.rank === 2 ? 'text-slate-400' : c.rank === 3 ? 'text-amber-600' : 'text-slate-500'}`}>
                    #{c.rank}
                  </span>
                </div>
                <div className="col-span-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                      {c.candidate_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{c.candidate_name}</p>
                      <p className="text-slate-500 text-xs flex items-center gap-1">
                        <Mail className="w-3 h-3" />{c.email}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className={`badge border text-xs ${statusBadge[c.status] || statusBadge.applied}`}>
                    {c.status?.replace('_', ' ')}
                  </span>
                </div>
                <div className="col-span-1 text-center">
                  <span className="text-sm text-slate-300">{c.resume_score || 0}%</span>
                </div>
                <div className="col-span-1 text-center">
                  <span className="text-sm text-slate-300">{c.test_score || 0}%</span>
                </div>
                <div className="col-span-1 text-center">
                  <span className="text-sm text-slate-300">{c.interview_score || 0}%</span>
                </div>
                <div className="col-span-1 text-center">
                  <span className="text-sm font-semibold text-indigo-400">{c.final_score || 0}%</span>
                </div>
                <div className="col-span-2 text-center">
                  <span className={`text-lg font-bold ${gradeColors[c.grade] || 'text-slate-400'}`}>{c.grade || 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
