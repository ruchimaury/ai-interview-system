import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import { Upload, FileText, CheckCircle, AlertCircle, ArrowRight, Briefcase } from 'lucide-react';

export default function ApplyPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    axios.get(`/api/jobs/${jobId}`).then(r => setJob(r.data)).catch(() => navigate('/jobs'));
  }, [jobId]);

  const handleFile = (f) => {
    if (f && (f.type === 'application/pdf' || f.name.endsWith('.pdf'))) {
      setFile(f);
      setError('');
    } else {
      setError('Please upload a PDF file');
    }
  };

  const handleSubmit = async () => {
    if (!file) return setError('Please select your resume');
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('job_id', jobId);
      const res = await axios.post('/api/applications/apply', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (!job) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Job Info */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="font-bold text-white text-xl">{job.title}</h1>
              <p className="text-slate-400 text-sm">{job.experience_level} level</p>
            </div>
          </div>
          {job.description && <p className="text-slate-400 text-sm mb-4">{job.description}</p>}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-slate-500 mr-1">Required skills:</span>
            {job.required_skills.map(s => (
              <span key={s} className="badge bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs">{s}</span>
            ))}
          </div>
        </div>

        {result ? (
          /* Success State */
          <div className="glass-card p-8 text-center animate-in">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Application Submitted!</h2>
            <p className="text-slate-400 mb-6">AI has analyzed your resume</p>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="glass p-4 rounded-xl">
                <div className="text-2xl font-bold text-indigo-400">{result.resume_score}%</div>
                <div className="text-xs text-slate-400 mt-1">Resume Match</div>
              </div>
              <div className="glass p-4 rounded-xl">
                <div className="text-2xl font-bold text-blue-400">{result.extracted_skills?.length || 0}</div>
                <div className="text-xs text-slate-400 mt-1">Skills Found</div>
              </div>
              <div className="glass p-4 rounded-xl">
                <div className="text-2xl font-bold text-green-400">{result.matched_skills?.length || 0}</div>
                <div className="text-xs text-slate-400 mt-1">Matched</div>
              </div>
            </div>

            {result.matched_skills?.length > 0 && (
              <div className="mb-6 text-left">
                <p className="text-xs text-slate-500 mb-2">Matched Skills:</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.matched_skills.map(s => (
                    <span key={s} className="badge bg-green-500/10 text-green-400 border border-green-500/20">{s}</span>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => navigate('/dashboard')} className="btn-primary w-full flex items-center justify-center gap-2">
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Upload State */
          <div className="glass-card p-8">
            <h2 className="text-lg font-semibold text-white mb-1">Upload Your Resume</h2>
            <p className="text-slate-400 text-sm mb-6">PDF format only. AI will extract and match your skills.</p>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
                dragging ? 'border-indigo-500 bg-indigo-500/10' : 
                file ? 'border-green-500/50 bg-green-500/5' : 
                'border-slate-600 hover:border-indigo-500/50 hover:bg-indigo-500/5'
              }`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => document.getElementById('resumeInput').click()}
            >
              <input
                id="resumeInput"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={e => handleFile(e.target.files[0])}
              />
              {file ? (
                <>
                  <FileText className="w-10 h-10 text-green-400 mx-auto mb-3" />
                  <p className="text-green-400 font-medium">{file.name}</p>
                  <p className="text-slate-500 text-sm mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-300 font-medium">Drop your resume here</p>
                  <p className="text-slate-500 text-sm mt-1">or click to browse</p>
                  <p className="text-slate-600 text-xs mt-3">PDF only, max 5MB</p>
                </>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!file || loading}
              className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing Resume...
                </>
              ) : (
                <>Submit Application <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
