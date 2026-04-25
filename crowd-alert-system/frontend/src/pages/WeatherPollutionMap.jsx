import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAApCAYAAADAk4LOAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNXG14zYAAAAWdEVYdENyZWF0aW9uIFRpbWUAMDcvMDMvMTNJ5CcdAAAA/0lEQVRYhe2YMQ6DMAxFfwQSJ+AAnIBbcANuwC04ATfgBpyAG3ADTsANOAEnYEQqVd0OqWkTtRIf+Ukt+dlxnMQYY4wxZi9IKgBUkqq7IKkAcJb0LOnS9bnyOkmPkh4kXSW9SHoysUPSVdJT0zSXrutqSQ+SPiRdJH20bXuRdCfpfX5/lXTjV0l5nuf1vy5JkrZt+7uu6+q+7+u2bS/eZ57nxfd933VdV/d9X3dd9znn/Ot9zjn/eZ9t2/5ar/d5v8/7vK/3eV/v8z7v6/3e1/u9r/d7X+/3vt7vfb3f+3q/9/V+7+v93tf7va/3e1/v977e732933uMMcYYY8y/8QNvSSgaKOsCkQAAAABJRU5ErkJggg==',
  iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAApCAYAAADAk4LOAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNXG14zYAAAAWdEVYdENyZWF0aW9uIFRpbWUAMDcvMDMvMTNJ5CcdAAAA/0lEQVRYhe2YMQ6DMAxFfwQSJ+AAnIBbcANuwC04ATfgBpyAG3ADTsANOAEnYEQqVd0OqWkTtRIf+Ukt+dlxnMQYY4wxZi9IKgBUkqq7IKkAcJb0LOnS9bnyOkmPkh4kXSW9SHoysUPSVdJT0zSXrutqSQ+SPiRdJH20bXuRdCfpfX5/lXTjV0l5nuf1vy5JkrZt+7uu6+q+7+u2bS/eZ57nxfd933VdV/d9X3dd9znn/Ot9zjn/eZ9t2/5ar/d5v8/7vK/3eV/v8z7v6/3e1/u9r/d7X+/3vt7vfb3f+3q/9/V+7+v93tf7va/3e1/v977e732933uMMcYYY8y/8QNvSSgaKOsCkQAAAABJRU5ErkJggg==',
  shadowUrl: '',
});

// Component to recenter map
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 12);
    }
  }, [center, map]);
  return null;
}

