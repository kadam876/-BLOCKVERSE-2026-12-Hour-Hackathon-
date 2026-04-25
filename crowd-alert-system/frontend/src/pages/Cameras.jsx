import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const STATUS_COLOR = { normal: '#16a34a', warning: '#d97706', critical: '#dc2626', running: '#2563eb', stopped: '#6b7280', error: '#dc2626' };

export default function Cameras() {
  const [cameras, setCameras] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [cameraUrl, setCameraUrl] = useState('http://192.168.1.100:8080/video');
  const [locationId, setLocationId] = useState('');
  const [threshold, setThreshold] = useState('');
  const [alertEmail, setAlertEmail] = useState('');
  const [faceRecognition, setFaceRecognition] = useState(false);
  const [vehicleTracking, setVehicleTracking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [liveCounts, setLiveCounts] = useState({});
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [vehicleNumbers, setVehicleNumbers] = useState({});
  const socketRef = useRef(null);

  const fetchData = async () => {
    const [cRes, lRes] = await Promise.all([
      fetch('/api/cameras'),
      fetch('/api/live/status'),
    ]);
    setCameras(await cRes.json());
    setLocations(await lRes.json());
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Socket.io for real-time updates
  useEffect(() => {
    const socket = io('http://127.0.0.1:4000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    socket.on('liveCount', (data) => {
      setLiveCounts(prev => ({ ...prev, [data.locationId]: data }));
    });

    socket.on('vehicleNumberDetected', (data) => {
      setVehicleNumbers(prev => ({
        ...prev,
        [data.cameraId]: {
          number: data.vehicleNumber,
          type: data.vehicleType,
          color: data.color,
          timestamp: new Date(),
        }
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name || !cameraUrl || !locationId) {
      setError('Name, camera URL, and location are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/cameras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          cameraUrl,
          locationId,
          threshold: threshold ? parseInt(threshold) : undefined,
          alertEmail: alertEmail || undefined,
          faceRecognitionEnabled: faceRecognition,
          vehicleTrackingEnabled: vehicleTracking,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add camera');

      setShowAdd(false);
      setName('');
      setCameraUrl('http://192.168.1.100:8080/video');
      setLocationId('');
      setThreshold('');
      setAlertEmail('');
      setFaceRecognition(false);
      setVehicleTracking(false);
      fetchData();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this camera? Detection will stop.')) return;
    await fetch(`/api/cameras/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleToggle = async (id) => {
    await fetch(`/api/cameras/${id}/toggle`, { method: 'PATCH' });
    fetchData();
  };

  const handleLocationChange = (e) => {
    const locId = e.target.value;
    setLocationId(locId);
    
    // Find the selected location and auto-fill threshold and email
    const loc = locations.find(l => l._id === locId);
    setSelectedLocation(loc || null);
    
    if (loc) {
      setThreshold(loc.threshold?.toString() || '');
      setAlertEmail(loc.authorityEmail || '');
    }
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div className="page-title">📹 Camera Management</div>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Cancel' : '+ Add Camera'}
        </button>
      </div>

      {/* Add Camera Form */}
      {showAdd && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <form onSubmit={handleAdd}>
            <div className="grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Camera Name *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Main Entrance Camera"
                  required
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Location *</label>
                <select value={locationId} onChange={handleLocationChange} required>
                  <option value="">— select location —</option>
                  {locations.map(l => (
                    <option key={l._id} value={l._id}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location Preview */}
            {selectedLocation && (
              <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f3f4f6', borderRadius: 8 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 8, color: '#374151' }}>
                  📍 {selectedLocation.name} - Preview
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>Default Threshold</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{selectedLocation.threshold || 'Not set'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>Alert Email</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, wordBreak: 'break-all' }}>
                      {selectedLocation.authorityEmail || 'Not set'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>Department</div>
                    <div style={{ fontSize: '0.85rem' }}>{selectedLocation.department || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>Current Status</div>
                    <div style={{ fontSize: '0.85rem' }}>
                      <span className={`badge badge-${selectedLocation.lastStatus || 'normal'}`}>
                        {selectedLocation.lastStatus || 'normal'}
                      </span>
                    </div>
                  </div>
                </div>
                {selectedLocation.lastCount !== undefined && (
                  <div style={{ marginTop: 8, fontSize: '0.85rem', color: '#6b7280' }}>
                    Last Count: <strong>{selectedLocation.lastCount}</strong> people
                    {selectedLocation.lastUpdated && ` • ${new Date(selectedLocation.lastUpdated).toLocaleString()}`}
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label>IP Webcam URL *</label>
              <input
                value={cameraUrl}
                onChange={e => setCameraUrl(e.target.value)}
                placeholder="http://192.168.x.x:8080/video"
                required
              />
            </div>
            <div className="grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Threshold (optional)</label>
                <input
                  type="number"
                  value={threshold}
                  onChange={e => setThreshold(e.target.value)}
                  placeholder="Leave empty for location default"
                  min="1"
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Alert Email (optional)</label>
                <input
                  type="email"
                  value={alertEmail}
                  onChange={e => setAlertEmail(e.target.value)}
                  placeholder="Leave empty for location default"
                />
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={faceRecognition}
                onChange={e => setFaceRecognition(e.target.checked)}
              />
              Enable Face Recognition
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', marginBottom: '1rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={vehicleTracking}
                onChange={e => setVehicleTracking(e.target.checked)}
              />
              Enable Vehicle Tracking
            </label>
            {error && <div style={{ color: '#dc2626', fontSize: '0.88rem', marginBottom: 10 }}>{error}</div>}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Camera & Start Detection'}
            </button>
          </form>
        </div>
      )}

      <div className="grid-3">
        {cameras.map(camera => {
          const locId = camera.locationId?._id || camera.locationId;
          const liveData = liveCounts[locId];
          const peopleCount = liveData?.peopleCount ?? camera.lastCount;
          const status = liveData?.status ?? camera.lastStatus;
          const isRunning = camera.status === 'running';

          return (
            <div className="card" key={camera._id} style={{ padding: 0, overflow: 'hidden' }}>
              {/* Camera Feed */}
              <div style={{ position: 'relative', background: '#000', height: 200 }}>
                {isRunning ? (
                  <iframe
                    src={camera.cameraUrl}
                    title={camera.name}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: '2rem' }}>📷</span>
                    <span style={{ fontSize: '0.85rem' }}>Camera Stopped</span>
                  </div>
                )}
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  background: STATUS_COLOR[camera.status], color: 'white',
                  padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                }}>
                  {camera.status}
                </div>
              </div>

              {/* Camera Info */}
              <div style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong>{camera.name}</strong>
                  {isRunning && status && (
                    <span className={`badge badge-${status}`}>{status}</span>
                  )}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 8 }}>
                  📍 {camera.locationName}
                </div>
                {isRunning && (
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: STATUS_COLOR[status], marginBottom: 8 }}>
                    {peopleCount} <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>/ {camera.threshold}</span>
                  </div>
                )}
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: 10 }}>
                  {camera.faceRecognitionEnabled && '🎯 Face Recognition'}
                  {camera.faceRecognitionEnabled && camera.vehicleTrackingEnabled && ' • '}
                  {camera.vehicleTrackingEnabled && '🚗 Vehicle Tracking'}
                  {camera.lastUpdated && ` • Updated: ${new Date(camera.lastUpdated).toLocaleTimeString()}`}
                </div>
                {vehicleNumbers[camera._id] && (
                  <div style={{
                    background: '#fef08a',
                    border: '2px solid #000',
                    borderRadius: 6,
                    padding: '0.5rem',
                    marginBottom: '0.75rem',
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                  }}>
                    🚗 {vehicleNumbers[camera._id].number}
                    <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 400, marginTop: 2 }}>
                      {vehicleNumbers[camera._id].color} {vehicleNumbers[camera._id].type}
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="btn btn-sm"
                    onClick={() => handleToggle(camera._id)}
                    style={{ flex: 1, background: isRunning ? '#d97706' : '#16a34a', color: 'white' }}
                  >
                    {isRunning ? '⏸ Stop' : '▶ Start'}
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(camera._id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {cameras.length === 0 && !showAdd && (
        <div className="empty">No cameras added. Click "Add Camera" to start monitoring.</div>
      )}
    </div>
  );
}
