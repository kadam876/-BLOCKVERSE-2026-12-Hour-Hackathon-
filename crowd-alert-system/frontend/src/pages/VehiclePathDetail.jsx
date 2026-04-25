import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function VehiclePathDetail() {
  const { vehicleId } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [tracking, setTracking] = useState([]);
  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vRes, tRes, pRes] = await Promise.all([
          fetch(`/api/vehicles/${vehicleId}`),
          fetch(`/api/vehicles/${vehicleId}/tracking`),
          fetch(`/api/vehicles/${vehicleId}/path`),
        ]);
        
        if (vRes.ok) setVehicle(await vRes.json());
        if (tRes.ok) setTracking(await tRes.json());
        if (pRes.ok) setPath(await pRes.json());
      } catch (err) {
        console.error('Failed to fetch vehicle data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [vehicleId]);

  if (loading) {
    return (
      <div className="page">
        <div className="page-title">Loading...</div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="page">
        <div className="page-title">Vehicle Not Found</div>
        <Link to="/vehicles" className="btn btn-primary">← Back to Vehicles</Link>
      </div>
    );
  }

  const getVehicleIcon = (type) => {
    const icons = {
      car: '🚗',
      truck: '🚚',
      bus: '🚌',
      motorcycle: '🏍️',
      bicycle: '🚲',
    };
    return icons[type] || '🚙';
  };

  return (
    <div className="page">
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/vehicles" className="btn btn-sm" style={{ marginBottom: '1rem' }}>
          ← Back to Vehicles
        </Link>
        <div className="page-title">
          {getVehicleIcon(vehicle.vehicleType)} Vehicle Path: {vehicleId.substring(0, 16)}...
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Vehicle Information</h3>
          <div style={{ display: 'grid', gap: '0.8rem' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Vehicle ID</div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                {vehicle.vehicleId}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Type</div>
              <div style={{ fontSize: '0.95rem', textTransform: 'capitalize', fontWeight: 600 }}>
                {getVehicleIcon(vehicle.vehicleType)} {vehicle.vehicleType}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Status</div>
              <div>
                <span className={`badge badge-${vehicle.isActive ? 'normal' : 'critical'}`}>
                  {vehicle.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Total Cameras Visited</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#2563eb' }}>
                {vehicle.totalCameras}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Timeline</h3>
          <div style={{ display: 'grid', gap: '0.8rem' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>First Seen</div>
              <div style={{ fontSize: '0.9rem' }}>{new Date(vehicle.firstSeen).toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Last Seen</div>
              <div style={{ fontSize: '0.9rem' }}>{new Date(vehicle.lastSeen).toLocaleString()}</div>
            </div>
            {path && path.totalDuration && (
              <div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Total Duration</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  {Math.floor(path.totalDuration / 60)} min {Math.floor(path.totalDuration % 60)} sec
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Path Visualization */}
      {path && path.path && path.path.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>📍 Path Visualization</h3>
          <div style={{ position: 'relative', padding: '2rem 0' }}>
            {path.path.map((point, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                {/* Timeline dot */}
                <div style={{ position: 'relative', marginRight: '1.5rem' }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: idx === 0 ? '#16a34a' : idx === path.path.length - 1 ? '#dc2626' : '#2563eb',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    zIndex: 2,
                    position: 'relative',
                  }}>
                    {idx + 1}
                  </div>
                  {idx < path.path.length - 1 && (
                    <div style={{
                      position: 'absolute',
                      left: '50%',
                      top: 40,
                      width: 2,
                      height: 60,
                      background: '#d1d5db',
                      transform: 'translateX(-50%)',
                    }} />
                  )}
                </div>

                {/* Camera info */}
                <div style={{
                  flex: 1,
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>
                        {point.cameraName && !point.cameraName.startsWith('Camera ') ? '📁' : '📹'} {point.cameraName || 'Unknown Camera'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                        📍 {point.locationName || 'Unknown Location'}
                      </div>
                    </div>
                    {idx === 0 && (
                      <span style={{
                        padding: '4px 10px',
                        background: '#d1fae5',
                        color: '#065f46',
                        borderRadius: 20,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}>
                        START
                      </span>
                    )}
                    {idx === path.path.length - 1 && !vehicle.isActive && (
                      <span style={{
                        padding: '4px 10px',
                        background: '#fee2e2',
                        color: '#991b1b',
                        borderRadius: 20,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}>
                        END
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.82rem', color: '#6b7280' }}>
                    <div>
                      <strong>Time:</strong> {new Date(point.timestamp).toLocaleTimeString()}
                    </div>
                    {point.duration > 0 && (
                      <div>
                        <strong>Duration:</strong> {Math.floor(point.duration / 60)}m {Math.floor(point.duration % 60)}s
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tracking History */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>🕒 Detection History ({tracking.length} detections)</h3>
        {tracking.length === 0 ? (
          <div className="empty">No tracking data available</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>Timestamp</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>Camera</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>Location</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>Confidence</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>Direction</th>
                </tr>
              </thead>
              <tbody>
                {tracking.map((t, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                      {new Date(t.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {t.cameraName && !t.cameraName.startsWith('Camera ') ? '📁 ' : ''}{t.cameraName}
                    </td>
                    <td style={{ padding: '0.75rem' }}>{t.locationName}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '2px 8px',
                        background: t.confidence > 0.8 ? '#d1fae5' : '#fef3c7',
                        color: t.confidence > 0.8 ? '#065f46' : '#92400e',
                        borderRadius: 4,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}>
                        {(t.confidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>{t.direction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
