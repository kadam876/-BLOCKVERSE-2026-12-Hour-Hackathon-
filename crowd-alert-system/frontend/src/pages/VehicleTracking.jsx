import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { Link } from 'react-router-dom';

export default function VehicleTracking() {
  const [vehicles, setVehicles] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, inactive
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchPlate, setSearchPlate] = useState('');
  const [plateResult, setPlateResult] = useState(null);
  const [isSearchingPlate, setIsSearchingPlate] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [showWatchlistForm, setShowWatchlistForm] = useState(false);
  const [newTarget, setNewTarget] = useState({ vehicleNumber: '', ownerName: '', vehicleType: 'car', color: '', thumbnail: '' });
  const [watchlistHits, setWatchlistHits] = useState([]);
  const socketRef = useRef(null);

  const fetchData = async () => {
    const endpoint = filter === 'active' ? '/api/vehicles/status/active' : '/api/vehicles';
    const [vRes, sRes, wRes] = await Promise.all([
      fetch(endpoint),
      fetch('/api/vehicles/stats/summary'),
      fetch('/api/vehicle-numbers'),
    ]);
    setVehicles(await vRes.json());
    setStats(await sRes.json());
    const allPlates = await wRes.json();
    setWatchlist(allPlates.filter(p => p.isWatchlisted));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [filter]);

  // Socket.io for real-time updates
  useEffect(() => {
    const socket = io('http://127.0.0.1:4000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on('vehicleDetected', (data) => {
      console.log('Vehicle detected:', data);
      fetchData(); // Refresh data
    });

    socket.on('watchlistHit', (data) => {
      if (data.type === 'vehicle') {
        setWatchlistHits(prev => [data, ...prev].slice(0, 10));
      }
    });

    return () => socket.disconnect();
  }, []);

  const filteredVehicles = typeFilter === 'all'
    ? vehicles
    : vehicles.filter(v => v.vehicleType === typeFilter);

  const vehicleTypes = ['all', 'car', 'truck', 'bus', 'motorcycle', 'bicycle'];

  const handleSearchPlate = async (e) => {
    e.preventDefault();
    if (!searchPlate.trim()) {
      setPlateResult(null);
      return;
    }
    setIsSearchingPlate(true);
    try {
      const res = await fetch('/api/vehicle-numbers');
      const allPlates = await res.json();
      const found = allPlates.find(p => p.vehicleNumber.toLowerCase().includes(searchPlate.toLowerCase().trim()));
      setPlateResult(found || 'not_found');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingPlate(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewTarget(prev => ({ ...prev, thumbnail: reader.result.split(',')[1] }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTarget = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/vehicle-numbers/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTarget)
      });
      if (res.ok) {
        setShowWatchlistForm(false);
        setNewTarget({ vehicleNumber: '', ownerName: '', vehicleType: 'car', color: '', thumbnail: '' });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const removeFromWatchlist = async (id) => {
    try {
      await fetch(`/api/vehicle-numbers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isWatchlisted: false })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page">
      <div className="page-title">🚗 Vehicle Tracking</div>

      {/* Watchlist Hits */}
      {watchlistHits.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>🚨 Watchlist Hits</h2>
            <span style={{ background: '#dc2626', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', animation: 'pulse 1.5s infinite' }}>NEW</span>
          </div>
          <div className="grid-3">
            {watchlistHits.map((hit, i) => (
              <div key={i} className="card" style={{ border: '2px solid #dc2626', background: '#fff1f2' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {hit.thumbnail && (
                    <img src={`data:image/jpeg;base64,${hit.thumbnail}`} alt="Hit" style={{ width: 80, height: 80, borderRadius: 6, objectFit: 'cover' }} />
                  )}
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#991b1b' }}>{hit.vehicleNumber}</div>
                    <div style={{ fontSize: '0.85rem', color: '#b91c1c' }}>Owner: {hit.ownerName}</div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 4 }}>
                      📍 {hit.cameraName}<br/>
                      🕒 {new Date(hit.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* License Plate Search */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>🔍 Search Vehicle by License Plate</h3>
          <button 
            className={`btn ${showWatchlistForm ? 'btn-secondary' : 'btn-primary'}`} 
            onClick={() => setShowWatchlistForm(!showWatchlistForm)}
          >
            {showWatchlistForm ? 'Cancel' : '➕ Add to Watchlist'}
          </button>
        </div>

        {showWatchlistForm ? (
          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
            <h4 style={{ marginBottom: '1rem' }}>Add Vehicle to Watchlist</h4>
            <form onSubmit={handleAddTarget} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>Vehicle Number *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. MH12AB1234"
                  value={newTarget.vehicleNumber}
                  onChange={e => setNewTarget({...newTarget, vehicleNumber: e.target.value})}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>Owner Name</label>
                <input 
                  type="text" 
                  placeholder="John Doe"
                  value={newTarget.ownerName}
                  onChange={e => setNewTarget({...newTarget, ownerName: e.target.value})}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>Vehicle Type</label>
                <select 
                  value={newTarget.vehicleType}
                  onChange={e => setNewTarget({...newTarget, vehicleType: e.target.value})}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  {vehicleTypes.filter(t => t !== 'all').map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>Vehicle Image</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ fontSize: '0.8rem' }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary">Save to Watchlist</button>
              </div>
            </form>
          </div>
        ) : (
          <form onSubmit={handleSearchPlate} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Enter license plate (e.g. MH12AB1234)"
              value={searchPlate}
              onChange={e => setSearchPlate(e.target.value)}
              style={{ flex: '1 1 300px', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '1rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'border-color 0.2s', outline: 'none' }}
            />
            <button type="submit" className="btn btn-primary" disabled={isSearchingPlate}>
              {isSearchingPlate ? 'Searching...' : 'Search'}
            </button>
          </form>
        )}

        {plateResult === 'not_found' && (
          <div style={{ marginTop: '1rem', color: '#dc2626', padding: '1rem', background: '#fee2e2', borderRadius: '6px' }}>
            No vehicle found with this license plate.
          </div>
        )}

        {plateResult && plateResult !== 'not_found' && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {plateResult.thumbnail && (
                <img 
                  src={`data:image/jpeg;base64,${plateResult.thumbnail}`} 
                  alt="Vehicle" 
                  style={{ width: 150, height: 100, objectFit: 'cover', borderRadius: '6px' }} 
                />
              )}
              <div style={{ flex: 1, minWidth: '250px' }}>
                <div style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: '800', 
                  fontFamily: '"SF Mono", "Consolas", monospace', 
                  background: 'linear-gradient(to bottom, #fef08a, #eab308)', 
                  display: 'inline-block', 
                  padding: '0.4rem 1.2rem', 
                  borderRadius: '6px', 
                  border: '3px solid #111827', 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255,255,255,0.5)', 
                  marginBottom: '1.5rem',
                  letterSpacing: '3px',
                  color: '#111827',
                  textTransform: 'uppercase'
                }}>
                  {plateResult.vehicleNumber}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Last Detected Camera</div>
                    <div style={{ fontWeight: 600 }}>
                      {plateResult.lastCameraName && !plateResult.lastCameraName.startsWith('Camera ') ? '📁 ' : '📹 '}
                      {plateResult.lastCameraName || 'Unknown Camera'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Last Detected Time</div>
                    <div style={{ fontWeight: 600 }}>{new Date(plateResult.lastDetected).toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Vehicle Type</div>
                    <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{plateResult.vehicleType}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Total Detections</div>
                    <div style={{ fontWeight: 600 }}>{plateResult.detectionCount}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Watchlist Management */}
      {watchlist.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>📋 Vehicle Watchlist</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {watchlist.map(item => (
              <div key={item._id} className="card" style={{ padding: '1rem', position: 'relative', border: '1px solid #e2e8f0' }}>
                <button 
                  onClick={() => removeFromWatchlist(item._id)}
                  style={{ position: 'absolute', top: 5, right: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#9ca3af' }}
                >
                  &times;
                </button>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 'bold', 
                    fontFamily: 'monospace',
                    background: '#fef08a',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid #ca8a04'
                  }}>
                    {item.vehicleNumber}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.ownerName}</div>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 8 }}>
                  Detections: {item.detectionCount} | Last: {item.lastCameraName || 'Never'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid-4" style={{ marginBottom: '2rem' }}>
          <div className="stat-box" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: 'none', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.1)' }}>
            <div className="value" style={{ color: '#1d4ed8' }}>{stats.totalVehicles}</div>
            <div className="label" style={{ color: '#3b82f6', fontWeight: 600 }}>Total Vehicles</div>
          </div>
          <div className="stat-box" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: 'none', boxShadow: '0 4px 6px -1px rgba(34, 197, 94, 0.1)' }}>
            <div className="value" style={{ color: '#15803d' }}>{stats.activeVehicles}</div>
            <div className="label" style={{ color: '#22c55e', fontWeight: 600 }}>Active Now</div>
          </div>
          <div className="stat-box" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: 'none', boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.1)' }}>
            <div className="value" style={{ color: '#b45309' }}>{stats.totalTracking}</div>
            <div className="label" style={{ color: '#f59e0b', fontWeight: 600 }}>Total Detections</div>
          </div>
          <div className="stat-box" style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)', border: 'none', boxShadow: '0 4px 6px -1px rgba(168, 85, 247, 0.1)' }}>
            <div className="value" style={{ color: '#7e22ce' }}>{stats.completedPaths}</div>
            <div className="label" style={{ color: '#a855f7', fontWeight: 600 }}>Completed Paths</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: '#6b7280', marginRight: 8 }}>Status:</label>
            <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '6px 12px' }}>
              <option value="all">All Vehicles</option>
              <option value="active">Active Only</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', color: '#6b7280', marginRight: 8 }}>Type:</label>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '6px 12px' }}>
              {vehicleTypes.map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#6b7280' }}>
            Showing {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Vehicle Type Distribution */}
      {stats && stats.typeDistribution && stats.typeDistribution.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Vehicle Type Distribution</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {stats.typeDistribution.map(item => (
              <div key={item._id} style={{
                flex: '1 1 150px',
                padding: '0.8rem',
                background: '#f3f4f6',
                borderRadius: 8,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563eb' }}>{item.count}</div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', textTransform: 'capitalize' }}>
                  {item._id || 'Unknown'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vehicles List */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Tracked Vehicles</h3>
        {filteredVehicles.length === 0 ? (
          <div className="empty">No vehicles tracked yet</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>Vehicle ID</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>Type</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>Status</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>Cameras</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>First Seen</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>Last Seen</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map(vehicle => (
                  <tr key={vehicle._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {vehicle.vehicleId.substring(0, 12)}...
                    </td>
                    <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>
                      {vehicle.vehicleType === 'car' && '🚗'}
                      {vehicle.vehicleType === 'truck' && '🚚'}
                      {vehicle.vehicleType === 'bus' && '🚌'}
                      {vehicle.vehicleType === 'motorcycle' && '🏍️'}
                      {vehicle.vehicleType === 'bicycle' && '🚲'}
                      {' '}{vehicle.vehicleType}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge badge-${vehicle.isActive ? 'normal' : 'critical'}`}>
                        {vehicle.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{vehicle.totalCameras}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>
                      {new Date(vehicle.firstSeen).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>
                      {new Date(vehicle.lastSeen).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem' }}>
                      <Link to={`/vehicles/${vehicle.vehicleId}`} className="btn btn-sm btn-primary" style={{ borderRadius: '20px', padding: '0.4rem 1rem', fontSize: '0.75rem', fontWeight: 600, boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' }}>
                        View Path
                      </Link>
                    </td>
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
