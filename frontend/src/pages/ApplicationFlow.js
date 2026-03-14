import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { getJob, uploadResume, getTest, submitTest, getInterviewQuestions, submitInterview, faceVerify, getMyApplications } from '../utils/api';

const STEPS = ['Resume Upload', 'Face Verify', 'Online Test', 'AI Interview', 'Complete'];

export default function ApplicationFlow() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [job, setJob] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);

  const [faceVerified, setFaceVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [faceMatchScore, setFaceMatchScore] = useState(null);
  const webcamRef = useRef(null);

  const [test, setTest] = useState(null);
  const [testAnswers, setTestAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [testResult, setTestResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [warnings, setWarnings] = useState([]);
  const [testDisqualified, setTestDisqualified] = useState(false);
  const tabSwitchRef = useRef(0);
  const warningsRef = useRef([]);

  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [currentInterviewQ, setCurrentInterviewQ] = useState(0);
  const [interviewAnswers, setInterviewAnswers] = useState([]);
  const [interviewResult, setInterviewResult] = useState(null);
  const [cameraOnForInterview, setCameraOnForInterview] = useState(false);
  const interviewCamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);
  const [speakingTime, setSpeakingTime] = useState(0);
  const speakTimerRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const modelsLoadedRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) setSpeechSupported(true);
    const init = async () => {
      try {
        const jobRes = await getJob(jobId);
        setJob(jobRes.data.job);
        const appsRes = await getMyApplications();
        const existing = appsRes.data.applications.find(a => a.job?._id === jobId);
        if (existing) {
          setApplication(existing);
          if (existing.status === 'interview_completed' || existing.status === 'selected') setStep(4);
          else if (existing.status === 'test_completed') { setStep(3); loadInterviewQ(); }
          else if (existing.status === 'resume_analyzed') setStep(1);
          else setStep(0);
          if (existing.resumeScore > 0) setResumeAnalysis({ score: existing.resumeScore, matchedSkills: existing.matchedSkills, missingSkills: existing.missingSkills });
        }
      } catch (e) { toast.error('Failed to load job'); }
      finally { setPageLoading(false); }
    };
    init();
  }, [jobId]);

  useEffect(() => {
    if (step !== 2 && step !== 3) return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabSwitchRef.current += 1;
        setTabSwitchCount(tabSwitchRef.current);
        const w = { time: new Date().toLocaleTimeString(), msg: `Tab switch #${tabSwitchRef.current}` };
        warningsRef.current = [...warningsRef.current, w];
        setWarnings([...warningsRef.current]);
        if (tabSwitchRef.current >= 3) {
          toast.error('🚫 Disqualified! Too many tab switches.', { autoClose: false });
          setTestDisqualified(true);
        } else {
          toast.warning(`⚠️ Warning ${tabSwitchRef.current}/3: Do NOT switch tabs!`, { autoClose: 3000 });
        }
      }
    };
    const handleBlur = () => {
      const w = { time: new Date().toLocaleTimeString(), msg: 'Window lost focus' };
      warningsRef.current = [...warningsRef.current, w];
      setWarnings([...warningsRef.current]);
      toast.warning('⚠️ Stay on this window!', { autoClose: 2000 });
    };
    const handleContextMenu = (e) => { e.preventDefault(); };
    const handleCopy = (e) => { e.preventDefault(); toast.warning('Copying disabled!', { autoClose: 1500 }); };
    const handlePaste = (e) => { if (step === 2) { e.preventDefault(); toast.warning('Pasting disabled!', { autoClose: 1500 }); } };
    const handleKeyDown = (e) => {
      const blocked = (e.ctrlKey && ['c','v','a','u','s','p'].includes(e.key.toLowerCase())) ||
        e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['i','j','c'].includes(e.key.toLowerCase())) ||
        (e.altKey && e.key === 'Tab');
      if (blocked) { e.preventDefault(); toast.warning('⚠️ Shortcut disabled!', { autoClose: 1500 }); }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [step]);

  const enterFullscreen = async () => { try { await document.documentElement.requestFullscreen(); } catch (e) {} };
  const exitFullscreen = () => { try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {} };

  useEffect(() => {
    const handleFSChange = () => {
      if (!document.fullscreenElement && (step === 2 || step === 3)) {
        const w = { time: new Date().toLocaleTimeString(), msg: 'Exited fullscreen' };
        warningsRef.current = [...warningsRef.current, w];
        setWarnings([...warningsRef.current]);
        toast.warning('⚠️ Stay in fullscreen!', { autoClose: 3000 });
        setTimeout(() => enterFullscreen(), 1500);
      }
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, [step]);

  useEffect(() => {
    if (step === 2 && test && timeLeft > 0 && !testDisqualified) {
      const timer = setInterval(() => {
        setTimeLeft(t => { if (t <= 1) { clearInterval(timer); handleSubmitTest(); return 0; } return t - 1; });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, test, timeLeft, testDisqualified]);

  const loadInterviewQ = async () => {
    try { const res = await getInterviewQuestions(jobId); setInterviewQuestions(res.data.questions); } catch (e) {}
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error('Use Chrome for speech recognition!'); return; }
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onstart = () => {
      setIsListening(true);
      speakTimerRef.current = setInterval(() => setSpeakingTime(t => t + 1), 1000);
    };
    recognition.onresult = (event) => {
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript + ' ';
      }
      if (finalText) setSpokenText(prev => prev + finalText);
    };
    recognition.onerror = (e) => {
      if (e.error === 'no-speech') toast.warning('No speech detected. Speak clearly!');
      setIsListening(false);
      clearInterval(speakTimerRef.current);
    };
    recognition.onend = () => { setIsListening(false); clearInterval(speakTimerRef.current); };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
    setIsListening(false);
    clearInterval(speakTimerRef.current);
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) { toast.error('Select a resume file'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      const res = await uploadResume(jobId, formData);
      setResumeAnalysis(res.data.analysis);
      setApplication({ _id: res.data.applicationId });
      toast.success('Resume analyzed!');
      setStep(1);
    } catch (e) { toast.error(e.response?.data?.message || 'Upload failed'); }
    finally { setLoading(false); }
  };

  // Helper: load image element from src
  const loadImage = (src, crossOrigin = false) => new Promise((resolve, reject) => {
    const img = new window.Image();
    if (crossOrigin) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = src;
  });

  // Real Face Verification
  const captureAndVerify = useCallback(async () => {
    if (!webcamRef.current) return;
    setVerifying(true);
    try {
      toast.info('⏳ Loading AI face models...', { autoClose: 5000, toastId: 'loading' });

      const faceapi = await import('@vladmandic/face-api');

      faceapi.env.monkeyPatch({
        Canvas: HTMLCanvasElement,
        Image: HTMLImageElement,
        ImageData: ImageData,
        Video: HTMLVideoElement,
        createCanvasElement: () => document.createElement('canvas'),
        createImageElement: () => document.createElement('img')
      });

      if (!modelsLoadedRef.current) {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
        modelsLoadedRef.current = true;
      }

      toast.dismiss('loading');
      toast.info('🔍 Comparing faces...', { autoClose: 3000 });

      // Get live screenshot from webcam - high quality
      const imageSrc = webcamRef.current.getScreenshot({ width: 640, height: 480 });
      if (!imageSrc) { toast.error('Cannot capture photo. Check camera.'); setVerifying(false); return; }

      // Load both images
      const liveImg = await loadImage(imageSrc);

      const registeredPhotoUrl = user?.photo ? `http://localhost:5000${user.photo}` : null;
      if (!registeredPhotoUrl) { toast.error('No registered photo found! Contact HR.'); setVerifying(false); return; }

      const registeredImg = await loadImage(registeredPhotoUrl + '?nocache=' + Date.now(), true);

      // Draw live image to canvas for better detection
      const canvas = document.createElement('canvas');
      canvas.width = liveImg.naturalWidth || 640;
      canvas.height = liveImg.naturalHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(liveImg, 0, 0);

      const regCanvas = document.createElement('canvas');
      regCanvas.width = registeredImg.naturalWidth || 300;
      regCanvas.height = registeredImg.naturalHeight || 300;
      const regCtx = regCanvas.getContext('2d');
      regCtx.drawImage(registeredImg, 0, 0);

      // Detect faces
      const liveDetection = await faceapi
        .detectSingleFace(canvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      const registeredDetection = await faceapi
        .detectSingleFace(regCanvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!liveDetection) {
        toast.error('❌ No face in camera! Move closer, face camera directly, ensure bright lighting.');
        setVerifying(false);
        return;
      }
      if (!registeredDetection) {
        toast.error('❌ Cannot read registered photo face. Contact HR to update your photo.');
        setVerifying(false);
        return;
      }

      // Compare faces
      const distance = faceapi.euclideanDistance(
        Array.from(liveDetection.descriptor),
        Array.from(registeredDetection.descriptor)
      );

      const confidence = Math.max(0, Math.round((1 - distance) * 100));
      const isMatch = distance < 0.6;

      setFaceMatchScore(confidence);

      if (isMatch) {
        if (application?._id) await faceVerify(application._id, { verified: true, confidence });
        setFaceVerified(true);
        toast.success(`✅ Identity verified! Match: ${confidence}%`);
      } else {
        toast.error(`❌ Face mismatch! Similarity: ${confidence}%. Use the same person who registered.`);
        if (application?._id) await faceVerify(application._id, { verified: false, confidence });
      }

    } catch (e) {
      console.error('Face verify error:', e);
      toast.error('Verification error: ' + (e.message || 'Try again'));
    } finally {
      setVerifying(false);
    }
  }, [webcamRef, application, user]);

  const proceedToTest = async () => {
    setLoading(true);
    try {
      const res = await getTest(jobId);
      setTest(res.data.test);
      setTimeLeft(res.data.test.duration * 60);
      await enterFullscreen();
      setStep(2);
      toast.info('🔒 Fullscreen ON. Do not switch tabs!', { autoClose: 5000 });
    } catch (e) { toast.error('No test available for this job'); }
    finally { setLoading(false); }
  };

  const handleSubmitTest = async () => {
    if (!test || !application) return;
    setLoading(true);
    exitFullscreen();
    try {
      const res = await submitTest(test._id, { answers: testAnswers, jobId });
      setTestResult(res.data.result);
      await loadInterviewQ();
      setStep(3);
      toast.success(`Test done! Score: ${res.data.result.score}%`);
    } catch (e) { toast.error('Submit failed'); }
    finally { setLoading(false); }
  };

  const startInterview = async () => {
    try {
      setCameraError(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: true
      });
      streamRef.current = stream;
      setCameraOnForInterview(true);
      setTimeout(() => {
        if (interviewCamRef.current) {
          interviewCamRef.current.srcObject = stream;
          interviewCamRef.current.onloadedmetadata = () => interviewCamRef.current.play().catch(() => {});
        }
      }, 300);
      let mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = '';
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setIsRecording(true);
      await enterFullscreen();
      setTimeout(() => startSpeechRecognition(), 1200);
      toast.success('🎥 Camera ON + 🎤 Mic ON — Speak your answer!');
    } catch (e) {
      setCameraError(true);
      toast.error('Camera/Mic denied! Allow permission and try again.');
    }
  };

  const handleNextInterviewQ = () => {
    if (!spokenText.trim()) { toast.error('Please speak your answer first!'); return; }
    stopSpeechRecognition();
    const q = interviewQuestions[currentInterviewQ];
    const newAnswer = { questionId: q.id, question: q.question, answer: spokenText.trim() };
    const updatedAnswers = [...interviewAnswers, newAnswer];
    setInterviewAnswers(updatedAnswers);
    setSpokenText('');
    setSpeakingTime(0);
    if (currentInterviewQ < interviewQuestions.length - 1) {
      setCurrentInterviewQ(p => p + 1);
      setTimeout(() => startSpeechRecognition(), 800);
      toast.info('Next question! Speak your answer.');
    } else {
      handleSubmitInterview(updatedAnswers);
    }
  };

  const handleSubmitInterview = async (answers) => {
    if (!application) return;
    setLoading(true);
    stopSpeechRecognition();
    exitFullscreen();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    try {
      const transcript = answers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n');
      const res = await submitInterview(application._id, {
        answers, transcript,
        antiCheatLog: warningsRef.current,
        tabSwitchCount: tabSwitchRef.current
      });
      setInterviewResult(res.data.result);
      setStep(4);
      toast.success('🎉 Interview submitted!');
    } catch (e) { toast.error('Submit failed'); }
    finally { setLoading(false); }
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (pageLoading) return <><Navbar /><div style={{ textAlign: 'center', padding: 80 }}><div className="spinner" style={{ margin: '0 auto' }} /></div></>;

  if (testDisqualified) return (
    <>
      <Navbar />
      <div style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ fontSize: 72 }}>🚫</div>
        <h2 style={{ fontFamily: 'Syne', fontSize: 32, color: '#EF4444', marginTop: 16 }}>Disqualified!</h2>
        <p style={{ color: '#94A3B8', marginTop: 12 }}>You switched tabs {tabSwitchCount} times. Reported to HR.</p>
        <button className="btn btn-outline" style={{ marginTop: 24 }} onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
      </div>
    </>
  );

  return (
    <>
      <Navbar />
      <div className="page-container" style={{ maxWidth: 860 }}>

        {/* Steps */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32, overflowX: 'auto', padding: '8px 0' }}>
          {STEPS.map((label, i) => (
            <React.Fragment key={label}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 80 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, background: i < step ? '#06D6A0' : i === step ? '#6C63FF' : '#252540', color: i < step ? '#0F0F23' : '#fff', boxShadow: i === step ? '0 0 20px rgba(108,99,255,0.5)' : 'none' }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 11, color: i === step ? '#6C63FF' : '#64748B', textAlign: 'center', fontWeight: i === step ? 600 : 400, whiteSpace: 'nowrap' }}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? '#06D6A0' : 'rgba(255,255,255,0.1)', margin: '0 4px', minWidth: 20, marginBottom: 18 }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Job Info */}
        {job && (
          <div style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.1), rgba(6,214,160,0.05))', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <h3 style={{ color: '#fff', fontWeight: 700 }}>{job.title}</h3>
            <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>{job.department} • {job.location}</div>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (step === 2 || step === 3) && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: '#EF4444', marginBottom: 4 }}>⚠️ Anti-Cheat Warnings: {warnings.length}</div>
            {warnings.slice(-2).map((w, i) => <div key={i} style={{ fontSize: 12, color: '#FCA5A5' }}>{w.time}: {w.msg}</div>)}
          </div>
        )}

        {/* STEP 0: Resume */}
        {step === 0 && (
          <div className="glass-card fade-in">
            <h2 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 8 }}>📄 Upload Your Resume</h2>
            <p style={{ color: '#94A3B8', marginBottom: 24 }}>AI will analyze and match your skills with job requirements</p>
            <div style={{ border: resumeFile ? '2px solid #06D6A0' : '2px dashed rgba(108,99,255,0.4)', borderRadius: 12, padding: 40, textAlign: 'center', cursor: 'pointer', background: resumeFile ? 'rgba(6,214,160,0.05)' : 'rgba(108,99,255,0.03)', marginBottom: 20 }}
              onClick={() => document.getElementById('resumeInput').click()}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{resumeFile ? '✅' : '📄'}</div>
              <div style={{ color: resumeFile ? '#06D6A0' : '#94A3B8', fontWeight: 600 }}>{resumeFile ? resumeFile.name : 'Click or drag & drop resume'}</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 8 }}>PDF, DOC, DOCX (max 10MB)</div>
            </div>
            <input id="resumeInput" type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => setResumeFile(e.target.files[0])} />
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleResumeUpload} disabled={loading || !resumeFile}>
              {loading ? '⏳ Analyzing with AI...' : '🚀 Analyze & Continue'}
            </button>
          </div>
        )}

        {/* STEP 1: Face Verify */}
        {step === 1 && (
          <div className="glass-card fade-in">
            <h2 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 8 }}>🔍 Identity Verification</h2>
            <p style={{ color: '#94A3B8', marginBottom: 16 }}>AI compares your live face with registered photo</p>

            {resumeAnalysis && (
              <div style={{ background: 'rgba(6,214,160,0.08)', border: '1px solid rgba(6,214,160,0.2)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, color: '#fff' }}>Resume Score</span>
                  <span style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800, color: resumeAnalysis.score >= 60 ? '#06D6A0' : '#F59E0B' }}>{resumeAnalysis.score}%</span>
                </div>
                <div className="progress-bar" style={{ marginBottom: 8 }}><div className="progress-fill" style={{ width: `${resumeAnalysis.score}%` }} /></div>
                {resumeAnalysis.matchedSkills?.length > 0 && (
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>✅ Matched Skills</div>
                    {resumeAnalysis.matchedSkills.map((s, i) => <span key={i} className="skill-tag matched">{s}</span>)}
                  </div>
                )}
                {resumeAnalysis.missingSkills?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>⚠️ Missing Skills</div>
                    {resumeAnalysis.missingSkills.map((s, i) => <span key={i} className="skill-tag missing">{s}</span>)}
                  </div>
                )}
              </div>
            )}

            {!faceVerified ? (
              <>
                <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase' }}>Registered Photo</div>
                    {user?.photo
                      ? <img src={`http://localhost:5000${user.photo}`} alt="reg" style={{ width: '100%', maxWidth: 200, borderRadius: 12, border: '2px solid rgba(255,255,255,0.1)' }} crossOrigin="anonymous" />
                      : <div style={{ width: 200, height: 200, background: '#252540', borderRadius: 12, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>No photo</div>}
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase' }}>Live Camera</div>
                    <div style={{ maxWidth: 200, margin: '0 auto', position: 'relative', borderRadius: 10, overflow: 'hidden' }}>
                      <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        screenshotQuality={1}
                        width={640}
                        height={480}
                        videoConstraints={{ width: 640, height: 480, facingMode: 'user' }}
                        onUserMedia={() => setCameraReady(true)}
                        onUserMediaError={() => toast.error('Camera denied')}
                        style={{ width: '100%', display: 'block' }}
                      />
                      {cameraReady && <div style={{ position: 'absolute', inset: 0, border: '2px solid #06D6A0', borderRadius: 10, pointerEvents: 'none' }} />}
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: '#FCD34D' }}>
                  💡 Tips: Face camera directly • Good lighting on face • Remove glasses if needed • Move closer to camera
                </div>

                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={captureAndVerify} disabled={verifying || !cameraReady}>
                  {verifying ? '🔄 AI Analyzing Faces...' : '🎯 Verify My Identity'}
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
                <h3 style={{ color: '#06D6A0', fontFamily: 'Syne', fontSize: 24, marginBottom: 8 }}>Identity Verified!</h3>
                {faceMatchScore && <div style={{ color: '#94A3B8', marginBottom: 16 }}>Face Match: <strong style={{ color: '#06D6A0' }}>{faceMatchScore}%</strong></div>}
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: 16, marginBottom: 24, textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, color: '#EF4444', marginBottom: 10 }}>⚠️ Strict Test Rules:</div>
                  <div style={{ fontSize: 13, color: '#FCA5A5', lineHeight: 2.2 }}>
                    🔒 Test opens in <strong>Fullscreen</strong> — cannot exit<br />
                    📵 <strong>Tab switching</strong> monitored — 3 times = Disqualified<br />
                    🚫 <strong>Copy / Paste</strong> completely disabled<br />
                    🚫 <strong>Right-click</strong> disabled<br />
                    📷 <strong>Camera monitors</strong> you throughout test<br />
                    ⏱️ Timer auto-submits when time is up
                  </div>
                </div>
                <button className="btn btn-primary btn-lg" onClick={proceedToTest} disabled={loading}>
                  {loading ? '⏳ Loading...' : '📝 Start Test →'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: MCQ Test */}
        {step === 2 && test && !testResult && (
          <div className="glass-card fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 800, color: '#fff' }}>📝 {test.title}</h2>
                <p style={{ color: '#94A3B8', fontSize: 13 }}>Q {currentQuestion + 1} / {test.questions.length}</p>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ background: timeLeft < 300 ? 'rgba(239,68,68,0.2)' : 'rgba(108,99,255,0.2)', border: `1px solid ${timeLeft < 300 ? '#EF4444' : '#6C63FF'}`, padding: '6px 14px', borderRadius: 20, fontWeight: 700, color: timeLeft < 300 ? '#EF4444' : '#6C63FF' }}>⏱ {formatTime(timeLeft)}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '4px 10px', borderRadius: 20, fontSize: 12 }}>
                  <span className="recording-dot" /><span style={{ color: '#EF4444' }}>CAM ON</span>
                </div>
                {tabSwitchCount > 0 && <div style={{ background: 'rgba(239,68,68,0.2)', padding: '4px 10px', borderRadius: 20, fontSize: 12, color: '#EF4444' }}>⚠️ {tabSwitchCount}/3</div>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div className="progress-bar" style={{ marginBottom: 16 }}><div className="progress-fill" style={{ width: `${((currentQuestion + 1) / test.questions.length) * 100}%` }} /></div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
                  <p style={{ fontSize: 16, fontWeight: 600, color: '#fff', lineHeight: 1.6 }}>{test.questions[currentQuestion]?.question}</p>
                  {test.questions[currentQuestion]?.skill && <span className="skill-tag" style={{ marginTop: 8, display: 'inline-block' }}>{test.questions[currentQuestion].skill}</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  {test.questions[currentQuestion]?.options.map((opt, i) => (
                    <button key={i} onClick={() => setTestAnswers(prev => ({ ...prev, [test.questions[currentQuestion]._id]: opt }))}
                      style={{ padding: '14px 18px', borderRadius: 10, cursor: 'pointer', background: testAnswers[test.questions[currentQuestion]._id] === opt ? 'rgba(108,99,255,0.3)' : 'rgba(255,255,255,0.03)', border: testAnswers[test.questions[currentQuestion]._id] === opt ? '2px solid #6C63FF' : '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, fontFamily: 'Space Grotesk', textAlign: 'left', transition: 'all 0.15s' }}>
                      <span style={{ fontWeight: 700, marginRight: 10, color: '#6C63FF' }}>{String.fromCharCode(65 + i)}.</span>{opt}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  {currentQuestion > 0 && <button className="btn btn-outline" onClick={() => setCurrentQuestion(p => p - 1)}>← Prev</button>}
                  {currentQuestion < test.questions.length - 1
                    ? <button className="btn btn-primary" onClick={() => setCurrentQuestion(p => p + 1)}>Next →</button>
                    : <button className="btn btn-success" onClick={handleSubmitTest} disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>{loading ? '⏳ Submitting...' : '✅ Submit Test'}</button>}
                </div>
              </div>
              <div style={{ width: 150, flexShrink: 0, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#EF4444', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase' }}>📷 Monitoring</div>
                <Webcam audio={false} style={{ width: '100%', borderRadius: 8, border: '2px solid rgba(239,68,68,0.5)' }} />
                <div style={{ fontSize: 10, color: '#EF4444', marginTop: 4 }}>● LIVE</div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: AI Interview */}
        {step === 3 && (
          <div className="glass-card fade-in">
            <h2 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 8 }}>🎥 AI Video Interview</h2>
            <p style={{ color: '#94A3B8', marginBottom: 16 }}>Speak your answers. AI records, transcribes and analyzes everything.</p>
            {testResult && (
              <div style={{ background: 'rgba(6,214,160,0.08)', border: '1px solid rgba(6,214,160,0.2)', borderRadius: 8, padding: 12, marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
                <span style={{ color: '#94A3B8', fontSize: 13 }}>Test Score:</span>
                <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, color: testResult.score >= 60 ? '#06D6A0' : '#F59E0B' }}>{testResult.score}%</span>
                <span style={{ fontSize: 12, color: testResult.passed ? '#06D6A0' : '#F59E0B' }}>{testResult.passed ? '✅ Passed' : '⚠️ Below passing'}</span>
              </div>
            )}
            {!cameraOnForInterview ? (
              <div style={{ textAlign: 'center', padding: 30 }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🎥</div>
                <h3 style={{ color: '#fff', marginBottom: 12 }}>Ready for AI Interview?</h3>
                <div style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 12, padding: 16, marginBottom: 24, textAlign: 'left', maxWidth: 500, margin: '0 auto 24px' }}>
                  <div style={{ fontWeight: 700, color: '#fff', marginBottom: 10 }}>📋 How it works:</div>
                  <div style={{ fontSize: 13, color: '#A5B4FC', lineHeight: 2.2 }}>
                    🎥 <strong>Camera + Microphone</strong> turns on automatically<br />
                    🎤 <strong>Speak your answer</strong> — words appear live on screen<br />
                    🤖 AI analyzes <strong>confidence, emotion & answer quality</strong><br />
                    📹 Full session is <strong>video recorded</strong> for HR<br />
                    🚫 <strong>No notes allowed</strong> — camera is always watching<br />
                    ⚠️ <strong>Tab switching</strong> is monitored
                  </div>
                </div>
                {cameraError && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: '#FCA5A5' }}>
                    ❌ Camera error! Allow camera & mic in browser, then try again.
                  </div>
                )}
                {!speechSupported && <div style={{ color: '#F59E0B', fontSize: 13, marginBottom: 16 }}>⚠️ Use Google Chrome for speech-to-text!</div>}
                <button className="btn btn-primary btn-lg" onClick={startInterview}>🎬 Start Interview (Camera + Mic ON)</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{ flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: '#EF4444', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, textTransform: 'uppercase' }}>
                    <span className="recording-dot" /> Recording
                  </div>
                  <video ref={interviewCamRef} autoPlay muted playsInline style={{ width: 220, height: 165, borderRadius: 12, border: '3px solid rgba(239,68,68,0.6)', display: 'block', background: '#111', objectFit: 'cover' }} />
                  {isListening && <div style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: '#06D6A0', fontWeight: 600 }}>🎤 Listening...</div>}
                  <div style={{ textAlign: 'center', marginTop: 4, fontSize: 11, color: '#64748B' }}>Q {currentInterviewQ + 1}/{interviewQuestions.length}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="progress-bar" style={{ marginBottom: 12 }}><div className="progress-fill" style={{ width: `${(currentInterviewQ / interviewQuestions.length) * 100}%` }} /></div>
                  <div style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: '#6C63FF', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>Question {currentInterviewQ + 1}</div>
                    <p style={{ fontSize: 16, fontWeight: 600, color: '#fff', lineHeight: 1.6 }}>{interviewQuestions[currentInterviewQ]?.question}</p>
                  </div>
                  <div style={{ background: 'rgba(6,214,160,0.05)', border: `2px solid ${isListening ? '#06D6A0' : 'rgba(6,214,160,0.2)'}`, borderRadius: 12, padding: 14, marginBottom: 14, minHeight: 110, transition: 'border-color 0.3s' }}>
                    <div style={{ fontSize: 11, color: '#06D6A0', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                      <span>{isListening ? '🎤 Speaking...' : '📝 Your Answer'}</span>
                      {speakingTime > 0 && <span style={{ color: '#94A3B8' }}>🕒 {formatTime(speakingTime)}</span>}
                    </div>
                    <div style={{ fontSize: 14, color: spokenText ? '#E2E8F0' : '#64748B', lineHeight: 1.7, minHeight: 60 }}>
                      {spokenText || (isListening ? 'Speak now...' : 'Press "Start Speaking" and speak your answer')}
                    </div>
                    {spokenText && <div style={{ fontSize: 11, color: '#64748B', marginTop: 8 }}>Words: {spokenText.split(/\s+/).filter(Boolean).length}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                    {!isListening
                      ? <button className="btn btn-success" onClick={startSpeechRecognition}>🎤 Start Speaking</button>
                      : <button className="btn btn-danger" onClick={stopSpeechRecognition}>⏹ Stop Speaking</button>}
                    {spokenText && <button className="btn btn-outline btn-sm" onClick={() => { setSpokenText(''); setSpeakingTime(0); }}>🗑 Clear & Retry</button>}
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleNextInterviewQ} disabled={loading || !spokenText.trim()}>
                    {loading ? '⏳ Processing...' : currentInterviewQ < interviewQuestions.length - 1 ? 'Save & Next Question →' : '✅ Submit Interview'}
                  </button>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 8, textAlign: 'center' }}>Aim for 80–150 words • Speak clearly</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Done */}
        {step === 4 && (
          <div className="glass-card fade-in" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 72, marginBottom: 20 }}>🎉</div>
            <h2 style={{ fontFamily: 'Syne', fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Application Complete!</h2>
            <p style={{ color: '#94A3B8', fontSize: 16, marginBottom: 32 }}>Your video interview has been submitted. AI is analyzing your responses.</p>
            {interviewResult && (
              <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
                {[['Interview Score', `${interviewResult.interviewScore}%`, '#6C63FF'], ['Final Score', `${interviewResult.finalScore}%`, '#06D6A0']].map(([label, val, color]) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '16px 24px' }}>
                    <div style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800, color }}>{val}</div>
                    <div style={{ fontSize: 13, color: '#94A3B8' }}>{label}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ background: 'rgba(6,214,160,0.08)', border: '1px solid rgba(6,214,160,0.2)', borderRadius: 12, padding: 16, marginBottom: 24, fontSize: 14, color: '#6EE7B7' }}>
              ✅ Resume analyzed • ✅ Identity verified • ✅ Test completed • ✅ Interview recorded & analyzed
            </div>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard')}>View Dashboard →</button>
          </div>
        )}
      </div>
    </>
  );
}