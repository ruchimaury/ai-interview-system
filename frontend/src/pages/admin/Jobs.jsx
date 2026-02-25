import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import { Plus, Briefcase, Users, ClipboardList, BarChart3, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadJobs = () => {
    axios.get('/api/jobs/all').then(r => { setJobs(r.data); setLoading(false); });
  };

  useEffect(loadJobs, []);

  const toggleJob = async (job) => {
    await axios.put(`/api/jobs/${job.id}`, {
      ...job,
      is_active: !job.is_active,
      required_skills: job.required_skills
    });
    loadJobs();
  };

  const deleteJob = async (id) => {
    if (!confirm('Delete this job?')) return;
    await axios.delete(`/api/jobs/${id}`);
    loadJobs();
  };

  const generateTest = async (jobId) => {
    try {
      await axios.post(`/api/tests/generate-sample/${jobId}`);
      alert('Sample test created!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create test');
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Job Postings</h1>
            <p className="text-slate-400 mt-1">Manage all job listings and their assessments</p>
          </div>
          <Link to="/admin/jobs/create" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Job
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : jobs.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">No jobs yet</h3>
            <Link to="/admin/jobs/create" className="btn-primary mt-2">Create First Job</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <div key={job.id} className="glass-card p-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-white text-lg">{job.title}</h3>
                      <span className={`badge border text-xs ${job.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                        {job.is_active ? 'Active' : 'Closed'}
                      </span>
                      <span className="badge bg-slate-800 text-slate-400 border border-slate-700 text-xs">{job.experience_level}</span>
                    </div>

                    {job.description && (
                      <p className="text-slate-400 text-sm mb-3 line-clamp-1">{job.description}</p>
                    )}

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {job.required_skills.map(s => (
                        <span key={s} className="badge bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs">{s}</span>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{job.applicant_count || 0} applicants</span>
                      <span>Created {new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link to={`/admin/candidates/${job.id}`} className="btn-secondary text-xs py-1.5 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Candidates
                    </Link>
                    <Link to={`/admin/report/${job.id}`} className="btn-secondary text-xs py-1.5 flex items-center gap-1">
                      <BarChart3 className="w-3.5 h-3.5" /> Report
                    </Link>
                    <button onClick={() => generateTest(job.id)} className="btn-secondary text-xs py-1.5 flex items-center gap-1">
                      <ClipboardList className="w-3.5 h-3.5" /> Add Test
                    </button>
                    <Link to={`/admin/tests/create/${job.id}`} className="btn-secondary text-xs py-1.5 flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> Custom Test
                    </Link>
                    <button onClick={() => toggleJob(job)} className="btn-secondary text-xs py-1.5 flex items-center gap-1">
                      {job.is_active ? <ToggleRight className="w-3.5 h-3.5 text-green-400" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                      {job.is_active ? 'Close' : 'Open'}
                    </button>
                    <button onClick={() => deleteJob(job.id)} className="btn-danger text-xs py-1.5 flex items-center gap-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
