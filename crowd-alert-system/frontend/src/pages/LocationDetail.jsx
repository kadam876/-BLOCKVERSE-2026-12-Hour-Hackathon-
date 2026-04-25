import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const STEPS = ['Department & Email', 'Training Video', 'Done'];

// Helper: read an SSE stream, call onEvent(event) for each parsed event
async function readSSEStream(response, onEvent) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop(); // keep incomplete line
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const raw = line.slice(5).trim();
      if (!raw) continue;
      try { onEvent(JSON.parse(raw)); } catch { /* skip malformed */ }
    }
  }
}

export default function LocationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  // Setup wizard
  const [step, setStep] = useState(0);
  const [department, setDepartment] = useState('police');
  const [email, setEmail] = useState('');
  const [trainingFile, setTrainingFile] = useState(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupProgress, setSetupProgress] = useState(0);
  const [setupResult, setSetupResult] = useState(null);
  const [setupError, setSetupError] = useState('');

  // Testing
  const [testFile, setTestFile] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [testFrameInfo, setTestFrameInfo] = useState(null); // live frame data
  const [testTotalFrames, setTestTotalFrames] = useState(0);
  const [testCurrentFrame, setTestCurrentFrame] = useState(0);
  const [inferenceLog, setInferenceLog] = useState([]); // live log lines
  const [liveFrame, setLiveFrame] = useState(null);
  const [midStreamAlert, setMidStreamAlert] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [testError, setTestError] = useState('');

  const trainRef = useRef();
  const testRef = useRef();
  const logRef = useRef();

  useEffect(() => {
    fetch(`/api/locations/${id}`)
      .then(r => r.json())
      .then(data => { setLocation(data); setLoading(false); });
  }, [id]);

  // Auto-scroll inference log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [inferenceLog]);

  // ── SETUP: stream training video ──────────────────────────
  const handleSetup = async (e) => {
    e.preventDefault();
    if (!trainingFile) { setSetupError('Please select a training video.'); return; }
    setSetupLoading(true);
    setSetupError('');
    setSetupProgress(0);

    const form = new FormData();
    form.append('department', department);
    form.append('authorityEmail', email);
    form.append('trainingVideo', trainingFile);

    try {
      const res = await fetch(`/api/alerts/setup-stream/${id}`, { method: 'POST', body: form });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Setup failed');
      }

      await readSSEStream(res, (event) => {
        if (event.type === 'error') throw new Error(event.message);
        if (event.type === 'progress') setSetupProgress(event.percent || 0);
        if (event.type === 'complete') {
          setSetupResult(event);
          setLocation(event.location);
          setStep(2);
        }
      });
    } catch (err) {
      setSetupError(err.message);
    } finally {
      setSetupLoading(false);
    }
  };

  // ── TESTING: stream test video ────────────────────────────
  const handleTest = async () => {
    if (!testFile) return;
    setTestLoading(true);
    setTestProgress(0);
    setTestCurrentFrame(0);
    setTestTotalFrames(0);
    setTestFrameInfo(null);
    setInferenceLog([]);
    setLiveFrame(null);
    setMidStreamAlert(null);
    setTestError('');
    setTestResult(null);

    const form = new FormData();
    form.append('video', testFile);

    try {
      const res = await fetch(`/api/alerts/detect/${id}`, { method: 'POST', body: form });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Detection failed');
      }

      await readSSEStream(res, (event) => {
        if (event.type === 'error') throw new Error(event.message);

        if (event.type === 'start') {
          setTestTotalFrames(event.total_frames);
          setInferenceLog(prev => [...prev, `▶ Started — ${event.total_frames} frames to process`]);
        }

        if (event.type === 'alert') {
          setMidStreamAlert(event);
          setInferenceLog(prev => [
            ...prev,
            `🚨 ALERT at frame ${event.frame} — ${event.peopleCount} people > threshold ${event.threshold}`,
          ]);
        }

        if (event.type === 'progress') {
          const pct = event.percent || 0;
          setTestProgress(pct);
          setTestCurrentFrame(event.frame);
          setTestFrameInfo(event);
          if (event.preview) setLiveFrame(event.preview);
          setInferenceLog(prev => {
            const line = `Frame ${event.frame}/${event.total || '?'} — ${event.people_in_frame} people — ${pct}%`;
            return [...prev.slice(-49), line];
          });
        }

        if (event.type === 'complete') {
          setTestResult(event);
          setTestProgress(100);
          // Update location state so header badge reflects current run
          setLocation(prev => ({
            ...prev,
            lastStatus: event.status,
            lastCount: event.detection.max_people_in_frame,
          }));
          setInferenceLog(prev => [
            ...prev,
            `✅ Done — Total: ${event.detection.total_people} people | Max/frame: ${event.detection.max_people_in_frame}`,
          ]);
        }
      });
    } catch (err) {
      setTestError(err.message);
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) return <div className="page"><div className="spinner" /></div>;
  if (!location || location.error) return <div className="page">Location not found.</div>;

  // ── SETUP WIZARD ──────────────────────────────────────────
  if (!location.isConfigured) {
    return (
      <div className="page">
        <button className="btn btn-sm" style={{ marginBottom: '1rem', background: '#e5e7eb' }}
          onClick={() => navigate('/locations')}>← Back</button>
        <div className="page-title">Setup: {location.name}</div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{
              flex: 1, textAlign: 'center', padding: '8px', borderRadius: '8px',
              fontSize: '0.85rem', fontWeight: 600,
              background: i === step ? '#2563eb' : i < step ? '#d1fae5' : '#f3f4f6',
              color: i === step ? 'white' : i < step ? '#065f46' : '#9ca3af',
            }}>{i + 1}. {s}</div>
          ))}
        </div>

        {/* Step 0 */}
        {step === 0 && (
          <div className="card" style={{ maxWidth: 500 }}>
            <h3 style={{ marginBottom: '1.2rem' }}>Department Details</h3>
            <div className="form-group">
              <label>Department Type</label>
              <select value={department} onChange={e => setDepartment(e.target.value)}>
                <option value="police">Police</option>
                <option value="transport">Transport Authority</option>
              </select>
            </div>
            <div className="form-group">
              <label>Authority Email (alerts will be sent here)</label>
              <input type="email" placeholder="authority@gov.in" value={email}
                onChange={e => setEmail(e.target.value)} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }}
              disabled={!email} onClick={() => setStep(1)}>Next →</button>
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <div className="card" style={{ maxWidth: 500 }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Upload Training Video</h3>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1.2rem' }}>
              Upload a video showing <strong>normal crowd</strong> at this location.
              YOLO will calculate the average and set it as the alert threshold.
            </p>
            <div className="drop-zone" onClick={() => trainRef.current.click()}
              onDrop={e => { e.preventDefault(); setTrainingFile(e.dataTransfer.files[0]); }}
              onDragOver={e => e.preventDefault()} style={{ marginBottom: '1rem' }}>
              {trainingFile
                ? <div><strong>📹 {trainingFile.name}</strong><br />
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                      {(trainingFile.size / 1024 / 1024).toFixed(2)} MB
                    </span></div>
                : <div>Drag & drop training video or click to select</div>}
              <input ref={trainRef} type="file" accept="video/*" style={{ display: 'none' }}
                onChange={e => setTrainingFile(e.target.files[0])} />
            </div>

            {setupLoading && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>
                  Analysing with YOLO... {setupProgress}%
                </div>
                <div className="progress-bar-wrap">
                  <div className="progress-bar-fill" style={{ width: `${setupProgress}%`, background: '#2563eb' }} />
                </div>
              </div>
            )}

            {setupError && <div style={{ color: '#dc2626', marginBottom: '1rem', fontSize: '0.9rem' }}>❌ {setupError}</div>}

            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button className="btn" style={{ background: '#e5e7eb' }} onClick={() => setStep(0)}>← Back</button>
              <button className="btn btn-primary" style={{ flex: 1 }}
                disabled={!trainingFile || setupLoading} onClick={handleSetup}>
                {setupLoading ? 'Processing...' : 'Analyse & Save Threshold'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && setupResult && (
          <div className="card" style={{ maxWidth: 500 }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem' }}>✅</div>
              <h3 style={{ marginTop: '0.5rem' }}>Setup Complete!</h3>
            </div>
            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem' }}>
              {[
                ['Department', <span className={`badge badge-${setupResult.location.department}`}>{setupResult.location.department}</span>],
                ['Alert Email', setupResult.location.authorityEmail],
                ['Avg Training Crowd', `${setupResult.location.avgTrainingCount} people`],
                ['Alert Threshold', <strong style={{ color: '#dc2626' }}>{setupResult.location.threshold} people</strong>],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e5e7eb' }}>
                  <span style={{ color: '#6b7280' }}>{label}</span>
                  <span>{val}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1.2rem' }}>{setupResult.message}</p>
            <button className="btn btn-primary" style={{ width: '100%' }}
              onClick={() => window.location.reload()}>Start Testing →</button>
          </div>
        )}
      </div>
    );
  }

  // ── TESTING PAGE ──────────────────────────────────────────
  const STATUS_COLOR = { normal: '#16a34a', warning: '#d97706', critical: '#dc2626' };

  return (
    <div className="page">
      <button className="btn btn-sm" style={{ marginBottom: '1rem', background: '#e5e7eb' }}
        onClick={() => navigate('/locations')}>← Back</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div className="page-title" style={{ marginBottom: 0 }}>{location.name}</div>
        <span className={`badge badge-${location.lastStatus}`}>{location.lastStatus}</span>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {[
          ['DEPARTMENT', <span className={`badge badge-${location.department}`}>{location.department}</span>],
          ['ALERT EMAIL', location.authorityEmail],
          ['THRESHOLD', <strong style={{ color: '#dc2626' }}>{location.threshold} people</strong>],
          ['LAST COUNT', `${location.lastCount} people`],
        ].map(([label, val]) => (
          <div key={label}>
            <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{label}</div>
            <div style={{ marginTop: '2px' }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Row 1: Upload + Inference Stream */}
      <div className="grid-2" style={{ marginBottom: '1.2rem' }}>
        {/* Upload panel */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Upload Testing Video</h3>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem' }}>
            If crowd exceeds <strong>{location.threshold} people</strong>, alert sent to <strong>{location.authorityEmail}</strong>.
          </p>

          <div className="drop-zone" onClick={() => !testLoading && testRef.current.click()}
            onDrop={e => { e.preventDefault(); if (!testLoading) { setTestFile(e.dataTransfer.files[0]); setTestResult(null); setInferenceLog([]); }}}
            onDragOver={e => e.preventDefault()} style={{ marginBottom: '1rem', opacity: testLoading ? 0.5 : 1 }}>
            {testFile
              ? <div><strong>📹 {testFile.name}</strong><br />
                  <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{(testFile.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              : <div>Drag & drop testing video or click to select</div>}
            <input ref={testRef} type="file" accept="video/*" style={{ display: 'none' }}
              onChange={e => { setTestFile(e.target.files[0]); setTestResult(null); setInferenceLog([]); }} />
          </div>

          {/* Mid-stream alert banner — shows immediately when threshold exceeded */}
          {midStreamAlert && (
            <div style={{
              background: '#fee2e2', border: '1px solid #fca5a5',
              borderRadius: '8px', padding: '0.8rem', marginBottom: '1rem',
              animation: 'pulse 1s ease-in-out 3',
            }}>
              <div style={{ fontWeight: 700, color: '#dc2626' }}>🚨 Alert Triggered!</div>
              <div style={{ fontSize: '0.82rem', color: '#7f1d1d', marginTop: '2px' }}>
                {midStreamAlert.peopleCount} people detected at frame {midStreamAlert.frame} — email sent to {location.authorityEmail}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '2px' }}>
                Analysis continuing...
              </div>
            </div>
          )}

          {/* Progress bar */}
          {(testLoading || testResult) && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#6b7280', marginBottom: '4px' }}>
                <span>
                  {testLoading
                    ? testTotalFrames > 0
                      ? `Processing frame ${testCurrentFrame} / ${testTotalFrames}`
                      : 'Uploading & starting...'
                    : 'Complete'}
                </span>
                <span style={{ fontWeight: 600 }}>{Math.round(testProgress)}%</span>
              </div>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{
                  width: `${testProgress}%`,
                  background: testResult
                    ? (testResult.exceeded ? '#dc2626' : '#16a34a')
                    : '#2563eb',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              {testLoading && testFrameInfo && (
                <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '4px' }}>
                  People in current frame: <strong>{testFrameInfo.people_in_frame}</strong>
                </div>
              )}
            </div>
          )}

          {testError && <div style={{ color: '#dc2626', fontSize: '0.9rem', marginBottom: '1rem' }}>❌ {testError}</div>}

          <button className="btn btn-primary" style={{ width: '100%' }}
            disabled={!testFile || testLoading} onClick={handleTest}>
            {testLoading ? `Detecting... ${Math.round(testProgress)}%` : 'Run Detection'}
          </button>
        </div>

        {/* Live Frame Preview */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <h3>Live Preview</h3>
            {testLoading && <span style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 600, animation: 'pulse 1s infinite' }}>● LIVE</span>}
          </div>

          <div style={{
            background: '#0f172a', borderRadius: '8px', overflow: 'hidden',
            minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '0.8rem', position: 'relative',
          }}>
            {liveFrame
              ? <img src={`data:image/jpeg;base64,${liveFrame}`}
                  style={{ width: '100%', display: 'block', borderRadius: '8px' }}
                  alt="Live inference frame" />
              : <span style={{ color: '#475569', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  Waiting for video...
                </span>
            }
            {testLoading && liveFrame && (
              <div style={{
                position: 'absolute', bottom: 8, right: 8,
                background: 'rgba(0,0,0,0.6)', color: '#f59e0b',
                fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace',
              }}>
                {testCurrentFrame}/{testTotalFrames} — {testFrameInfo?.people_in_frame ?? 0} people
              </div>
            )}
          </div>

          <div ref={logRef} style={{
            maxHeight: '120px', overflowY: 'auto',
            background: '#0f172a', borderRadius: '8px', padding: '0.6rem',
            fontFamily: 'monospace', fontSize: '0.75rem', color: '#94a3b8', lineHeight: '1.5',
          }}>
            {inferenceLog.length === 0
              ? <span style={{ color: '#475569' }}>Inference log will appear here...</span>
              : inferenceLog.map((line, i) => (
                <div key={i} style={{
                  color: line.startsWith('✅') ? '#4ade80' : line.startsWith('▶') ? '#60a5fa' : '#94a3b8'
                }}>{line}</div>
              ))}
            {testLoading && <span style={{ color: '#f59e0b' }}>▌</span>}
          </div>
        </div>
      </div>

      {/* Row 2: Results (shown after complete) */}
      {testResult && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Detection Results</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Alert banner */}
            <div style={{ flex: '1 1 300px' }}>
              {testResult.exceeded ? (
                <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 700, color: '#dc2626', fontSize: '1.1rem' }}>🚨 Crowd Exceeded Threshold!</div>
                  <div style={{ fontSize: '0.85rem', color: '#7f1d1d', marginTop: '4px' }}>
                    {testResult.alert?.emailSent
                      ? `✅ Alert email sent to ${location.authorityEmail}`
                      : testResult.alert ? '❌ Email delivery failed' : '⏳ Alert on cooldown (sent recently)'}
                  </div>
                </div>
              ) : (
                <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 700, color: '#065f46' }}>✅ Crowd is within normal limits</div>
                </div>
              )}

              <div className="grid-2" style={{ gap: '0.8rem', marginBottom: '1rem' }}>
                <div className="stat-box">
                  <div className="value" style={{ color: testResult.exceeded ? '#dc2626' : '#16a34a' }}>
                    {testResult.detection.total_people}
                  </div>
                  <div className="label">Total People</div>
                </div>
                <div className="stat-box">
                  <div className="value" style={{ color: testResult.exceeded ? '#dc2626' : '#16a34a' }}>
                    {testResult.detection.max_people_in_frame}
                  </div>
                  <div className="label">Max in Frame (vs threshold)</div>
                </div>
              </div>
              <div style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}><strong>Avg Density:</strong> {testResult.detection.avg_density_level}</div>
              <div style={{ fontSize: '0.9rem' }}>
                <strong>Threshold:</strong> {testResult.threshold} &nbsp;|&nbsp;
                <strong>Status:</strong>{' '}
                <span className={`badge badge-${testResult.exceeded ? 'critical' : 'normal'}`}>
                  {testResult.exceeded ? 'critical' : 'normal'}
                </span>
              </div>
            </div>

            {/* Processed video */}
            <div style={{ flex: '1 1 300px' }}>
              <video src={testResult.videoUrl} controls
                style={{ width: '100%', borderRadius: '8px', background: '#000' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
