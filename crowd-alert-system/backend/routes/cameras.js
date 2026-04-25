import express from 'express';
import fetch from 'node-fetch';
import Camera from '../models/Camera.js';
import Location from '../models/Location.js';

const router = express.Router();

// Get all cameras
router.get('/', async (req, res) => {
  const cameras = await Camera.find().populate('locationId');
  res.json(cameras);
});

// Get single camera
router.get('/:id', async (req, res) => {
  const camera = await Camera.findById(req.params.id).populate('locationId');
  if (!camera) return res.status(404).json({ error: 'Camera not found' });
  res.json(camera);
});

// Add new camera
router.post('/', async (req, res) => {
  const { name, cameraUrl, locationId, threshold, alertEmail, faceRecognitionEnabled, vehicleTrackingEnabled } = req.body;
  
  if (!name || !cameraUrl || !locationId) {
    return res.status(400).json({ error: 'Name, camera URL, and location are required' });
  }

  try {
    const location = await Location.findById(locationId);
    if (!location) return res.status(404).json({ error: 'Location not found' });

    const camera = await Camera.create({
      name,
      cameraUrl,
      locationId,
      locationName: location.name,
      threshold: threshold || location.threshold || 20,
      alertEmail: alertEmail || location.authorityEmail,
      faceRecognitionEnabled: faceRecognitionEnabled || false,
      vehicleTrackingEnabled: vehicleTrackingEnabled || false,
    });

    // Auto-start the camera
    try {
      await fetch('http://127.0.0.1:5002/camera/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cameraId: camera._id.toString(),
          cameraUrl: camera.cameraUrl,
          locationId: camera.locationId.toString(),
          threshold: camera.threshold,
          alertEmail: camera.alertEmail,
          faceRecognitionEnabled: camera.faceRecognitionEnabled,
          vehicleTrackingEnabled: camera.vehicleTrackingEnabled,
        }),
      });

      camera.status = 'running';
      await camera.save();
    } catch (err) {
      console.error('Failed to start camera:', err.message);
      camera.status = 'error';
      await camera.save();
    }

    res.status(201).json(camera);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete camera
router.delete('/:id', async (req, res) => {
  try {
    const camera = await Camera.findById(req.params.id);
    if (!camera) return res.status(404).json({ error: 'Camera not found' });

    // Stop camera in Flask
    try {
      await fetch('http://127.0.0.1:5002/camera/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cameraId: camera._id.toString() }),
      });
    } catch (err) {
      console.error('Failed to stop camera:', err.message);
    }

    await Camera.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle camera active status
router.patch('/:id/toggle', async (req, res) => {
  try {
    const camera = await Camera.findById(req.params.id);
    if (!camera) return res.status(404).json({ error: 'Camera not found' });

    if (camera.status === 'running') {
      // Stop camera
      await fetch('http://127.0.0.1:5002/camera/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cameraId: camera._id.toString() }),
      });
      camera.status = 'stopped';
    } else {
      // Start camera
      await fetch('http://127.0.0.1:5002/camera/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cameraId: camera._id.toString(),
          cameraUrl: camera.cameraUrl,
          locationId: camera.locationId.toString(),
          threshold: camera.threshold,
          alertEmail: camera.alertEmail,
          faceRecognitionEnabled: camera.faceRecognitionEnabled,
          vehicleTrackingEnabled: camera.vehicleTrackingEnabled,
        }),
      });
      camera.status = 'running';
    }

    await camera.save();
    res.json(camera);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update camera status (called by Python)
router.patch('/:id/status', async (req, res) => {
  try {
    const { lastCount, lastUpdated } = req.body;
    const camera = await Camera.findById(req.params.id);
    if (!camera) return res.status(404).json({ error: 'Camera not found' });

    const ratio = camera.threshold > 0 ? lastCount / camera.threshold : 0;
    const status = ratio >= 1 ? 'critical' : ratio >= 0.75 ? 'warning' : 'normal';

    camera.lastCount = lastCount;
    camera.lastStatus = status;
    camera.lastUpdated = new Date();
    await camera.save();

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
