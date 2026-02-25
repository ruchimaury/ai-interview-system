import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import { Plus, X, ArrowLeft, Briefcase } from 'lucide-react';

export default function AdminCreateJob() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    experience_level: 'junior',
    required_skills: []
  });
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.required_skills.includes(s)) {
      setForm({ ...form, required_skills: [...form.required_skills, s] });
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    setForm({ ...form, required_skills: form.required_skills.filter(s => s !== skill) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.required_skills.length === 0) return setError('Add at least one required skill');
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/jobs', form);
      navigate('/admin/jobs');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create job');
      setLoading(false);
    }
  };

  const suggestedSkills = ['JavaScript', 'Python', 'React', 'Node.js', 'Java', 'SQL', 'TypeScript', 'MongoDB', 'AWS', 'Docker', 'CSS', 'Git', 'REST API', 'Machine Learning'];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/admin/jobs')} className="btn-secondary p-2">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Create Job Posting</h1>
            <p className="text-slate-400 text-sm">Add a new position for candidates to apply</p>
          </div>
        </div>

        <div className="glass-card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
            )}

            <div>
              <label className="label">Job Title *</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Senior React Developer"
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="label">Job Description</label>
              <textarea
                rows={4}
                className="input resize-none"
                placeholder="Describe the role, responsibilities, and company..."
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
              />
            </div>

            <div>
              <label className="label">Experience Level</label>
              <div className="grid grid-cols-3 gap-3">
                {['junior', 'mid', 'senior'].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setForm({...form, experience_level: level})}
                    className={`py-2.5 px-4 rounded-xl border text-sm font-medium capitalize transition-all ${
                      form.experience_level === level
                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                        : 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Required Skills *</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="Type a skill and press Enter"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                />
                <button type="button" onClick={addSkill} className="btn-secondary px-4">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Selected skills */}
              {form.required_skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {form.required_skills.map(skill => (
                    <span key={skill} className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-sm">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)}>
                        <X className="w-3 h-3 hover:text-red-400" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Suggested skills */}
              <div>
                <p className="text-xs text-slate-500 mb-2">Quick add:</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedSkills.filter(s => !form.required_skills.includes(s)).map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => setForm({...form, required_skills: [...form.required_skills, skill]})}
                      className="badge bg-slate-800 text-slate-400 border border-slate-700 hover:border-indigo-500/50 hover:text-indigo-300 text-xs cursor-pointer transition-all"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</>
              ) : (
                <><Briefcase className="w-4 h-4" /> Create Job Posting</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
