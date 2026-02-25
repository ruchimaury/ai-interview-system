import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Zap, BarChart3, Shield, ArrowRight, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  const features = [
    { icon: Brain, title: 'AI-Powered Analysis', desc: 'Smart resume parsing and skill matching with job requirements' },
    { icon: Zap, title: 'Automated Testing', desc: 'Dynamic assessments tailored to each job role' },
    { icon: BarChart3, title: 'Real-time Rankings', desc: 'Instant candidate scoring and ranking dashboard' },
    { icon: Shield, title: 'Bias-Free Hiring', desc: 'Objective AI evaluation reduces unconscious bias' },
  ];

  const steps = [
    'Candidate uploads resume & applies',
    'AI analyzes skills vs. job requirements',
    'Candidate takes job-specific test',
    'AI conducts & evaluates interview',
    'Instant ranked results for HR',
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-white">HireIQ</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-secondary text-sm py-2">Login</Link>
          <Link to="/register" className="btn-primary text-sm py-2">Get Started</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-8">
          <Zap className="w-3.5 h-3.5" />
          AI-Powered Recruitment Platform
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
          Hire Smarter,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            Not Harder
          </span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Automate your entire screening process. From resume analysis to AI interviews — 
          get ranked candidates in minutes, not weeks.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="btn-primary text-lg py-3.5 px-8 flex items-center justify-center gap-2">
            Start For Free <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/login" className="btn-secondary text-lg py-3.5 px-8">
            Admin Login
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-4">Everything you need</h2>
        <p className="text-slate-400 text-center mb-12">Complete AI recruitment pipeline in one platform</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-card p-6 hover:border-indigo-500/30 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-all">
                <Icon className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">How it works</h2>
        <div className="max-w-2xl mx-auto">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-4 mb-6">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div className="flex-1 glass-card p-4">
                <p className="text-slate-200 font-medium">{step}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-16 text-center">
        <div className="glass-card p-12">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to transform hiring?</h2>
          <p className="text-slate-400 mb-8">Join thousands of companies using AI to find the best talent</p>
          <Link to="/register" className="btn-primary text-lg py-3.5 px-10 inline-flex items-center gap-2">
            Create Free Account <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <footer className="text-center py-8 text-slate-500 text-sm border-t border-white/5">
        © 2024 HireIQ — AI Interview Screening Platform
      </footer>
    </div>
  );
}