export default function WeatherPollutionMap() {
  const [weatherData, setWeatherData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // India center
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationAddress, setNewLocationAddress] = useState('');
  const mapRef = useRef(null); // Add ref to prevent re-initialization

  const fetchData = async () => {
    try {
      const [wRes, hRes, sRes] = await Promise.all([
        fetch('/api/weather'),
        fetch('/api/weather/heatmap'),
        fetch('/api/weather/stats'),
      ]);
      
      const weather = await wRes.json();
      const heatmap = await hRes.json();
      
      setWeatherData(weather);
      setHeatmapData(heatmap);
      setStats(await sRes.json());
      
      // Set initial map center to first location with coordinates
      if (heatmap.length > 0 && !userLocation) {
        setMapCenter([heatmap[0].coordinates.lat, heatmap[0].coordinates.lon]);
      }
    } catch (err) {
      console.error('Failed to fetch weather data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
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

  const handleGetCurrentLocation = () => {
    setGettingLocation(true);
    
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lon: longitude });
        setMapCenter([latitude, longitude]);
        setGettingLocation(false);
        
        // Fetch weather for current location
        fetchWeatherForCoordinates(latitude, longitude);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your location. Please enable location services.');
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const fetchWeatherForCoordinates = async (lat, lon) => {
    try {
      // This would call a new endpoint to get weather for any coordinates
      const res = await fetch(`/api/weather/coordinates?lat=${lat}&lon=${lon}`);
      
      if (!res.ok) {
        console.error('Weather API error:', res.status);
        // Show user location without weather data
        setSelectedLocation({
          name: 'Your Location',
          coordinates: { lat, lon },
          weather: null,
          isUserLocation: true,
          error: 'Weather data unavailable. Please add OpenWeatherMap API key.',
        });
        return;
      }
      
      const data = await res.json();
      setSelectedLocation({
        name: 'Your Location',
        coordinates: { lat, lon },
        weather: data,
        isUserLocation: true,
      });
    } catch (err) {
      console.error('Failed to fetch weather for coordinates:', err);
      // Show user location without weather data
      setSelectedLocation({
        name: 'Your Location',
        coordinates: { lat, lon },
        weather: null,
        isUserLocation: true,
        error: 'Weather data unavailable. Please add OpenWeatherMap API key.',
      });
    }
  };

  const handleAddLocationHere = async () => {
    if (!userLocation || !newLocationName) {
      alert('Please enter a location name');
      return;
    }

    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newLocationName,
          coordinates: userLocation,
          address: newLocationAddress || 'Current Location',
        }),
      });

      if (res.ok) {
        alert('Location added successfully!');
        setShowAddForm(false);
        setNewLocationName('');
        setNewLocationAddress('');
        fetchData();
      } else {
        alert('Failed to add location');
      }
    } catch (err) {
      alert('Error adding location');
    }
  };

  const getAQIColor = (aqi) => {
    const colors = {
      1: '#16a34a',
      2: '#84cc16',
      3: '#eab308',
      4: '#f97316',
      5: '#dc2626',
    };
    return colors[aqi] || '#9ca3af';
  };

  const createCustomIcon = (aqi) => {
    const color = getAQIColor(aqi);
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        background: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
      ">${aqi}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  if (loading) {
    return (
      <div className="page">
        <div className="page-title">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="page-title">🗺️ Weather & Pollution Map</div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className="btn"
            onClick={handleGetCurrentLocation}
            disabled={gettingLocation}
            style={{ background: '#2563eb', color: 'white' }}
          >
            {gettingLocation ? '📍 Getting Location...' : '📍 Use My Location'}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleUpdateAll}
            disabled={updating}
          >
            {updating ? 'Updating...' : '🔄 Update All'}
          </button>
        </div>
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

      {/* User Location Info */}
      {userLocation && (
        <div className="card" style={{ marginBottom: '1.5rem', background: '#eff6ff', border: '2px solid #2563eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h3 style={{ marginBottom: '0.5rem' }}>📍 Your Current Location</h3>
              <div style={{ fontSize: '0.9rem', color: '#1e40af' }}>
                Latitude: {userLocation.lat.toFixed(6)}, Longitude: {userLocation.lon.toFixed(6)}
              </div>
              {selectedLocation?.error && (
                <div style={{ 
                  marginTop: '0.5rem', 
                  padding: '0.5rem', 
                  background: '#fef3c7', 
                  border: '1px solid #f59e0b',
                  borderRadius: 6,
                  fontSize: '0.85rem',
                  color: '#92400e'
                }}>
                  ⚠️ {selectedLocation.error}
                </div>
              )}
            </div>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? 'Cancel' : '+ Add as Location'}
            </button>
          </div>
          
          {showAddForm && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'white', borderRadius: 8 }}>
              <div className="form-group">
                <label>Location Name *</label>
                <input
                  value={newLocationName}
                  onChange={e => setNewLocationName(e.target.value)}
                  placeholder="e.g., My Office"
                />
              </div>
              <div className="form-group">
                <label>Address (optional)</label>
                <input
                  value={newLocationAddress}
                  onChange={e => setNewLocationAddress(e.target.value)}
                  placeholder="e.g., Downtown Area"
                />
              </div>
              <button className="btn btn-primary" onClick={handleAddLocationHere}>
                Add Location
              </button>
            </div>
          )}
        </div>
      )}

      {/* Map */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: 0, overflow: 'hidden' }}>
        <div id="weather-map-container" style={{ height: '600px', width: '100%' }}>
          {!loading && (
            <MapContainer
              key="main-map"
              center={mapCenter}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <RecenterMap center={mapCenter} />

            {/* User location marker */}
            {userLocation && (
              <Marker
                position={[userLocation.lat, userLocation.lon]}
                icon={L.divIcon({
                  className: 'custom-user-marker',
                  html: `<div style="
                    background: #2563eb;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 16px;
                  ">📍</div>`,
                  iconSize: [30, 30],
                  iconAnchor: [15, 15],
                })}
              >
                <Popup>
                  <div style={{ minWidth: 200 }}>
                    <strong>📍 Your Location</strong>
                    <div style={{ fontSize: '0.85rem', marginTop: 4 }}>
                      {userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Location markers with AQI */}
            {heatmapData.map(item => (
              <React.Fragment key={item.locationId}>
                <Marker
                  position={[item.coordinates.lat, item.coordinates.lon]}
                  icon={createCustomIcon(item.aqi)}
                  eventHandlers={{
                    click: () => setSelectedLocation(item),
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: 250 }}>
                      <strong style={{ fontSize: '1rem' }}>{item.locationName}</strong>
                      <div style={{ marginTop: 8, marginBottom: 8 }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: 20,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: item.color,
                          color: 'white',
                        }}>
                          AQI {item.aqi} - {item.aqiCategory}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                        <div>👥 Crowd: {item.crowdDensity} people</div>
                        <div style={{ marginTop: 4, fontSize: '0.75rem', padding: '0.5rem', background: '#f3f4f6', borderRadius: 4 }}>
                          {item.correlation}
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
                
                {/* Circle overlay for visual effect */}
                <Circle
                  center={[item.coordinates.lat, item.coordinates.lon]}
                  radius={500}
                  pathOptions={{
                    color: item.color,
                    fillColor: item.color,
                    fillOpacity: 0.2,
                    weight: 2,
                  }}
                />
              </React.Fragment>
            ))}
          </MapContainer>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>🎨 AQI Legend</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#16a34a' }} />
            <span>1 - Good</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#84cc16' }} />
            <span>2 - Fair</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#eab308' }} />
            <span>3 - Moderate</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#f97316' }} />
            <span>4 - Poor</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#dc2626' }} />
            <span>5 - Very Poor</span>
          </div>
        </div>
      </div>

      {/* Selected Location Details */}
      {selectedLocation && !selectedLocation.isUserLocation && (
        <div className="card" style={{ border: `3px solid ${selectedLocation.color}` }}>
          <h3 style={{ marginBottom: '1rem' }}>📍 {selectedLocation.locationName}</h3>
          <div className="grid-2">
            <div>
              <div style={{ fontSize: '3rem', fontWeight: 700, color: selectedLocation.color, marginBottom: 8 }}>
                AQI: {selectedLocation.aqi}
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>
                {selectedLocation.aqiCategory}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                <div>👥 Crowd Density: {selectedLocation.crowdDensity} people</div>
                <div>📍 {selectedLocation.coordinates.lat.toFixed(4)}, {selectedLocation.coordinates.lon.toFixed(4)}</div>
              </div>
            </div>
            <div style={{
              padding: '1rem',
              background: '#f3f4f6',
              borderRadius: 8,
            }}>
              <strong style={{ fontSize: '0.9rem' }}>Correlation Analysis:</strong>
              <div style={{ fontSize: '0.85rem', marginTop: 8 }}>
                {selectedLocation.correlation}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 8 }}>
                Updated: {new Date(selectedLocation.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats Grid */}
      {heatmapData.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>📊 All Locations</h3>
          <div className="grid-3">
            {heatmapData.map(item => (
              <div
                key={item.locationId}
                style={{
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: 8,
                  border: `2px solid ${item.color}`,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setMapCenter([item.coordinates.lat, item.coordinates.lon]);
                  setSelectedLocation(item);
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                  <strong>{item.locationName}</strong>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: 12,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: item.color,
                    color: 'white',
                  }}>
                    {item.aqi}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                  {item.aqiCategory} • {item.crowdDensity} people
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
