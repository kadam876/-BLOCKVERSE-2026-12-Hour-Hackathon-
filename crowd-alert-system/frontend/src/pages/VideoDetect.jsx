import React, { useEffect, useState, useRef } from 'react';

async function readSSEStream(response, onEvent) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const raw = line.slice(5).trim();
      if (!raw) continue;
      try { onEvent(JSON.parse(raw)); } catch { /* skip malformed */ }
    }
  }
}

export default function VideoDetect() {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedLocationData, setSelectedLocationData] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [frameInfo, setFrameInfo] = useState(null);
  const [inferenceLog, setInferenceLog] = useState([]);
  const [liveFrame, setLiveFrame] = useState(null);
  const [midStreamAlert, setMidStreamAlert] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();
  const logRef = useRef();

  useEffect(() => {
    fetch('/api/locations').then(r => r.json()).then(setLocations);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [inferenceLog]);

  const handleFile = (f) => {
    if (f && f.type.startsWith('video/')) {
      setFile(f);
      setResult(null);
      setError('');
      setInferenceLog([]);
    } else {
      setError('Please select a valid video file.');
    }
  };

  const handleLocationChange = (e) => {
    const locId = e.target.value;
    setSelectedLocation(locId);
    
    // Find and store the selected location data
    const loc = locations.find(l => l._id === locId);
    console.log('Selected location:', loc); // Debug log
    setSelectedLocationData(loc || null);
  };

  const handleSubmit = async () => {
    if (!file || !selectedLocation) return;
    setLoading(true);
    setProgress(0);
    setCurrentFrame(0);
    setTotalFrames(0);
    setFrameInfo(null);
    setInferenceLog([]);
    setLiveFrame(null);
    setMidStreamAlert(null);
    setError('');
    setResult(null);

    try {
      const form = new FormData();
      form.append('video', file);

      const res = await fetch(`/api/alerts/detect/${selectedLocation}`, {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Detection failed');
      }

      await readSSEStream(res, (event) => {
        if (event.type === 'error') throw new Error(event.message);

        if (event.type === 'start') {
          setTotalFrames(event.total_frames);
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
          setProgress(event.percent || 0);
          setCurrentFrame(event.frame);
          setFrameInfo(event);
          if (event.preview) setLiveFrame(event.preview);
          setInferenceLog(prev => {
            const line = `Frame ${event.frame}/${event.total || '?'} — ${event.people_in_frame} people — ${event.percent}%`;
            return [...prev.slice(-49), line];
          });
        }

        if (event.type === 'complete') {
          setResult(event);
          setProgress(100);
          setInferenceLog(prev => [
            ...prev,
            `✅ Done — Total: ${event.detection.total_people} | Max/frame: ${event.detection.max_people_in_frame}`,
          ]);
        }      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const STATUS_COLOR = { normal: '#16a34a', warning: '#d97706', critical: '#dc2626' };

  return (
    <div className="page">
      <div className="page-title">Video Detection</div>

      <div className="grid-2" style={{ marginBottom: '1.2rem' }}>
        {/* Upload panel */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Upload Video</h3>

          <div className="form-group">
            <label>Select Location</label>
            <select value={selectedLocation} onChange={handleLocationChange}>
              <option value="">-- Choose a location --</option>
              {locations.filter(l => l.isConfigured).map(l => (
                <option key={l._id} value={l._id}>{l.name} (limit: {l.threshold})</option>
              ))}
            </select>
          </div>

          {/* Location Preview */}
          {selectedLocationData && (
            <div style={{ marginBottom: '1rem', padding: '0.9rem', background: '#f3f4f6', borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 8, color: '#374151' }}>
                📍 {selectedLocationData.name}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.82rem' }}>
                <div>
                  <div style={{ color: '#6b7280', marginBottom: 2 }}>Threshold</div>
                  <div style={{ fontWeight: 600, color: '#111827' }}>{selectedLocationData.threshold} people</div>
                </div>
                <div>
                  <div style={{ color: '#6b7280', marginBottom: 2 }}>Status</div>
                  <div>
                    <span className={`badge badge-${selectedLocationData.lastStatus || 'normal'}`}>
                      {selectedLocationData.lastStatus || 'normal'}
                    </span>
                  </div>
                </div>
                <div>
                  <div style={{ color: '#6b7280', marginBottom: 2 }}>Department</div>
                  <div style={{ fontWeight: 500 }}>{selectedLocationData.department || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ color: '#6b7280', marginBottom: 2 }}>Last Count</div>
                  <div style={{ fontWeight: 600, color: '#111827' }}>
                    {selectedLocationData.lastCount !== undefined ? `${selectedLocationData.lastCount} people` : 'N/A'}
                  </div>
                </div>
              </div>
              {selectedLocationData.lastUpdated && (
                <div style={{ marginTop: 6, fontSize: '0.72rem', color: '#9ca3af' }}>
                  Updated: {new Date(selectedLocationData.lastUpdated).toLocaleString()}
                </div>
              )}
            </div>
          )}

          <div className="drop-zone" onClick={() => !loading && fileRef.current.click()}
            onDrop={e => { e.preventDefault(); if (!loading) handleFile(e.dataTransfer.files[0]); }}
            onDragOver={e => e.preventDefault()}
            style={{ marginBottom: '1rem', opacity: loading ? 0.5 : 1 }}>
            {file
              ? <div><strong>📹 {file.name}</strong><br />
                  <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              : <div>Drag & drop a video or click to select</div>}
            <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])} />
          </div>

          {/* Mid-stream alert banner */}
          {midStreamAlert && (
            <div style={{
              background: '#fee2e2', border: '1px solid #fca5a5',
              borderRadius: '8px', padding: '0.8rem', marginBottom: '1rem',
            }}>
              <div style={{ fontWeight: 700, color: '#dc2626' }}>🚨 Alert Triggered!</div>
              <div style={{ fontSize: '0.82rem', color: '#7f1d1d', marginTop: '2px' }}>
                {midStreamAlert.peopleCount} people at frame {midStreamAlert.frame} — email sent
              </div>
              {loading && <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '2px' }}>Analysis continuing...</div>}
            </div>
          )}

          {/* Real progress bar */}
          {(loading || result) && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#6b7280', marginBottom: '4px' }}>
                <span>
                  {loading
                    ? totalFrames > 0 ? `Frame ${currentFrame} / ${totalFrames}` : 'Uploading...'
                    : 'Complete'}
                </span>
                <span style={{ fontWeight: 600 }}>{Math.round(progress)}%</span>
              </div>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{
                  width: `${progress}%`,
                  background: result
                    ? (result.exceeded ? '#dc2626' : '#16a34a')
                    : '#2563eb',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              {loading && frameInfo && (
                <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '4px' }}>
                  People in current frame: <strong>{frameInfo.people_in_frame}</strong>
                </div>
              )}
            </div>
          )}

          {error && <div style={{ color: '#dc2626', fontSize: '0.9rem', marginBottom: '1rem' }}>❌ {error}</div>}

          <button className="btn btn-primary" style={{ width: '100%' }}
            onClick={handleSubmit} disabled={!file || !selectedLocation || loading}>
            {loading ? `Detecting... ${Math.round(progress)}%` : 'Run Detection'}
          </button>
        </div>

        {/* Live Frame Preview */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <h3>Live Preview</h3>
            {loading && <span style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 600, animation: 'pulse 1s infinite' }}>● LIVE</span>}
          </div>

          {/* Live frame image */}
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
            {loading && liveFrame && (
              <div style={{
                position: 'absolute', bottom: 8, right: 8,
                background: 'rgba(0,0,0,0.6)', color: '#f59e0b',
                fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace',
              }}>
                {currentFrame}/{totalFrames} — {frameInfo?.people_in_frame ?? 0} people
              </div>
            )}
          </div>

          {/* Inference log */}
          <div ref={logRef} style={{
            flex: 1, maxHeight: '120px', overflowY: 'auto',
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
            {loading && <span style={{ color: '#f59e0b' }}>▌</span>}
          </div>
        </div>
      </div>

      {/* Results — shown after complete */}
      {result && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Detection Results</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 280px' }}>
              {result.exceeded ? (
                <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 700, color: '#dc2626' }}>🚨 Crowd Exceeded Threshold!</div>
                  <div style={{ fontSize: '0.85rem', color: '#7f1d1d', marginTop: '4px' }}>
                    {result.alert?.emailSent
                      ? `✅ Alert email sent`
                      : result.alert ? '❌ Email failed' : '⏳ Alert on cooldown'}
                  </div>
                </div>
              ) : (
                <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 700, color: '#065f46' }}>✅ Crowd within normal limits</div>
                </div>
              )}

              <div className="grid-2" style={{ gap: '0.8rem', marginBottom: '1rem' }}>
                <div className="stat-box">
                  <div className="value" style={{ color: result.exceeded ? '#dc2626' : '#16a34a' }}>{result.detection.total_people}</div>
                  <div className="label">Total People</div>
                </div>
                <div className="stat-box">
                  <div className="value" style={{ color: result.exceeded ? '#dc2626' : '#16a34a' }}>{result.detection.max_people_in_frame}</div>
                  <div className="label">Max in Frame (vs threshold)</div>
                </div>
              </div>

              <div style={{ fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                <strong>Avg Density:</strong> {result.detection.avg_density_level}
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                <strong>Status:</strong>{' '}
                <span className={`badge badge-${result.exceeded ? 'critical' : 'normal'}`}>
                  {result.exceeded ? 'critical' : 'normal'}
                </span>
                &nbsp;|&nbsp;<strong>Threshold:</strong> {result.threshold}
              </div>
            </div>

            <div style={{ flex: '1 1 280px' }}>
              <video src={result.videoUrl} controls
                style={{ width: '100%', borderRadius: '8px', background: '#000' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
