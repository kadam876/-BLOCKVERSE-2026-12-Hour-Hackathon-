import React, { useEffect, useState } from 'react';

export default function AlertHistory() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetch('/api/alerts').then(r => r.json()).then(setAlerts);
  }, []);

  return (
    <div className="page">
      <div className="page-title">Alert History</div>
      <div className="card">
        {alerts.length === 0 && <div className="empty">No alerts have been triggered yet</div>}
        {alerts.map(alert => (
          <div className="alert-row" key={alert._id || alert.id} style={{ flexWrap: 'wrap' }}>
            <div style={{ minWidth: '160px' }}>
              <div className="loc">🚨 {alert.locationName}</div>
              <div className="meta">{new Date(alert.timestamp).toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#dc2626' }}>{alert.peopleCount} people detected</div>
              <div className="meta">Threshold: {alert.threshold} | Max/frame: {alert.maxPeopleInFrame}</div>
            </div>
            <div>
              <div className="meta">Avg Density</div>
              <div style={{ fontWeight: 600 }}>{alert.avgDensityLevel}</div>
            </div>
            <span className={`badge badge-${alert.authorityType}`}>{alert.authorityType}</span>
            <span style={{ fontSize: '0.82rem', color: alert.emailSent ? '#16a34a' : '#dc2626' }}>
              {alert.emailSent ? '✅ Email sent' : '❌ Email failed'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
