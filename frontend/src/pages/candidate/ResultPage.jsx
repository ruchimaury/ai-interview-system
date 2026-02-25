import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import { Award, FileText, ClipboardList, Mic, TrendingUp, Home } from 'lucide-react';

function ScoreCircle({ value, label, color }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={radius} fill="none"
            stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-white">{value}%</span>
        </div>
      </div>
      <span className="text-xs text-slate-400 mt-2">{label}</span>
    </div>
  );
}

export default function ResultPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [appRes, intRes] = await Promise.all([
          axios.get(`/api/applications/${applicationId}`),
          axios.get(`/api/interviews/result/${applicationId}`)
        ]);
        setApp(appRes.data);
        setInterview(intRes.data);
      } catch {}
      setLoading(false);
    };
    load();
  }, [applicationId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const grade = app?.final_score >= 80 ? 'A' : app?.final_score >= 60 ? 'B' : app?.final_score >= 40 ? 'C' : 'D';
  const gradeColor = { A: 'text-green-400 bg-green-400/10', B: 'text-blue-400 bg-blue-400/10', C: 'text-yellow-400 bg-yellow-400/10', D: 'text-red-400 bg-red-400/10' };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-1">Your Results</h1>
          <p className="text-slate-400">{app?.job_title}</p>
        </div>

        {/* Final Score */}
        <div className="glass-card p-8 mb-6 text-center animate-in">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Award className="w-8 h-8 text-indigo-400" />
            <div>
              <div className="text-5xl font-bold text-white">{app?.final_score || 0}%</div>
              <div className="text-slate-400 text-sm">Final Score</div>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${gradeColor[grade]}`}>
              {grade}
            </div>
          </div>
          <p className="text-slate-400 text-sm">
            {grade === 'A' ? 'Excellent! You are a top candidate.' :
             grade === 'B' ? 'Good performance! Strong candidate.' :
             grade === 'C' ? 'Average performance. Keep improving.' :
             'Needs improvement. Don\'t give up!'}
          </p>
        </div>

        {/* Score breakdown */}
        <div className="glass-card p-6 mb-6 animate-in stagger-1">
          <h2 className="font-semibold text-white mb-6">Score Breakdown</h2>
          <div className="flex justify-around">
            <ScoreCircle value={app?.resume_score || 0} label="Resume" color="#6366f1" />
            <ScoreCircle value={app?.test_score || 0} label="Test" color="#eab308" />
            <ScoreCircle value={app?.interview_score || 0} label="Interview" color="#22c55e" />
          </div>
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">Weighted Final Score</span>
              <span className="text-indigo-400 font-semibold">{app?.final_score}%</span>
            </div>
            <div className="text-xs text-slate-600">Resume 30% + Test 40% + Interview 30%</div>
          </div>
        </div>

        {/* Interview details */}
        {interview && (
          <div className="glass-card p-6 mb-6 animate-in stagger-2">
            <h2 className="font-semibold text-white mb-4">Interview Analysis</h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Confidence', value: interview.confidence_score },
                { label: 'Communication', value: interview.communication_score },
                { label: 'Relevance', value: interview.relevance_score },
              ].map(({ label, value }) => (
                <div key={label} className="glass p-3 rounded-xl text-center">
                  <div className="text-xl font-bold text-white">{value}%</div>
                  <div className="text-xs text-slate-400 mt-1">{label}</div>
                </div>
              ))}
            </div>
            
            {interview.emotions && (
              <div>
                <h3 className="text-sm text-slate-400 mb-3">Emotion Profile</h3>
                <div className="space-y-2">
                  {Object.entries(interview.emotions).map(([emotion, val]) => (
                    <div key={emotion} className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 capitalize w-20">{emotion}</span>
                      <div className="flex-1 progress-bar">
                        <div className="progress-fill bg-indigo-500" style={{ width: `${val}%` }} />
                      </div>
                      <span className="text-xs text-slate-300 w-10 text-right">{val}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <button onClick={() => navigate('/dashboard')} className="btn-secondary w-full flex items-center justify-center gap-2">
          <Home className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>
    </div>
  );
}
