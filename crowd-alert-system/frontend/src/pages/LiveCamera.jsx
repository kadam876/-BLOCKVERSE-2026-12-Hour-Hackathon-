import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://127.0.0.1:4000';
const FLASK_URL  = 'http://127.0.0.1:5002';

export default function LiveCamera() {
  const [locations, setLocations]       = useState([]);
  const [locationId, setLocationId]     = useState('');
  const [cameraUrl, setCameraUrl]       = useState('http://192.168.1.100:8080/video');
  const [customThreshold, setCustomThreshold] = useState('');
  const [alertEmail, setAlertEmail]     = useState('');
  const [faceRecognitionEnabled, setFaceRecognitionEnabled] = useState(false);
  const [running, setRunning]           = useState(false);
  const [liveCount, setLiveCount]       = useState(null);
  const [alert, setAlert]               = useState(null);   // latest crowdAlert event
  const [streamOk, setStreamOk]         = useState(false);  // img load success
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const socketRef = useRef(null);
  const alertTimerRef = useRef(null);
  const imgRef = useRef(null);

  // Fetch configured locations
  useEffect(() => {
    fetch('/api/live/status')
      .then(r => r.json())
      .then(data => {
        setLocations(Array.isArray(data) ? data : []);
      })
      .catch(() => setLocations([]));
  }, []);

  // Socket.io connection
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('liveCount', (data) => {
      if (!locationId || data.locationId === locationId) {
        setLiveCount(data);
      }
    });

    socket.on('crowdAlert', (data) => {
      if (!locationId || data.locationId === locationId) {
        setAlert(data);
        // Auto-dismiss alert after 10s
        clearTimeout(alertTimerRef.current);
        alertTimerRef.current = setTimeout(() => setAlert(null), 10000);
      }
    });

    return () => {
      socket.disconnect();
      clearTimeout(alertTimerRef.current);
    };
  }, [locationId]);

  const handleStart = async () => {
    if (!locationId) { setError('Select a location first'); return; }
    if (!cameraUrl)  { setError('Enter camera URL'); return; }
    setError('');
    setLoading(true);
    try {
      // Enable face recognition if checked
      if (faceRecognitionEnabled) {
        await fetch(`${FLASK_URL}/face/enable`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: true }),
        });
      }

      const payload = { cameraUrl, locationId };
      if (customThreshold && customThreshold.trim() !== '') {
        payload.customThreshold = parseInt(customThreshold, 10);
      }
      if (alertEmail && alertEmail.trim() !== '') {
        payload.customEmail = alertEmail.trim();
      }
      const res = await fetch(`${FLASK_URL}/live/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start');
      setRunning(true);
      setLiveCount(null);
      setAlert(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await fetch(`${FLASK_URL}/live/stop`, { method: 'POST' });
      setRunning(false);
      setLiveCount(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedLoc = locations.find(l => l._id === locationId);
  const isCritical  = liveCount?.status === 'critical';
  const isWarning   = liveCount?.status === 'warning';

  return (
    <div className="page">
      <div className="page-title">📡 Live Surveillance</div>

      {/* Config panel */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Location</label>
            <select value={locationId} onChange={e => setLocationId(e.target.value)} disabled={running}>
              <option value="">— select configured location —</option>
              {locations.map(l => (
                <option key={l._id} value={l._id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>IP Webcam URL</label>
            <input
              value={cameraUrl}
              onChange={e => setCameraUrl(e.target.value)}
              placeholder="http://192.168.x.x:8080/video"
              disabled={running}
            />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 150px 2fr', gap: '1rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Alert Email</label>
            <input
              type="email"
              value={alertEmail}
              onChange={e => setAlertEmail(e.target.value)}
              placeholder={selectedLoc?.authorityEmail || 'email@example.com'}
              disabled={running}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Threshold</label>
            <input
              type="number"
              value={customThreshold}
              onChange={e => setCustomThreshold(e.target.value)}
              placeholder={selectedLoc ? selectedLoc.threshold : '20'}
              disabled={running}
              min="1"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              Leave empty to use location defaults
            </span>
          </div>
        </div>

        {error && (
          <div style={{ marginTop: '0.75rem', color: '#dc2626', fontSize: '0.88rem' }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {!running ? (
            <>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={faceRecognitionEnabled}
                  onChange={e => setFaceRecognitionEnabled(e.target.checked)}
                />
                Enable Face Recognition
              </label>
              <button className="btn btn-primary" onClick={handleStart} disabled={loading}>
                {loading ? 'Starting…' : '▶ Start Detection'}
              </button>
            </>
          ) : (
            <button className="btn btn-danger" onClick={handleStop} disabled={loading}>
              {loading ? 'Stopping…' : '⏹ Stop Detection'}
            </button>
          )}
          {running && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: '#16a34a' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block', animation: 'pulse 1.2s infinite' }} />
              Live
            </span>
          )}
        </div>
      </div>

      {/* Alert banner */}
      {alert && (
        <div style={{
          background: '#fee2e2', border: '2px solid #dc2626', borderRadius: 10,
          padding: '1rem 1.5rem', marginBottom: '1.5rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontWeight: 700, color: '#dc2626', fontSize: '1.05rem' }}>
              🚨 Crowd Alert — {alert.locationName}
            </div>
            <div style={{ fontSize: '0.88rem', color: '#7f1d1d', marginTop: 4 }}>
              {alert.peopleCount} people detected — threshold is {alert.threshold}
              {alert.emailSent ? '  ✅ Email sent' : '  ❌ Email not sent'}
            </div>
          </div>
          <button className="btn btn-sm btn-danger" onClick={() => setAlert(null)}>Dismiss</button>
        </div>
      )}

      <div className="grid-2" style={{ gap: '1.5rem' }}>
        {/* Camera feed */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 12 }}>
          <div style={{
            background: isCritical ? '#dc2626' : isWarning ? '#d97706' : '#1a1a2e',
            color: 'white', padding: '0.6rem 1rem', fontSize: '0.88rem', fontWeight: 600,
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>📷 Camera Feed</span>
            {running && (
              <span style={{ fontSize: '0.78rem', opacity: 0.85 }}>
                {streamOk ? 'Connected' : 'Connecting…'}
              </span>
            )}
          </div>

          {running ? (
            <div style={{ position: 'relative', background: '#000', minHeight: 320 }}>
              <iframe
                ref={imgRef}
                src={cameraUrl}
                title="Live camera feed"
                onLoad={() => setStreamOk(true)}
                style={{
                  width: '100%',
                  height: 480,
                  border: isCritical ? '3px solid #dc2626' : isWarning ? '3px solid #d97706' : 'none',
                  display: 'block',
                }}
              />
            </div>
          ) : (
            <div style={{
              height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#9ca3af', flexDirection: 'column', gap: 8, background: '#f9fafb',
            }}>
              <span style={{ fontSize: '2rem' }}>📷</span>
              <span style={{ fontSize: '0.88rem' }}>Start detection to view live feed</span>
            </div>
          )}
        </div>

        {/* Stats panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Live count */}
          <div className="card" style={{
            textAlign: 'center',
            background: isCritical ? '#fee2e2' : isWarning ? '#fef3c7' : 'white',
            border: `2px solid ${isCritical ? '#dc2626' : isWarning ? '#d97706' : '#e5e7eb'}`,
          }}>
            <div style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: 4 }}>People Detected</div>
            <div style={{
              fontSize: '3.5rem', fontWeight: 800,
              color: isCritical ? '#dc2626' : isWarning ? '#d97706' : '#1a1a2e',
            }}>
              {liveCount != null ? liveCount.peopleCount : '—'}
            </div>
            {selectedLoc && (
              <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 4 }}>
                Threshold: {selectedLoc.threshold}
              </div>
            )}
            {liveCount && (
              <span className={`badge badge-${liveCount.status}`} style={{ marginTop: 8 }}>
                {liveCount.status}
              </span>
            )}
          </div>

          {/* Progress bar */}
          {liveCount && selectedLoc?.threshold > 0 && (
            <div className="card">
              <div style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: 6 }}>
                Capacity Usage
              </div>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{
                  width: `${Math.min((liveCount.peopleCount / selectedLoc.threshold) * 100, 100)}%`,
                  background: isCritical ? '#dc2626' : isWarning ? '#d97706' : '#16a34a',
                }} />
              </div>
              <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 4 }}>
                {Math.round((liveCount.peopleCount / selectedLoc.threshold) * 100)}% of limit
              </div>
            </div>
          )}

          {/* Location info */}
          {selectedLoc && (
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{selectedLoc.name}</div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span><span className={`badge badge-${selectedLoc.department}`}>{selectedLoc.department}</span></span>
                <span>Threshold: {selectedLoc.threshold} people</span>
                <span>Email: {selectedLoc.authorityEmail || '—'}</span>
              </div>
            </div>
          )}

          {/* Instructions */}
          {!running && (
            <div className="card" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
              <div style={{ fontSize: '0.85rem', color: '#0369a1', lineHeight: 1.6 }}>
                <strong>Setup:</strong><br />
                1. Install <em>IP Webcam</em> app on your phone<br />
                2. Start server in the app<br />
                3. Enter the URL shown (e.g. <code>http://192.168.x.x:8080/video</code>)<br />
                4. Select a configured location and press Start
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
