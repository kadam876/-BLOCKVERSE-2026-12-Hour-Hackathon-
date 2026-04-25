import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const STATUS_COLOR = { normal: '#16a34a', warning: '#d97706', critical: '#dc2626' };

export default function Dashboard() {
  const [locations, setLocations] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [vehicleStats, setVehicleStats] = useState(null);
  const [suspects, setSuspects] = useState([]);
  const [liveCounts, setLiveCounts] = useState({}); // locationId -> liveCount event
  const [liveAlerts, setLiveAlerts] = useState([]); // recent socket crowdAlerts
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const fetchData = async () => {
    const [lRes, aRes, cRes, vRes, sRes, vnRes] = await Promise.all([
      fetch('/api/locations'),
      fetch('/api/alerts'),
      fetch('/api/cameras'),
      fetch('/api/vehicles/stats/summary').catch(() => ({ json: () => null })),
      fetch('/api/suspects').catch(() => ({ json: () => [] })),
    ]);
    setLocations(await lRes.json());
    setAlerts(await aRes.json());
    setCameras(await cRes.json());
    const vStats = await vRes.json();
    if (vStats) setVehicleStats(vStats);
    setSuspects(await sRes.json());
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Socket.io — receive live updates
  useEffect(() => {
    const socket = io('http://127.0.0.1:4000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on('liveCount', (data) => {
      setLiveCounts(prev => ({ ...prev, [data.locationId]: data }));
    });

    socket.on('crowdAlert', (data) => {
      setLiveAlerts(prev => [data, ...prev].slice(0, 5));
    });

    socket.on('vehicleDetected', () => {
      // Refresh vehicle stats
      fetch('/api/vehicles/stats/summary')
        .then(r => r.json())
        .then(setVehicleStats)
        .catch(() => {});
    });

    return () => socket.disconnect();
  }, []);

  const getStatus = (loc) => {
    const live = liveCounts[loc._id];
    if (live) return live.status;
    return loc.lastUpdated ? (loc.lastStatus || 'normal') : 'normal';
  };

  const getCount = (loc) => {
    const live = liveCounts[loc._id];
    return live ? live.peopleCount : loc.lastCount;
  };

  const critical = locations.filter(l => getStatus(l) === 'critical').length;
  const warning  = locations.filter(l => getStatus(l) === 'warning').length;
  const normal   = locations.filter(l => getStatus(l) === 'normal').length;
  const hasLive  = Object.keys(liveCounts).length > 0;
  
  // Group cameras by location
  const camerasByLocation = cameras.reduce((acc, cam) => {
    const locId = cam.locationId?._id || cam.locationId;
    if (!acc[locId]) acc[locId] = [];
    acc[locId].push(cam);
    return acc;
  }, {});

  const activeCameras = cameras.filter(c => c.status === 'running').length;
  const activeSuspects = suspects.filter(s => s.isActive).length;

  const S = {
    sectionHeader: {
      display:'flex', alignItems:'center', gap:'10px',
      marginBottom:'1rem', marginTop:'0.5rem',
    },
    sectionTitle: {
      fontSize:'1rem', fontWeight:700, color:'#111827',
      letterSpacing:'-0.01em', margin:0,
    },
    sectionDivider: {
      flex:1, height:'1px', background:'linear-gradient(to right,#e5e7eb,transparent)',
    },
    statCard: (bg, shadow) => ({
      cursor:'pointer', background:bg, border:'none',
      boxShadow:shadow, borderRadius:'14px',
      transition:'transform 0.2s, box-shadow 0.2s', padding:'1.4rem 1.6rem',
    }),
    liveCard: (status) => ({
      cursor:'pointer', border:'none',
      boxShadow:`0 0 0 2px ${STATUS_COLOR[status]}, 0 6px 16px rgba(0,0,0,0.08)`,
      borderRadius:'14px', transition:'all 0.3s cubic-bezier(0.4,0,0.2,1)',
      position:'relative', overflow:'hidden', padding:'1.2rem 1.4rem',
    }),
    locCard: {
      cursor:'pointer', borderRadius:'14px',
      border:'1px solid #f1f5f9',
      boxShadow:'0 2px 8px rgba(0,0,0,0.05)',
      transition:'all 0.25s cubic-bezier(0.4,0,0.2,1)',
      padding:'1.3rem',
    },
    camChip: (running) => ({
      padding:'0.7rem', background: running ? '#f0fdf4' : '#fafafa',
      borderRadius:'10px', border: running ? '1px solid #bbf7d0' : '1px solid #e5e7eb',
      cursor:'pointer', transition:'all 0.2s',
    }),
    alertRow: {
      display:'flex', justifyContent:'space-between', alignItems:'center',
      padding:'0.9rem 1rem', borderRadius:'10px', marginBottom:'0.5rem',
      background:'#fff7ed', border:'1px solid #fed7aa', transition:'background 0.2s',
    },
  };

  return (
    <div className="page" style={{ maxWidth:'1400px', margin:'0 auto' }}>

      {/* ── Page header ─────────────────────────────────── */}
      <div style={{ marginBottom:'2rem', paddingBottom:'1.5rem', borderBottom:'1px solid #f1f5f9' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'4px' }}>
          <div style={{
            width:'42px', height:'42px', borderRadius:'12px',
            background:'linear-gradient(135deg,#3b82f6,#6366f1)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'1.3rem', boxShadow:'0 4px 12px rgba(99,102,241,0.3)',
          }}>🏙️</div>
          <div>
            <h1 style={{ margin:0, fontSize:'1.6rem', fontWeight:800, color:'#0f172a', lineHeight:1.1 }}>
              VisionCity Dashboard
            </h1>
            <p style={{ margin:0, fontSize:'0.85rem', color:'#6b7280', marginTop:'2px' }}>
              Real-time crowd monitoring &amp; surveillance overview
            </p>
          </div>
        </div>
      </div>

      {/* ── System overview stat row ─────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'1rem', marginBottom:'2rem' }}>
        {[
          { label:'Total Locations', value: locations.length, icon:'📍', bg:'linear-gradient(135deg,#eff6ff,#dbeafe)', shadow:'0 4px 12px rgba(59,130,246,0.12)', val:'#1d4ed8', lbl:'#3b82f6', to:'/locations' },
          { label:'Active Cameras',  value:`${activeCameras}/${cameras.length}`, icon:'📹', bg:'linear-gradient(135deg,#f0fdf4,#dcfce7)', shadow:'0 4px 12px rgba(34,197,94,0.12)', val:'#15803d', lbl:'#22c55e', to:'/cameras' },
          { label:'Active Vehicles', value: vehicleStats ? vehicleStats.activeVehicles : 0, icon:'🚗', bg:'linear-gradient(135deg,#fffbeb,#fef3c7)', shadow:'0 4px 12px rgba(245,158,11,0.12)', val:'#b45309', lbl:'#f59e0b', to:'/vehicles' },
          { label:'Watched Persons', value: suspects.length, icon:'👤', bg:'linear-gradient(135deg,#faf5ff,#f3e8ff)', shadow:'0 4px 12px rgba(168,85,247,0.12)', val:'#7e22ce', lbl:'#a855f7', to:'/suspects' },
        ].map(c => (
          <div key={c.label}
            onClick={() => navigate(c.to)}
            style={S.statCard(c.bg, c.shadow)}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=c.shadow.replace('0.12','0.22'); }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=c.shadow; }}>
            <div style={{ fontSize:'1.5rem', marginBottom:'0.5rem' }}>{c.icon}</div>
            <div style={{ fontSize:'2rem', fontWeight:800, color:c.val, lineHeight:1 }}>{c.value}</div>
            <div style={{ fontSize:'0.8rem', color:c.lbl, fontWeight:600, marginTop:'4px' }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* ── Status overview row ──────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'2.5rem' }}>
        {[
          { label:'Critical', value:critical, bg:'linear-gradient(135deg,#fef2f2,#fee2e2)', shadow:'0 4px 12px rgba(220,38,38,0.1)', val:'#b91c1c', lbl:'#ef4444', icon:'🔴' },
          { label:'Warning',  value:warning,  bg:'linear-gradient(135deg,#fffbeb,#fef3c7)', shadow:'0 4px 12px rgba(217,119,6,0.1)',  val:'#b45309', lbl:'#f59e0b', icon:'🟡' },
          { label:'Normal',   value:normal,   bg:'linear-gradient(135deg,#f0fdf4,#dcfce7)', shadow:'0 4px 12px rgba(22,163,74,0.1)',   val:'#15803d', lbl:'#22c55e', icon:'🟢' },
        ].map(c => (
          <div key={c.label} style={{ ...S.statCard(c.bg, c.shadow), display:'flex', alignItems:'center', gap:'1rem' }}>
            <div style={{ fontSize:'2rem' }}>{c.icon}</div>
            <div>
              <div style={{ fontSize:'2rem', fontWeight:800, color:c.val, lineHeight:1 }}>{c.value}</div>
              <div style={{ fontSize:'0.78rem', color:c.lbl, fontWeight:600, marginTop:'2px' }}>{c.label} Locations</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Live Surveillance ────────────────────────────── */}
      {hasLive && (
        <div style={{ marginBottom:'2.5rem' }}>
          <div style={S.sectionHeader}>
            <span style={S.sectionTitle}>📡 Live Surveillance</span>
            <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.78rem', color:'#16a34a', fontWeight:700, background:'#f0fdf4', padding:'2px 10px', borderRadius:'20px', border:'1px solid #bbf7d0' }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#16a34a', display:'inline-block', animation:'pulse 1.2s infinite' }} />
              ACTIVE
            </span>
            <div style={S.sectionDivider} />
          </div>

          {liveAlerts.map((a,i) => (
            <div key={i} style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'10px', padding:'0.75rem 1rem', marginBottom:'0.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'0.88rem' }}>
              <span>🚨 <strong>{a.locationName}</strong> — {a.peopleCount} people (threshold: {a.threshold})</span>
              <span style={{ color:'#6b7280', fontSize:'0.75rem', background:'#fff', padding:'2px 8px', borderRadius:'6px', border:'1px solid #f3f4f6' }}>{new Date(a.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}

          <div className="grid-3" style={{ marginTop:'1rem' }}>
            {Object.values(liveCounts).map(live => (
              <div key={live.locationId}
                onClick={() => navigate('/live')}
                style={S.liveCard(live.status)}
                onMouseEnter={e => e.currentTarget.style.transform='translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
                <div style={{ position:'absolute', top:0, left:0, width:'5px', height:'100%', background:STATUS_COLOR[live.status], borderRadius:'14px 0 0 14px' }} />
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, paddingLeft:8 }}>
                  <strong style={{ color:'#111827', fontSize:'1rem' }}>{live.locationName}</strong>
                  <span className={`badge badge-${live.status}`}>{live.status}</span>
                </div>
                <div style={{ fontSize:'2.8rem', fontWeight:900, color:STATUS_COLOR[live.status], paddingLeft:8, lineHeight:1 }}>
                  {live.peopleCount}
                  <span style={{ fontSize:'1rem', color:'#9ca3af', fontWeight:500 }}> / {live.threshold}</span>
                </div>
                <div style={{ fontSize:'0.75rem', color:'#6b7280', marginTop:10, paddingLeft:8, display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:'#3b82f6', display:'inline-block', animation:'pulse 1s infinite' }} />
                  Live feed active
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Camera Overview ──────────────────────────────── */}
      {cameras.length > 0 && (
        <div style={{ marginBottom:'2.5rem' }}>
          <div style={S.sectionHeader}>
            <span style={S.sectionTitle}>📹 Camera Overview</span>
            <span style={{ fontSize:'0.78rem', background:'#eff6ff', color:'#3b82f6', padding:'2px 10px', borderRadius:'20px', border:'1px solid #bfdbfe', fontWeight:600 }}>
              {activeCameras} live
            </span>
            <div style={S.sectionDivider} />
          </div>
          <div className="card" style={{ borderRadius:'16px' }}>
            {locations.map(loc => {
              const locCameras = camerasByLocation[loc._id] || [];
              if (locCameras.length === 0) return null;
              return (
                <div key={loc._id} style={{ marginBottom:'1.5rem', paddingBottom:'1.5rem', borderBottom:'1px solid #f1f5f9' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.9rem' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:'#3b82f6' }} />
                      <strong style={{ fontSize:'0.95rem', color:'#111827' }}>{loc.name}</strong>
                      <span style={{ fontSize:'0.78rem', color:'#9ca3af', background:'#f9fafb', padding:'1px 8px', borderRadius:'10px', border:'1px solid #e5e7eb' }}>
                        {locCameras.length} cam{locCameras.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className={`badge badge-${loc.department}`}>{loc.department}</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'0.7rem' }}>
                    {locCameras.map(cam => (
                      <div key={cam._id} style={S.camChip(cam.status === 'running')}
                        onClick={() => navigate('/cameras')}
                        onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                          <div style={{ fontWeight:600, fontSize:'0.88rem', color:'#111827' }}>📹 {cam.name}</div>
                          <span style={{ padding:'2px 8px', borderRadius:'10px', fontSize:'0.68rem', fontWeight:700, background: cam.status === 'running' ? '#dcfce7' : '#fee2e2', color: cam.status === 'running' ? '#15803d' : '#b91c1c' }}>
                            {cam.status === 'running' ? '● LIVE' : '○ OFF'}
                          </span>
                        </div>
                        {cam.status === 'running' && (
                          <div style={{ fontSize:'0.82rem', marginBottom:3, color:'#374151' }}>
                            <span style={{ fontWeight:700, color:'#2563eb' }}>{cam.lastCount || 0}</span>
                            <span style={{ color:'#9ca3af' }}> / {cam.threshold} people</span>
                          </div>
                        )}
                        <div style={{ fontSize:'0.7rem', color:'#9ca3af', display:'flex', gap:8, flexWrap:'wrap' }}>
                          {cam.faceRecognitionEnabled && <span>🎯 Face</span>}
                          {cam.vehicleTrackingEnabled && <span>🚗 Vehicle</span>}
                          {cam.lastUpdated && <span>• {new Date(cam.lastUpdated).toLocaleTimeString()}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {cameras.filter(c => !c.locationId).length > 0 && (
              <div>
                <div style={{ fontSize:'0.88rem', fontWeight:600, color:'#9ca3af', marginBottom:'0.7rem' }}>📹 Unassigned Cameras</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'0.7rem' }}>
                  {cameras.filter(c => !c.locationId).map(cam => (
                    <div key={cam._id} style={{ padding:'0.7rem', background:'#fafafa', borderRadius:'10px', border:'1px solid #e5e7eb' }}>
                      <div style={{ fontWeight:600, fontSize:'0.88rem', color:'#374151' }}>📹 {cam.name}</div>
                      <div style={{ fontSize:'0.72rem', color:'#dc2626', marginTop:'2px' }}>No location assigned</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Location Status cards ─────────────────────────── */}
      <div style={{ marginBottom:'2.5rem' }}>
        <div style={S.sectionHeader}>
          <span style={S.sectionTitle}>📍 Location Status</span>
          <div style={S.sectionDivider} />
          <button onClick={() => navigate('/locations')} style={{ fontSize:'0.78rem', background:'#f1f5f9', border:'none', padding:'4px 12px', borderRadius:'20px', cursor:'pointer', color:'#475569', fontWeight:600 }}>
            View All →
          </button>
        </div>
        {locations.length === 0 ? (
          <div className="card" style={{ textAlign:'center', padding:'3rem', borderRadius:'16px' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>📍</div>
            <div style={{ color:'#6b7280', fontWeight:500 }}>No locations configured yet</div>
          </div>
        ) : (
          <div className="grid-3">
            {locations.map(loc => {
              const status = getStatus(loc);
              const count  = getCount(loc);
              const pct = loc.threshold > 0 ? Math.min((count / loc.threshold) * 100, 100) : 0;
              const isLive = !!liveCounts[loc._id];
              return (
                <div className="card" key={loc._id}
                  onClick={() => navigate(`/locations/${loc._id}`)}
                  style={S.locCard}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 12px 24px rgba(0,0,0,0.09)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.05)'; }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.6rem' }}>
                    <strong style={{ color:'#0f172a', fontSize:'0.95rem' }}>{loc.name}</strong>
                    <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                      {isLive && <span style={{ width:7, height:7, borderRadius:'50%', background:'#16a34a', display:'inline-block', animation:'pulse 1.2s infinite' }} />}
                      <span className={`badge badge-${status}`}>{status}</span>
                    </div>
                  </div>
                  {loc.isConfigured ? (
                    <>
                      <div style={{ marginBottom:'0.5rem' }}>
                        <span className={`badge badge-${loc.department}`}>{loc.department}</span>
                      </div>
                      <div style={{ fontSize:'1.5rem', fontWeight:800, color:STATUS_COLOR[status], marginBottom:'0.6rem' }}>
                        {count}
                        <span style={{ fontSize:'0.82rem', color:'#9ca3af', fontWeight:400 }}> / {loc.threshold} limit</span>
                      </div>
                      <div style={{ height:'8px', borderRadius:'8px', background:'#f1f5f9', overflow:'hidden' }}>
                        <div style={{ width:`${pct}%`, height:'100%', borderRadius:'8px', background:STATUS_COLOR[status], transition:'width 0.5s cubic-bezier(0.4,0,0.2,1)' }} />
                      </div>
                      <div style={{ fontSize:'0.72rem', color:'#9ca3af', marginTop:6 }}>
                        {isLive ? '📡 Live detection active' : loc.lastUpdated ? `Updated: ${new Date(loc.lastUpdated).toLocaleString()}` : 'Not tested yet'}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize:'0.82rem', color:'#9ca3af', marginTop:'4px', display:'flex', alignItems:'center', gap:6 }}>
                      <span>⚙️</span> Setup required
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Vehicle Tracking overview ─────────────────────── */}
      {vehicleStats && vehicleStats.totalVehicles > 0 && (
        <div style={{ marginBottom:'2.5rem' }}>
          <div style={S.sectionHeader}>
            <span style={S.sectionTitle}>🚗 Vehicle Tracking</span>
            <div style={S.sectionDivider} />
            <button onClick={() => navigate('/vehicles')} style={{ fontSize:'0.78rem', background:'#f1f5f9', border:'none', padding:'4px 12px', borderRadius:'20px', cursor:'pointer', color:'#475569', fontWeight:600 }}>
              View All →
            </button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
            {[
              { label:'Total Vehicles',    value:vehicleStats.totalVehicles,    bg:'linear-gradient(135deg,#eff6ff,#dbeafe)', shadow:'0 4px 12px rgba(59,130,246,0.1)',  val:'#1d4ed8', lbl:'#3b82f6', icon:'🚙', to:'/vehicles' },
              { label:'Active Now',        value:vehicleStats.activeVehicles,    bg:'linear-gradient(135deg,#f0fdf4,#dcfce7)', shadow:'0 4px 12px rgba(34,197,94,0.1)',   val:'#15803d', lbl:'#22c55e', icon:'✅', to:'/vehicles' },
              { label:'Total Detections',  value:vehicleStats.totalTracking,     bg:'linear-gradient(135deg,#fffbeb,#fef3c7)', shadow:'0 4px 12px rgba(245,158,11,0.1)', val:'#b45309', lbl:'#f59e0b', icon:'📊', to:null },
              { label:'Completed Paths',   value:vehicleStats.completedPaths,    bg:'linear-gradient(135deg,#faf5ff,#f3e8ff)', shadow:'0 4px 12px rgba(168,85,247,0.1)', val:'#7e22ce', lbl:'#a855f7', icon:'🛤️', to:null },
            ].map(c => (
              <div key={c.label}
                onClick={() => c.to && navigate(c.to)}
                style={{ ...S.statCard(c.bg, c.shadow), cursor: c.to ? 'pointer' : 'default' }}
                onMouseEnter={e => { if(c.to) e.currentTarget.style.transform='translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; }}>
                <div style={{ fontSize:'1.4rem', marginBottom:'0.4rem' }}>{c.icon}</div>
                <div style={{ fontSize:'1.8rem', fontWeight:800, color:c.val, lineHeight:1 }}>{c.value}</div>
                <div style={{ fontSize:'0.75rem', color:c.lbl, fontWeight:600, marginTop:'4px' }}>{c.label}</div>
              </div>
            ))}
          </div>
          {vehicleStats.typeDistribution && vehicleStats.typeDistribution.length > 0 && (
            <div className="card" style={{ borderRadius:'16px' }}>
              <div style={{ fontSize:'0.9rem', fontWeight:700, color:'#374151', marginBottom:'1rem' }}>Vehicle Type Distribution</div>
              <div style={{ display:'flex', gap:'0.8rem', flexWrap:'wrap' }}>
                {vehicleStats.typeDistribution.map(item => {
                  const icons = { car:'🚗', truck:'🚚', bus:'🚌', motorcycle:'🏍️', bicycle:'🚲' };
                  return (
                    <div key={item._id} style={{ flex:'1 1 110px', padding:'0.9rem', background:'linear-gradient(135deg,#f8fafc,#f1f5f9)', borderRadius:'12px', textAlign:'center', border:'1px solid #e2e8f0' }}>
                      <div style={{ fontSize:'1.8rem', marginBottom:4 }}>{icons[item._id] || '🚙'}</div>
                      <div style={{ fontSize:'1.4rem', fontWeight:800, color:'#1d4ed8' }}>{item.count}</div>
                      <div style={{ fontSize:'0.75rem', color:'#64748b', textTransform:'capitalize', marginTop:2 }}>{item._id || 'Unknown'}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Recent Alerts ─────────────────────────────────── */}
      <div style={{ marginBottom:'2rem' }}>
        <div style={S.sectionHeader}>
          <span style={S.sectionTitle}>🚨 Recent Alerts</span>
          <div style={S.sectionDivider} />
        </div>
        <div className="card" style={{ borderRadius:'16px', padding:'1.2rem' }}>
          {alerts.length === 0 ? (
            <div style={{ textAlign:'center', padding:'2.5rem', color:'#9ca3af' }}>
              <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>✅</div>
              <div style={{ fontWeight:500 }}>No alerts yet — all locations normal</div>
            </div>
          ) : (
            alerts.slice(0, 5).map(alert => (
              <div key={alert._id} style={S.alertRow}
                onMouseEnter={e => e.currentTarget.style.background='#fff1e6'}
                onMouseLeave={e => e.currentTarget.style.background='#fff7ed'}>
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:38, height:38, borderRadius:'10px', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', flexShrink:0 }}>🚨</div>
                  <div>
                    <div style={{ fontWeight:700, color:'#111827', fontSize:'0.9rem' }}>{alert.locationName}</div>
                    <div style={{ fontSize:'0.75rem', color:'#9ca3af' }}>{new Date(alert.timestamp).toLocaleString()}</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'1rem', flexShrink:0 }}>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:800, color:'#dc2626', fontSize:'0.95rem' }}>{alert.peopleCount} people</div>
                    <div style={{ fontSize:'0.72rem', color:'#9ca3af' }}>Threshold: {alert.threshold}</div>
                  </div>
                  <span className={`badge badge-${alert.department}`}>{alert.department}</span>
                  <span style={{ fontSize:'0.75rem', color: alert.emailSent ? '#16a34a' : '#dc2626', background: alert.emailSent ? '#f0fdf4' : '#fef2f2', padding:'3px 10px', borderRadius:'20px', fontWeight:600, border: alert.emailSent ? '1px solid #bbf7d0' : '1px solid #fecaca' }}>
                    {alert.emailSent ? '✅ Sent' : '❌ Failed'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}


