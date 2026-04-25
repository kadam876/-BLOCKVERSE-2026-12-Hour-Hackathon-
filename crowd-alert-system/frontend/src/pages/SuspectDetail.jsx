import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function SuspectDetail() {
  const { id } = useParams();
  const [suspect, setSuspect] = useState(null);
  const [matches, setMatches] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      fetch(`/api/suspects/${id}`).then(r => r.json()),
      fetch(`/api/suspects/${id}/matches`).then(r => r.json()),
    ]).then(([s, m]) => {
      setSuspect(s);
      setMatches(m);
    });
  }, [id]);

  if (!suspect) return <div className="page"><div className="spinner" /></div>;

  return (
    <div className="page">
      <button className="btn btn-sm" onClick={() => navigate('/suspects')} style={{ marginBottom: '1rem' }}>
        ← Back to Person Identity
      </button>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1.5rem' }}>
          <img
            src={suspect.imageUrl}
            alt={suspect.name}
            style={{ width: '100%', borderRadius: 8 }}
          />
          <div>
            <h2 style={{ margin: '0 0 0.5rem 0' }}>{suspect.name}</h2>
            <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: 10 }}>
              {suspect.description || 'No description'}
            </div>
            <div style={{ display: 'flex', gap: 10, fontSize: '0.85rem' }}>
              <span className={`badge badge-${suspect.isActive ? 'normal' : 'critical'}`}>
                {suspect.isActive ? 'Active' : 'Inactive'}
              </span>
              <span>Total Matches: <strong>{suspect.matchCount}</strong></span>
              <span>Last Seen: <strong>{suspect.lastSeen ? new Date(suspect.lastSeen).toLocaleString() : 'Never'}</strong></span>
            </div>
          </div>
        </div>
      </div>

      <div className="page-title" style={{ fontSize: '1.1rem' }}>Match History</div>
      <div className="card">
        {matches.length === 0 && <div className="empty">No matches recorded yet</div>}
        {matches.map(match => (
          <div className="alert-row" key={match._id}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {match.snapshotUrl && (
                <img
                  src={match.snapshotUrl}
                  alt="Match snapshot"
                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
                />
              )}
              <div>
                <div className="loc">
                  {match.locationId ? '📍' : '📁'} {match.locationName}
                </div>
                <div className="meta">{new Date(match.timestamp).toLocaleString()}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, color: '#16a34a' }}>{(match.confidence * 100).toFixed(1)}% match</div>
              <div className="meta">{match.emailSent ? '✅ Email sent' : '❌ Email failed'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
