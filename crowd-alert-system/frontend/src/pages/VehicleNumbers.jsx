import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const STATUS_COLOR = { normal: '#16a34a', warning: '#d97706', critical: '#dc2626', active: '#2563eb', inactive: '#6b7280' };

export default function VehicleNumbers() {
  const [vehicles, setVehicles] = useState([]);
  const [activeOnly, setActiveOnly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const socketRef = useRef(null);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const url = activeOnly ? '/api/vehicle-numbers/active/list' : '/api/vehicle-numbers';
      const res = await fetch(url);
      const data = await res.json();
      setVehicles(data);
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
    const interval = setInterval(fetchVehicles, 5000);
    return () => clearInterval(interval);
  }, [activeOnly]);

  // Socket.io for real-time updates
  useEffect(() => {
    const socket = io('http://127.0.0.1:4000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('vehicleNumberDetected', (data) => {
      console.log('Vehicle number detected:', data);
      fetchVehicles();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this vehicle record?')) return;
    try {
      await fetch(`/api/vehicle-numbers/${id}`, { method: 'DELETE' });
      fetchVehicles();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      await fetch(`/api/vehicle-numbers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchVehicles();
    } catch (err) {
      console.error('Failed to update:', err);
    }
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div className="page-title">🚗 Vehicle License Plates</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
          />
          Show Active Only (Last 5 min)
        </label>
      </div>

      {/* Vehicle Grid */}
      <div className="grid-3">
        {vehicles.map((vehicle) => (
          <div
            className="card"
            key={vehicle._id}
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setSelectedVehicle(vehicle)}
          >
            {/* Thumbnail */}
            {vehicle.thumbnail && (
              <div style={{ width: '100%', height: 150, background: '#000', marginBottom: '1rem', borderRadius: 8, overflow: 'hidden' }}>
                <img
                  src={`data:image/jpeg;base64,${vehicle.thumbnail}`}
                  alt="Vehicle"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            {/* License Plate */}
            <div style={{
              fontSize: '1.8rem',
              fontWeight: 700,
              fontFamily: 'monospace',
              background: '#fef08a',
              color: '#000',
              padding: '0.75rem',
              borderRadius: 6,
              textAlign: 'center',
              marginBottom: '1rem',
              border: '2px solid #000',
            }}>
              {vehicle.vehicleNumber}
            </div>

            {/* Info */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 4 }}>Vehicle Type</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, textTransform: 'capitalize', marginBottom: '0.75rem' }}>
                {vehicle.vehicleType}
              </div>

              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 4 }}>Color</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, textTransform: 'capitalize', marginBottom: '0.75rem' }}>
                {vehicle.color}
              </div>

              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 4 }}>Detections</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#2563eb', marginBottom: '0.75rem' }}>
                {vehicle.detectionCount}x
              </div>

              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: 4 }}>Last Detected</div>
              <div style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                {new Date(vehicle.lastDetected).toLocaleString()}
              </div>

              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: 4 }}>First Detected</div>
              <div style={{ fontSize: '0.85rem' }}>
                {new Date(vehicle.firstDetected).toLocaleString()}
              </div>
            </div>

            {/* Status Badge */}
            <div style={{ marginBottom: '1rem' }}>
              <span className={`badge badge-${vehicle.isActive ? 'active' : 'inactive'}`}>
                {vehicle.isActive ? '🟢 Active' : '⚫ Inactive'}
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleActive(vehicle._id, vehicle.isActive);
                }}
                style={{ flex: 1, background: vehicle.isActive ? '#d97706' : '#16a34a', color: 'white' }}
              >
                {vehicle.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                className="btn btn-sm btn-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(vehicle._id);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {vehicles.length === 0 && !loading && (
        <div className="empty">No vehicle license plates detected yet. Enable vehicle tracking on cameras to start detection.</div>
      )}

      {loading && (
        <div className="empty">Loading...</div>
      )}

      {/* Detail Modal */}
      {selectedVehicle && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setSelectedVehicle(null)}>
          <div className="card" style={{ maxWidth: 500, maxHeight: '80vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>Vehicle Details</h2>
              <button
                className="btn btn-sm"
                onClick={() => setSelectedVehicle(null)}
                style={{ background: '#6b7280', color: 'white' }}
              >
                ✕
              </button>
            </div>

            {selectedVehicle.thumbnail && (
              <div style={{ width: '100%', height: 250, background: '#000', marginBottom: '1rem', borderRadius: 8, overflow: 'hidden' }}>
                <img
                  src={`data:image/jpeg;base64,${selectedVehicle.thumbnail}`}
                  alt="Vehicle"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            <div style={{
              fontSize: '2rem',
              fontWeight: 700,
              fontFamily: 'monospace',
              background: '#fef08a',
              color: '#000',
              padding: '1rem',
              borderRadius: 6,
              textAlign: 'center',
              marginBottom: '1.5rem',
              border: '2px solid #000',
            }}>
              {selectedVehicle.vehicleNumber}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>Vehicle Type</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, textTransform: 'capitalize' }}>
                  {selectedVehicle.vehicleType}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>Color</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, textTransform: 'capitalize' }}>
                  {selectedVehicle.color}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>Total Detections</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#2563eb' }}>
                  {selectedVehicle.detectionCount}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>Status</div>
                <span className={`badge badge-${selectedVehicle.isActive ? 'active' : 'inactive'}`}>
                  {selectedVehicle.isActive ? '🟢 Active' : '⚫ Inactive'}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>First Detected</div>
              <div style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                {new Date(selectedVehicle.firstDetected).toLocaleString()}
              </div>

              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>Last Detected</div>
              <div style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                {new Date(selectedVehicle.lastDetected).toLocaleString()}
              </div>

              {selectedVehicle.lastCameraName && (
                <>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>Last Camera</div>
                  <div style={{ fontSize: '0.9rem' }}>
                    {selectedVehicle.lastCameraName}
                  </div>
                </>
              )}
            </div>

            {selectedVehicle.detectionHistory && selectedVehicle.detectionHistory.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>Detection History</div>
                <div style={{ maxHeight: 200, overflow: 'auto', background: '#f3f4f6', borderRadius: 6, padding: '0.75rem' }}>
                  {selectedVehicle.detectionHistory.map((detection, idx) => (
                    <div key={idx} style={{ fontSize: '0.8rem', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>
                      <div style={{ fontWeight: 600 }}>{detection.cameraName}</div>
                      <div style={{ color: '#6b7280' }}>{new Date(detection.timestamp).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn btn-sm"
                onClick={() => {
                  handleToggleActive(selectedVehicle._id, selectedVehicle.isActive);
                  setSelectedVehicle(null);
                }}
                style={{ flex: 1, background: selectedVehicle.isActive ? '#d97706' : '#16a34a', color: 'white' }}
              >
                {selectedVehicle.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => {
                  handleDelete(selectedVehicle._id);
                  setSelectedVehicle(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
