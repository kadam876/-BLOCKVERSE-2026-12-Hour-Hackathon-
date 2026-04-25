import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Locations() {
  const [locations, setLocations] = useState([]);
  const [name, setName] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [address, setAddress] = useState('');
  const [threshold, setThreshold] = useState('');
  const [department, setDepartment] = useState('');
  const [authorityEmail, setAuthorityEmail] = useState('');
  const [error, setError] = useState('');
  
  // Time-based threshold states
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [showTimeThresholdForm, setShowTimeThresholdForm] = useState(false);
  const [timeThresholdName, setTimeThresholdName] = useState('');
  const [timeThresholdStartTime, setTimeThresholdStartTime] = useState('08:00');
  const [timeThresholdEndTime, setTimeThresholdEndTime] = useState('10:00');
  const [timeThresholdValue, setTimeThresholdValue] = useState('');
  const [timeThresholdDays, setTimeThresholdDays] = useState(['All']);
  
  const navigate = useNavigate();

  const fetchLocations = () =>
    fetch('/api/locations').then(r => r.json()).then(setLocations);

  useEffect(() => { fetchLocations(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    
    const payload = { name };
    if (lat && lon) {
      payload.coordinates = { lat: parseFloat(lat), lon: parseFloat(lon) };
    }
    if (address) {
      payload.address = address;
    }
    if (threshold) {
      payload.threshold = parseInt(threshold);
    }
    if (department) {
      payload.department = department;
    }
    if (authorityEmail) {
      payload.authorityEmail = authorityEmail;
    }
    
    const res = await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error); return; }
    setName('');
    setLat('');
    setLon('');
    setAddress('');
    setThreshold('');
    setDepartment('');
    setAuthorityEmail('');
    fetchLocations();
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await fetch(`/api/locations/${id}`, { method: 'DELETE' });
    fetchLocations();
  };

  const handleAddTimeThreshold = async (e) => {
    e.preventDefault();
    if (!selectedLocationId || !timeThresholdName || !timeThresholdValue) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const res = await fetch(`/api/locations/${selectedLocationId}/time-thresholds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: timeThresholdName,
          startTime: timeThresholdStartTime,
          endTime: timeThresholdEndTime,
          threshold: parseInt(timeThresholdValue),
          daysOfWeek: timeThresholdDays,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        alert('Error: ' + d.error);
        return;
      }

      // Reset form
      setTimeThresholdName('');
      setTimeThresholdStartTime('08:00');
      setTimeThresholdEndTime('10:00');
      setTimeThresholdValue('');
      setTimeThresholdDays(['All']);
      setShowTimeThresholdForm(false);
      fetchLocations();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteTimeThreshold = async (locationId, thresholdId) => {
    if (!confirm('Delete this time-based threshold?')) return;
    try {
      await fetch(`/api/locations/${locationId}/time-thresholds/${thresholdId}`, {
        method: 'DELETE',
      });
      fetchLocations();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="page">
      <div className="page-title">Locations</div>

      {/* Add form */}
      <div className="card" style={{ maxWidth: 600, marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Add New Location</h3>
        <form onSubmit={handleAdd}>
          <div className="form-group">
            <label>Location Name *</label>
            <input placeholder="e.g. Bus Stand B" value={name}
              onChange={e => setName(e.target.value)} required />
          </div>
          
          <div className="grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Threshold (People Count) *</label>
              <input
                type="number"
                placeholder="e.g. 20"
                value={threshold}
                onChange={e => setThreshold(e.target.value)}
                required
                min="1"
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Department *</label>
              <select value={department} onChange={e => setDepartment(e.target.value)} required>
                <option value="">— select department —</option>
                <option value="POLICE">POLICE</option>
                <option value="SECURITY">SECURITY</option>
                <option value="TRAFFIC">TRAFFIC</option>
                <option value="EMERGENCY">EMERGENCY</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Authority Email *</label>
            <input
              type="email"
              placeholder="e.g. authority@example.com"
              value={authorityEmail}
              onChange={e => setAuthorityEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Latitude (optional)</label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 19.0760"
                value={lat}
                onChange={e => setLat(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Longitude (optional)</label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 72.8777"
                value={lon}
                onChange={e => setLon(e.target.value)}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Address (optional)</label>
            <input
              placeholder="e.g. Mumbai, Maharashtra"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>
          
          <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '1rem', padding: '0.5rem', background: '#f3f4f6', borderRadius: 6 }}>
            💡 Add coordinates to enable weather & pollution monitoring
          </div>
          
          <button className="btn btn-primary" type="submit">
            Add Location
          </button>
        </form>
        {error && <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.5rem' }}>{error}</div>}
      </div>

      {/* Location cards */}
      <div className="grid-3">
        {locations.length === 0 && <div className="empty">No locations added yet</div>}
        {locations.map(loc => (
          <div key={loc._id} className="card"
            onClick={() => navigate(`/locations/${loc._id}`)}
            style={{ cursor: 'pointer', transition: 'transform 0.15s', position: 'relative' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.4rem' }}>{loc.name}</div>
                {loc.isConfigured ? (
                  <span className={`badge badge-${loc.department}`}>{loc.department}</span>
                ) : (
                  <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>⚙️ Setup Required</span>
                )}
              </div>
              <button className="btn btn-danger btn-sm"
                onClick={e => handleDelete(e, loc._id)}>✕</button>
            </div>

            {loc.isConfigured && (
              <div style={{ marginTop: '0.8rem', fontSize: '0.85rem', color: '#6b7280' }}>
                <div>Threshold: <strong>{loc.threshold} people</strong></div>
                {loc.timeBasedThresholds && loc.timeBasedThresholds.length > 0 && (
                  <div style={{ marginTop: '0.4rem', padding: '0.6rem', background: '#f0fdf4', borderRadius: 4, border: '1px solid #86efac' }}>
                    <div style={{ fontWeight: 600, color: '#16a34a', marginBottom: '0.4rem' }}>
                      ⏰ {loc.timeBasedThresholds.length} Time-Based Threshold{loc.timeBasedThresholds.length !== 1 ? 's' : ''}
                    </div>
                    {loc.timeBasedThresholds.map((tt, idx) => (
                      <div key={idx} style={{ fontSize: '0.75rem', color: '#15803d', marginBottom: idx < loc.timeBasedThresholds.length - 1 ? '0.3rem' : 0 }}>
                        • {tt.name}: {tt.startTime}-{tt.endTime} ({tt.threshold} people)
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: '0.6rem' }}>Last count: <strong>{loc.lastCount}</strong></div>
                {loc.coordinates && (
                  <div style={{ fontSize: '0.75rem', marginTop: 4 }}>
                    📍 {loc.coordinates.lat.toFixed(4)}, {loc.coordinates.lon.toFixed(4)}
                  </div>
                )}
                <div style={{ marginTop: '0.6rem' }}>
                  <span className={`badge badge-${loc.lastStatus}`}>{loc.lastStatus}</span>
                  {loc.coordinates && <span style={{ marginLeft: 6, fontSize: '0.75rem' }}>🌤️ Weather enabled</span>}
                </div>
              </div>
            )}

            {!loc.isConfigured && (
              <div style={{ marginTop: '0.8rem', fontSize: '0.82rem', color: '#9ca3af' }}>
                Click to complete setup →
              </div>
            )}
            
            {loc.isConfigured && (
              <button 
                className="btn btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedLocationId(loc._id);
                  setShowTimeThresholdForm(true);
                }}
                style={{ marginTop: '1rem', width: '100%', background: '#3b82f6', color: 'white', fontWeight: 600, padding: '0.6rem' }}
              >
                ⏰ {loc.timeBasedThresholds && loc.timeBasedThresholds.length > 0 ? 'View & Manage' : 'Add'} Thresholds
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Time-Based Threshold Management */}
      {showTimeThresholdForm && selectedLocationId && (
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
        }} onClick={() => setShowTimeThresholdForm(false)}>
          <div className="card" style={{ maxWidth: 500, maxHeight: '80vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, marginBottom: '0.3rem' }}>⏰ Time-Based Thresholds</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>
                  {locations.find(l => l._id === selectedLocationId)?.name}
                </p>
              </div>
              <button
                className="btn btn-sm"
                onClick={() => setShowTimeThresholdForm(false)}
                style={{ background: '#6b7280', color: 'white' }}
              >
                ✕
              </button>
            </div>

            {/* Show existing time-based thresholds first */}
            {locations.find(l => l._id === selectedLocationId)?.timeBasedThresholds?.length > 0 && (
              <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                <h4 style={{ marginBottom: '1rem', color: '#1f2937' }}>Configured Thresholds</h4>
                {locations.find(l => l._id === selectedLocationId).timeBasedThresholds.map((tt, idx) => (
                  <div key={tt._id || idx} style={{
                    padding: '0.8rem',
                    background: '#f0fdf4',
                    borderRadius: 6,
                    marginBottom: '0.8rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid #86efac',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#16a34a' }}>{tt.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.3rem' }}>
                        🕐 {tt.startTime} - {tt.endTime}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        👥 {tt.threshold} people
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.3rem' }}>
                        📅 {tt.daysOfWeek.join(', ')}
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteTimeThreshold(selectedLocationId, tt._id)}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}

            <h4 style={{ marginBottom: '1rem', color: '#1f2937' }}>
              {locations.find(l => l._id === selectedLocationId)?.timeBasedThresholds?.length > 0 ? 'Add More Threshold' : 'Add New Threshold'}
            </h4>

            <form onSubmit={handleAddTimeThreshold}>
              <div className="form-group">
                <label>Threshold Name *</label>
                <input
                  placeholder="e.g. Morning Rush, Peak Hours, Night"
                  value={timeThresholdName}
                  onChange={e => setTimeThresholdName(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Start Time *</label>
                  <input
                    type="time"
                    value={timeThresholdStartTime}
                    onChange={e => setTimeThresholdStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>End Time *</label>
                  <input
                    type="time"
                    value={timeThresholdEndTime}
                    onChange={e => setTimeThresholdEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Threshold Value (People Count) *</label>
                <input
                  type="number"
                  placeholder="e.g. 30"
                  value={timeThresholdValue}
                  onChange={e => setTimeThresholdValue(e.target.value)}
                  required
                  min="1"
                />
              </div>

              <div className="form-group">
                <label>Days of Week</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input
                        type="checkbox"
                        checked={timeThresholdDays.includes(day)}
                        onChange={(e) => {
                          if (day === 'All') {
                            setTimeThresholdDays(e.target.checked ? ['All'] : []);
                          } else {
                            const newDays = timeThresholdDays.filter(d => d !== 'All');
                            if (e.target.checked) {
                              setTimeThresholdDays([...newDays, day]);
                            } else {
                              setTimeThresholdDays(newDays.filter(d => d !== day));
                            }
                          }
                        }}
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowTimeThresholdForm(false)}
                  style={{ background: '#e5e7eb' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Add Threshold
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
