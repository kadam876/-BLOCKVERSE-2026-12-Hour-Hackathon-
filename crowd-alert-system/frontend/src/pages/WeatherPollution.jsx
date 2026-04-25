import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function WeatherPollution() {
  const [weatherData, setWeatherData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [stats, setStats] = useState(null);
  const [correlation, setCorrelation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchData = async () => {
    try {
      const [wRes, hRes, sRes, cRes] = await Promise.all([
        fetch('/api/weather'),
        fetch('/api/weather/heatmap'),
        fetch('/api/weather/stats'),
        fetch('/api/weather/correlation'),
      ]);
      
      setWeatherData(await wRes.json());
      setHeatmapData(await hRes.json());
      setStats(await sRes.json());
      setCorrelation(await cRes.json());
    } catch (err) {
      console.error('Failed to fetch weather data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const handleUpdateAll = async () => {
    setUpdating(true);
    try {
      const res = await fetch('/api/weather/update-all', { method: 'POST' });
      const result = await res.json();
      alert(`Updated ${result.updated} locations successfully`);
      fetchData();
    } catch (err) {
      alert('Failed to update weather data');
    } finally {
      setUpdating(false);
    }
  };

  const getAQIColor = (aqi) => {
    const colors = {
      1: '#16a34a', // Green
      2: '#84cc16', // Light Green
      3: '#eab308', // Yellow
      4: '#f97316', // Orange
      5: '#dc2626', // Red
    };
    return colors[aqi] || '#9ca3af';
  };

  const getAQILabel = (aqi) => {
    const labels = {
      1: 'Good',
      2: 'Fair',
      3: 'Moderate',
      4: 'Poor',
      5: 'Very Poor',
    };
    return labels[aqi] || 'Unknown';
  };

  if (loading) {
    return (
      <div className="page">
        <div className="page-title">Loading weather data...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div className="page-title">🌤️ Weather & Pollution Monitor</div>
        <button
          className="btn btn-primary"
          onClick={handleUpdateAll}
          disabled={updating}
        >
          {updating ? 'Updating...' : '🔄 Update All'}
        </button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-box card">
            <div className="value" style={{ color: '#2563eb' }}>{stats.totalLocations}</div>
            <div className="label">Monitored Locations</div>
          </div>
          <div className="stat-box card">
            <div className="value" style={{ color: '#16a34a' }}>{stats.good + stats.fair}</div>
            <div className="label">Good Air Quality</div>
          </div>
          <div className="stat-box card">
            <div className="value" style={{ color: '#f97316' }}>{stats.poor + stats.veryPoor}</div>
            <div className="label">Poor Air Quality</div>
          </div>
          <div className="stat-box card">
            <div className="value" style={{ color: '#d97706' }}>{stats.avgTemperature}°C</div>
            <div className="label">Avg Temperature</div>
          </div>
        </div>
      )}

      {/* AQI Distribution */}
      {stats && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Air Quality Distribution</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 150px', padding: '1rem', background: '#d1fae5', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#065f46' }}>{stats.good}</div>
              <div style={{ fontSize: '0.85rem', color: '#065f46' }}>Good</div>
            </div>
            <div style={{ flex: '1 1 150px', padding: '1rem', background: '#d9f99d', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#3f6212' }}>{stats.fair}</div>
              <div style={{ fontSize: '0.85rem', color: '#3f6212' }}>Fair</div>
            </div>
            <div style={{ flex: '1 1 150px', padding: '1rem', background: '#fef3c7', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#92400e' }}>{stats.moderate}</div>
              <div style={{ fontSize: '0.85rem', color: '#92400e' }}>Moderate</div>
            </div>
            <div style={{ flex: '1 1 150px', padding: '1rem', background: '#fed7aa', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#9a3412' }}>{stats.poor}</div>
              <div style={{ fontSize: '0.85rem', color: '#9a3412' }}>Poor</div>
            </div>
            <div style={{ flex: '1 1 150px', padding: '1rem', background: '#fecaca', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#991b1b' }}>{stats.veryPoor}</div>
              <div style={{ fontSize: '0.85rem', color: '#991b1b' }}>Very Poor</div>
            </div>
          </div>
        </div>
      )}

      {/* Pollution Heatmap */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>📍 Pollution Heatmap</h3>
        {heatmapData.length === 0 ? (
          <div className="empty">No pollution data available. Add coordinates to locations.</div>
        ) : (
          <div className="grid-3">
            {heatmapData.map(item => (
              <div
                key={item.locationId}
                className="card"
                style={{
                  border: `3px solid ${item.color}`,
                  background: `${item.color}15`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                  <strong>{item.locationName}</strong>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 20,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: item.color,
                    color: 'white',
                  }}>
                    {item.aqiCategory}
                  </span>
                </div>
                
                <div style={{ fontSize: '2rem', fontWeight: 700, color: item.color, marginBottom: 8 }}>
                  AQI: {item.aqi}
                </div>
                
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 8 }}>
                  <div>👥 Crowd: {item.crowdDensity} people</div>
                  <div>📍 {item.coordinates.lat.toFixed(4)}, {item.coordinates.lon.toFixed(4)}</div>
                </div>
                
                <div style={{
                  fontSize: '0.75rem',
                  padding: '0.5rem',
                  background: '#f3f4f6',
                  borderRadius: 6,
                  marginTop: 8,
                }}>
                  {item.correlation}
                </div>
                
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 8 }}>
                  Updated: {new Date(item.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detailed Weather Data */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>🌡️ Detailed Weather Data</h3>
        {weatherData.length === 0 ? (
          <div className="empty">No weather data available</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>Location</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>Temperature</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>Weather</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>Humidity</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>Wind</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>AQI</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>PM2.5</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>PM10</th>
                </tr>
              </thead>
              <tbody>
                {weatherData.map(item => {
                  const w = item.weather;
                  if (!w) return null;
                  
                  return (
                    <tr key={item.locationId} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>{item.locationName}</td>
                      <td style={{ padding: '0.75rem' }}>
                        {w.temperature.current.toFixed(1)}°C
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                          Feels: {w.temperature.feelsLike.toFixed(1)}°C
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>
                        {w.weatherDescription}
                      </td>
                      <td style={{ padding: '0.75rem' }}>{w.humidity}%</td>
                      <td style={{ padding: '0.75rem' }}>{w.windSpeed.toFixed(1)} m/s</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: getAQIColor(w.aqi.value),
                          color: 'white',
                        }}>
                          {w.aqi.value} - {w.aqi.category}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>{w.aqi.components.pm2_5.toFixed(1)} μg/m³</td>
                      <td style={{ padding: '0.75rem' }}>{w.aqi.components.pm10.toFixed(1)} μg/m³</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Correlation Analysis */}
      {correlation && Object.keys(correlation).length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>📊 Crowd-Pollution Correlation Analysis</h3>
          <div className="grid-2">
            {Object.entries(correlation).map(([locId, data]) => (
              <div key={locId} style={{
                padding: '1rem',
                background: '#f9fafb',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
              }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>{data.locationName}</div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 8 }}>
                  <div>📊 Samples: {data.samples}</div>
                  <div>👥 Avg Crowd: {data.avgCrowdDensity} people</div>
                  <div>🌫️ Avg AQI: {data.avgAQI}</div>
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  padding: '0.5rem',
                  background: '#fff',
                  borderRadius: 6,
                  border: '1px solid #e5e7eb',
                }}>
                  {data.correlation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
