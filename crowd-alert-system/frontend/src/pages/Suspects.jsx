import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Suspects() {
  const [suspects, setSuspects] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchSuspects = async () => {
    const res = await fetch('/api/suspects');
    setSuspects(await res.json());
  };

  useEffect(() => {
    fetchSuspects();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!name || !image) {
      setError('Name and image are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('image', image);

      const res = await fetch('/api/suspects', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setShowUpload(false);
      setName('');
      setDescription('');
      setImage(null);
      setPreview('');
      fetchSuspects();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this person?')) return;
    await fetch(`/api/suspects/${id}`, { method: 'DELETE' });
    fetchSuspects();
  };

  const handleToggle = async (id) => {
    await fetch(`/api/suspects/${id}/toggle`, { method: 'PATCH' });
    fetchSuspects();
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div className="page-title">🎯 Person Identification</div>
        <button className="btn btn-primary" onClick={() => setShowUpload(!showUpload)}>
          {showUpload ? 'Cancel' : '+ Add Person'}
        </button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <label>Person Name *</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter full name"
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Physical description, last known location, etc."
              />
            </div>
            <div className="form-group">
              <label>Upload Photo *</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                required
              />
              {preview && (
                <img src={preview} alt="Preview" style={{ marginTop: 10, maxWidth: 200, borderRadius: 8 }} />
              )}
            </div>
            {error && <div style={{ color: '#dc2626', fontSize: '0.88rem', marginBottom: 10 }}>{error}</div>}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Processing...' : 'Upload & Extract Face'}
            </button>
          </form>
        </div>
      )}

      {/* Suspects Grid */}
      <div className="grid-3">
        {suspects.map(suspect => (
          <div className="card" key={suspect._id} style={{ opacity: suspect.isActive ? 1 : 0.5 }}>
            <img
              src={suspect.imageUrl}
              alt={suspect.name}
              style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 10 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <strong>{suspect.name}</strong>
              <span className={`badge ${suspect.isActive ? 'badge-normal' : 'badge-critical'}`}>
                {suspect.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            {suspect.description && (
              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 8 }}>{suspect.description}</div>
            )}
            <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: 10 }}>
              Matches: {suspect.matchCount} | Last seen: {suspect.lastSeen ? new Date(suspect.lastSeen).toLocaleString() : 'Never'}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => navigate(`/suspects/${suspect._id}`)}
                style={{ flex: 1 }}
              >
                View Matches
              </button>
              <button
                className="btn btn-sm"
                onClick={() => handleToggle(suspect._id)}
                style={{ background: suspect.isActive ? '#d97706' : '#16a34a', color: 'white' }}
              >
                {suspect.isActive ? 'Disable' : 'Enable'}
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(suspect._id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {suspects.length === 0 && !showUpload && (
        <div className="empty">No persons in database. Click "Add Person" to upload.</div>
      )}
    </div>
  );
}
