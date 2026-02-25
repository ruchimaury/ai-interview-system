import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function Interview() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [jobTitle, setJobTitle] = useState('');
  const [currentQ, setCurrentQ] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [allAnswers, setAllAnswers] = useState([]);
  const [recording, setRecording] = useState(false);
  const [phase, setPhase] = useState('intro'); // intro, answering, done, result
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [app, setApp] = useState(null);
  const recognitionRef = useRef(null);
  const [liveText, setLiveText] = useState('');

  useEffect(() => {
    axios.get(`${API}/applications/${appId}`).then(r => {
      setApp(r.data);
      return axios.get(`${API}/interview/questions/${r.data.job_id}`);
    }).then(r => {
      setQuestions(r.data.questions);
      setJobTitle(r.data.job_title);
    }).catch(() => navigate('/dashboard'));
  }, [appId]);

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';
      rec.onresult = (e) => {
        let final = '', interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
          else interim += e.results[i][0].transcript;
        }
        setTranscript(t => t + final);
        setLiveText(interim);
      };
      rec.onend = () => { if (recording) rec.start(); };
      rec.start();
      recognitionRef.current = rec;
      setRecording(true);
    } else {
      alert('Speech recognition not supported. Please type your answer.');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setRecording(false);
    setLiveText('');
  };

  const nextQuestion = () => {
    const ans = transcript.trim() || 'No answer provided';
    setAllAnswers(prev => [...prev, { question: questions[currentQ], answer: ans }]);
    setTranscript('');
    if (currentQ < questions.length - 1) {
      setCurrentQ(c => c + 1);
    } else {
      setPhase('done');
    }
    if (recording) stopRecording();
  };

  const submitInterview = async () => {
    setLoading(true);
    const fullTranscript = allAnswers.map((a, i) => `Q${i+1}: ${a.question}\nA: ${a.answer}`).join('\n\n');
    try {
      const r = await axios.post(`${API}/interview/submit`, {
        application_id: parseInt(appId),
        transcript: fullTranscript,
        duration_seconds: allAnswers.length * 60
      });
      setResult(r.data);
      setPhase('result');
    } catch {
      alert('Submission failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (phase === 'result' && result) {
    const scores = [
      { label: 'Confidence', value: result.confidence_score, icon: '💪' },
      { label: 'Clarity', value: result.clarity_score, icon: '🎯' },
      { label: 'Emotion', value: result.emotion_score, icon: '😊' },
    ];
    return (
      <Layout>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }} className="fade-in">
          <div className="card" style={{ padding: '2.5rem' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.5rem', marginBottom: '0.5rem' }}>Interview Complete!</h2>
            <p style={{ color: '#666678', marginBottom: '2rem', fontSize: '0.9rem' }}>AI has analyzed your performance</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              {scores.map(s => (
                <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '1rem' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{s.icon}</div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.3rem', color: '#a5a8ff' }}>{s.value?.toFixed(0)}%</div>
                  <div style={{ fontSize: '0.78rem', color: '#666678' }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: '1.25rem', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 14, marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#888898', marginBottom: '0.3rem' }}>Final Score</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.5rem', fontWeight: 800 }} className="gradient-text">{result.final_score?.toFixed(1)}%</div>
            </div>

            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => navigate(`/result/${appId}`)}>View Full Report →</button>
          </div>
        </div>
      </Layout>
    );
  }

  if (phase === 'done') {
    return (
      <Layout>
        <div style={{ maxWidth: 600, margin: '0 auto' }} className="fade-in">
          <div className="card" style={{ padding: '2rem' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: '1.5rem' }}>Review Your Answers</h2>
            {allAnswers.map((a, i) => (
              <div key={i} style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.82rem', color: '#6366f1', marginBottom: '0.3rem', fontWeight: 600 }}>Q{i+1}</div>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>{a.question}</div>
                <div style={{ color: '#888898', fontSize: '0.88rem', lineHeight: 1.6 }}>{a.answer.substring(0, 200)}{a.answer.length > 200 ? '...' : ''}</div>
              </div>
            ))}
            <button className="btn-primary" onClick={submitInterview} disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '0.9rem' }}>
              {loading ? 'Analyzing with AI...' : 'Submit Interview for Analysis'}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (phase === 'intro') {
    return (
      <Layout>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }} className="fade-in">
          <div className="card" style={{ padding: '2.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎙️</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.4rem', marginBottom: '0.5rem' }}>AI Interview</h2>
            <p style={{ color: '#777788', marginBottom: '0.5rem' }}>Position: <strong style={{ color: '#a5a8ff' }}>{jobTitle}</strong></p>
            <p style={{ color: '#666678', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '2rem' }}>
              You will answer {questions.length} questions. You can speak (using mic) or type your answers. AI will analyze your confidence, clarity, and communication.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
              {['🎙️ Speech Recognition', '🧠 AI Analysis', '📊 Auto Scoring'].map(t => (
                <span key={t} className="skill-tag" style={{ padding: '0.4rem 0.8rem' }}>{t}</span>
              ))}
            </div>
            <button className="btn-primary" style={{ padding: '0.9rem 2.5rem', fontSize: '1rem' }} onClick={() => setPhase('answering')}>Start Interview →</button>
          </div>
        </div>
      </Layout>
    );
  }

  // Answering phase
  return (
    <Layout>
      <div style={{ maxWidth: 700, margin: '0 auto' }} className="fade-in">
        {/* Progress */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
          <span style={{ color: '#666678' }}>Question {currentQ + 1} of {questions.length}</span>
          <span style={{ color: '#a5a8ff' }}>{Math.round((currentQ / questions.length) * 100)}% done</span>
        </div>
        <div className="progress-bar" style={{ marginBottom: '2rem' }}>
          <div className="progress-fill" style={{ width: `${(currentQ / questions.length) * 100}%` }}/>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'inline-block', padding: '0.2rem 0.7rem', background: 'rgba(99,102,241,0.15)', borderRadius: 6, fontSize: '0.78rem', color: '#a5a8ff', fontWeight: 600, marginBottom: '1rem' }}>
            Question {currentQ + 1}
          </div>
          <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '1.1rem', lineHeight: 1.5 }}>
            {questions[currentQ]}
          </p>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#666678' }}>Your Answer</span>
            <button onClick={recording ? stopRecording : startRecording}
              style={{ padding: '0.4rem 1rem', borderRadius: 8, border: `1px solid ${recording ? 'rgba(248,113,113,0.4)' : 'rgba(99,102,241,0.4)'}`, background: recording ? 'rgba(248,113,113,0.1)' : 'rgba(99,102,241,0.1)', color: recording ? '#f87171' : '#a5a8ff', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {recording ? '⏹ Stop' : '🎙️ Speak'}
              {recording && <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#f87171', animation: 'pulse 1s infinite' }}/>}
            </button>
          </div>

          <textarea className="input-field" rows={5} placeholder="Speak or type your answer here..."
            value={transcript + liveText}
            onChange={e => setTranscript(e.target.value)}
            style={{ resize: 'vertical' }}/>

          {liveText && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#555570', fontStyle: 'italic' }}>
              🎙️ {liveText}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" onClick={nextQuestion}>
            {currentQ < questions.length - 1 ? 'Next Question →' : 'Finish Interview ✓'}
          </button>
        </div>
      </div>
    </Layout>
  );
}
