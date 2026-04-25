import express from 'express';
import VehicleNumber from '../models/VehicleNumber.js';
import { io } from '../server.js';
import { sendVehicleWatchlistEmail } from '../services/emailService.js';

const cooldowns = {};
const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes between emails per vehicle

const router = express.Router();

// Get all vehicle numbers
router.get('/', async (req, res) => {
  try {
    const vehicles = await VehicleNumber.find().sort({ lastDetected: -1 });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single vehicle number
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await VehicleNumber.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get active vehicles (detected in last 5 minutes)
router.get('/active/list', async (req, res) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const vehicles = await VehicleNumber.find({
      lastDetected: { $gte: fiveMinutesAgo },
      isActive: true,
    }).sort({ lastDetected: -1 });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record detected vehicle number
router.post('/', async (req, res) => {
  try {
    const { vehicleNumber, vehicleType, color, thumbnail, cameraId, cameraName } = req.body;

    if (!vehicleNumber) {
      return res.status(400).json({ error: 'Vehicle number is required' });
    }

    // Check if vehicle already exists
    let vehicle = await VehicleNumber.findOne({ vehicleNumber });

    if (vehicle) {
      // Update existing vehicle
      vehicle.lastDetected = new Date();
      vehicle.detectionCount += 1;
      vehicle.lastCameraId = cameraId;
      vehicle.lastCameraName = cameraName;
      if (vehicleType) vehicle.vehicleType = vehicleType;
      if (color) vehicle.color = color;
      if (thumbnail) vehicle.thumbnail = thumbnail;
      
      // Add to detection history
      if (!vehicle.detectionHistory) vehicle.detectionHistory = [];
      vehicle.detectionHistory.push({
        cameraId,
        cameraName,
        timestamp: new Date(),
        thumbnail,
      });

      // If it's a watchlist hit, emit a special event
      if (vehicle.isWatchlisted) {
        io.emit('watchlistHit', {
          type: 'vehicle',
          vehicleNumber: vehicle.vehicleNumber,
          ownerName: vehicle.ownerName,
          cameraName,
          timestamp: new Date(),
          thumbnail
        });

        // Send email with cooldown
        const now = Date.now();
        const last = cooldowns[vehicleNumber] || 0;
        if (now - last > COOLDOWN_MS) {
          cooldowns[vehicleNumber] = now;
          
          // Determine recipient email
          let recipientEmail = process.env.ALERT_EMAIL || process.env.EMAIL_USER;
          
          try {
            const camera = await (await import('../models/Camera.js')).default.findById(cameraId).populate('locationId');
            if (camera) {
              recipientEmail = camera.alertEmail || camera.locationId?.authorityEmail || recipientEmail;
            }
          } catch (e) {
            // Not a MongoDB ID
          }
          
          sendVehicleWatchlistEmail({
            to: recipientEmail,
            vehicleNumber: vehicle.vehicleNumber,
            ownerName: vehicle.ownerName,
            vehicleType: vehicle.vehicleType,
            color: vehicle.color,
            locationName: cameraName,
            timestamp: new Date(),
            thumbnail
          }).catch(err => console.error('Vehicle watchlist email failed:', err.message));
        }
      }
    } else {
      // Create new vehicle (passive detection)
      vehicle = await VehicleNumber.create({
        vehicleNumber,
        vehicleType: vehicleType || 'unknown',
        color: color || 'unknown',
        thumbnail,
        lastCameraId: cameraId,
        lastCameraName: cameraName,
        isActive: true,
        detectionCount: 1,
        detectionHistory: [{
          cameraId,
          cameraName,
          timestamp: new Date(),
          thumbnail,
        }],
      });
    }

    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add to watchlist (manual entry)
router.post('/watchlist', async (req, res) => {
  try {
    const { vehicleNumber, vehicleType, color, ownerName, thumbnail } = req.body;

    if (!vehicleNumber) {
      return res.status(400).json({ error: 'Vehicle number is required' });
    }

    let vehicle = await VehicleNumber.findOne({ vehicleNumber });

    if (vehicle) {
      vehicle.isWatchlisted = true;
      if (ownerName) vehicle.ownerName = ownerName;
      if (vehicleType) vehicle.vehicleType = vehicleType;
      if (color) vehicle.color = color;
      if (thumbnail) vehicle.thumbnail = thumbnail;
    } else {
      vehicle = new VehicleNumber({
        vehicleNumber,
        vehicleType: vehicleType || 'unknown',
        color: color || 'unknown',
        ownerName: ownerName || 'Unknown Owner',
        isWatchlisted: true,
        detectionCount: 0,
        thumbnail
      });
    }

    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update vehicle number
router.patch('/:id', async (req, res) => {
  try {
    const { vehicleType, color, isActive } = req.body;
    const vehicle = await VehicleNumber.findById(req.params.id);

    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    if (vehicleType) vehicle.vehicleType = vehicleType;
    if (color) vehicle.color = color;
    if (isActive !== undefined) vehicle.isActive = isActive;

    await vehicle.save();
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete vehicle number
router.delete('/:id', async (req, res) => {
  try {
    await VehicleNumber.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
