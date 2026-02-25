import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowLeft, Download, Users, TrendingUp, Award, CheckCircle } from 'lucide-react';

const COLORS = ['#6366f1', '#06b6d4', '#22c55e', '#eab308'];

export default function AdminReport() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`/api/jobs/${jobId}`),
      axios.get(`/api/reports/rankings/${jobId}`)
    ]).then(([j, r]) => {
      setJob(j.data);
      setRankings(r.data);
      setLoading(false);
    });
  }, [jobId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const completed = rankings.filter(r => r.status === 'interview_completed');
  const avgFinal = completed.length > 0 ? Math.round(completed.reduce((s, r) => s + r.final_score, 0) / completed.length) : 0;
  const top3 = rankings.slice(0, 3);

  const barData = rankings.slice(0, 10).map(r => ({
    name: r.candidate_name?.split(' ')[0],
    resume: r.resume_score,
    test: r.test_score,
    interview: r.interview_score,
    final: r.final_score
  }));

  const gradeData = ['A', 'B', 'C', 'D'].map(g => ({
    name: `Grade ${g}`,
    value: rankings.filter(r => r.grade === g).length
  })).filter(d => d.value > 0);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/admin/jobs')} className="btn-secondary p-2">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Recruitment Report</h1>
            {job && <p className="text-slate-400 text-sm">{job.title}</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Applicants', value: rankings.length, icon: Users, color: 'text-blue-400' },
            { label: 'Interviews Done', value: completed.length, icon: CheckCircle, color: 'text-green-400' },
            { label: 'Avg Final Score', value: `${avgFinal}%`, icon: TrendingUp, color: 'text-indigo-400' },
            { label: 'Top Score', value: `${rankings[0]?.final_score || 0}%`, icon: Award, color: 'text-yellow-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass-card p-5">
              <Icon className={`w-6 h-6 ${color} mb-3`} />
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-sm text-slate-400">{label}</div>
            </div>
          ))}
        </div>

        {/* Top 3 */}
        {top3.length > 0 && (
          <div className="glass-card p-6 mb-6">
            <h2 className="font-semibold text-white mb-5">🏆 Top Candidates</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {top3.map((c, idx) => (
                <div key={c.application_id} className={`p-4 rounded-xl border ${idx === 0 ? 'border-yellow-500/30 bg-yellow-500/5' : idx === 1 ? 'border-slate-500/30 bg-slate-500/5' : 'border-amber-600/30 bg-amber-600/5'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                    <div>
                      <p className="font-semibold text-white">{c.candidate_name}</p>
                      <p className="text-xs text-slate-400">{c.email}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { label: 'Resume', val: c.resume_score },
                      { label: 'Test', val: c.test_score },
                      { label: 'Interview', val: c.interview_score },
                    ].map(({ label, val }) => (
                      <div key={label} className="flex justify-between text-xs">
                        <span className="text-slate-400">{label}</span>
                        <span className="text-slate-300">{val}%</span>
                      </div>
                    ))}
                    <div className="pt-1.5 border-t border-white/10 flex justify-between text-sm font-medium">
                      <span className="text-slate-300">Final</span>
                      <span className="text-indigo-400">{c.final_score}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts */}
        {barData.length > 0 && (
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 glass-card p-6">
              <h2 className="font-semibold text-white mb-5">Score Comparison (Top 10)</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData} barSize={6} barGap={2}>
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
                  <Bar dataKey="resume" name="Resume" fill="#6366f1" radius={3} />
                  <Bar dataKey="test" name="Test" fill="#eab308" radius={3} />
                  <Bar dataKey="interview" name="Interview" fill="#22c55e" radius={3} />
                  <Bar dataKey="final" name="Final" fill="#06b6d4" radius={3} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {gradeData.length > 0 && (
              <div className="glass-card p-6">
                <h2 className="font-semibold text-white mb-5">Grade Distribution</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={gradeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {gradeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {gradeData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                      {d.name}: {d.value}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full Rankings Table */}
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="font-semibold text-white">Complete Rankings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-white/10">
                  <th className="text-left px-6 py-3">Rank</th>
                  <th className="text-left px-6 py-3">Candidate</th>
                  <th className="text-center px-4 py-3">Resume</th>
                  <th className="text-center px-4 py-3">Test</th>
                  <th className="text-center px-4 py-3">Interview</th>
                  <th className="text-center px-4 py-3">Final</th>
                  <th className="text-center px-4 py-3">Grade</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((c) => (
                  <tr key={c.application_id} className="border-b border-white/5 hover:bg-white/2">
                    <td className="px-6 py-3">
                      <span className={`font-bold ${c.rank <= 3 ? 'text-yellow-400' : 'text-slate-500'}`}>#{c.rank}</span>
                    </td>
                    <td className="px-6 py-3">
                      <p className="text-white font-medium text-sm">{c.candidate_name}</p>
                      <p className="text-slate-500 text-xs">{c.email}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-300">{c.resume_score}%</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-300">{c.test_score}%</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-300">{c.interview_score}%</td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-indigo-400">{c.final_score}%</td>
                    <td className="px-4 py-3 text-center font-bold">{c.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
