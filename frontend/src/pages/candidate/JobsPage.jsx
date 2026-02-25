import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import { Briefcase, Search, ChevronRight, Users, Tag } from 'lucide-react';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/jobs').then(r => {
      setJobs(r.data);
      setFiltered(r.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(jobs.filter(j =>
      j.title.toLowerCase().includes(q) ||
      j.required_skills.some(s => s.toLowerCase().includes(q)) ||
      (j.description || '').toLowerCase().includes(q)
    ));
  }, [search, jobs]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Available Jobs</h1>
          <p className="text-slate-400">Find your perfect role and start your AI-powered application</p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            className="input pl-12"
            placeholder="Search jobs by title or skill..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">No jobs found</h3>
            <p className="text-slate-500">Try a different search term</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(job => (
              <div key={job.id} className="glass-card p-6 hover:border-indigo-500/30 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-indigo-400" />
                  </div>
                  <span className="badge bg-green-500/10 text-green-400 border border-green-500/20">Active</span>
                </div>

                <h3 className="font-semibold text-white text-lg mb-2">{job.title}</h3>
                
                {job.description && (
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">{job.description}</p>
                )}

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {job.required_skills.slice(0, 4).map(skill => (
                    <span key={skill} className="badge bg-slate-800 text-slate-300 border border-slate-700">
                      {skill}
                    </span>
                  ))}
                  {job.required_skills.length > 4 && (
                    <span className="badge bg-slate-800 text-slate-500 border border-slate-700">+{job.required_skills.length - 4}</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {job.experience_level}
                  </span>
                  <Link
                    to={`/apply/${job.id}`}
                    className="btn-primary text-sm py-2 flex items-center gap-1"
                  >
                    Apply Now <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
