import express from 'express';
import Vehicle from '../models/Vehicle.js';
import VehicleTracking from '../models/VehicleTracking.js';
import VehiclePath from '../models/VehiclePath.js';
import Location from '../models/Location.js';
import { io } from '../server.js';

const router = express.Router();

// Get all tracked vehicles
router.get('/', async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ lastSeen: -1 }).limit(100);
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single vehicle details
router.get('/:vehicleId', async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ vehicleId: req.params.vehicleId });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get vehicle tracking history
router.get('/:vehicleId/tracking', async (req, res) => {
  try {
    const tracking = await VehicleTracking.find({ vehicleId: req.params.vehicleId })
      .sort({ timestamp: 1 })
      .populate('cameraId')
      .populate('locationId');
    res.json(tracking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get vehicle path
router.get('/:vehicleId/path', async (req, res) => {
  try {
    const path = await VehiclePath.findOne({ vehicleId: req.params.vehicleId })
      .sort({ createdAt: -1 });
    res.json(path);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record vehicle detection (called by Python)
router.post('/detect', async (req, res) => {
  try {
    const {
      vehicleId,
      vehicleType,
      cameraId,
      cameraName,
      locationId,
      locationName,
      confidence,
      direction,
      speed,
      snapshot,
      boundingBox,
    } = req.body;

    if (!vehicleId || !cameraId || !locationId) {
      return res.status(400).json({ error: 'vehicleId, cameraId, and locationId required' });
    }

    let finalLocationName = locationName;
    let finalCameraName = cameraName;

    if (locationId) {
      const loc = await Location.findById(locationId);
      if (loc) {
        if (cameraName === locationName) {
           finalLocationName = `${loc.name} (${cameraName})`;
        } else {
           finalLocationName = loc.name;
        }
      }
    }

    // Update or create vehicle record
    let vehicle = await Vehicle.findOne({ vehicleId });
    if (!vehicle) {
      vehicle = await Vehicle.create({
        vehicleId,
        vehicleType: vehicleType || 'unknown',
        firstSeen: new Date(),
        lastSeen: new Date(),
        totalCameras: 1,
        thumbnail: snapshot,
      });
    } else {
      vehicle.lastSeen = new Date();
      vehicle.isActive = true;
      if (vehicleType) vehicle.vehicleType = vehicleType;
      await vehicle.save();
    }

    // Create tracking record
    const tracking = await VehicleTracking.create({
      vehicleId,
      cameraId,
      cameraName,
      locationId,
      locationName: finalLocationName,
      timestamp: new Date(),
      confidence,
      direction,
      speed,
      snapshot,
      boundingBox,
    });

    // Update or create path
    let path = await VehiclePath.findOne({ vehicleId, isComplete: false });
    if (!path) {
      path = await VehiclePath.create({
        vehicleId,
        path: [{
          cameraId,
          cameraName: finalCameraName,
          locationName: finalLocationName,
          timestamp: new Date(),
          duration: 0,
        }],
        startTime: new Date(),
        totalCameras: 1,
      });
    } else {
      const lastCamera = path.path[path.path.length - 1];
      
      // Check if vehicle moved to a different camera
      if (lastCamera.cameraId.toString() !== cameraId) {
        // Calculate duration at previous camera
        const duration = (new Date() - new Date(lastCamera.timestamp)) / 1000;
        lastCamera.duration = duration;
        
        // Add new camera to path
        path.path.push({
          cameraId,
          cameraName: finalCameraName,
          locationName: finalLocationName,
          timestamp: new Date(),
          duration: 0,
        });
        
        path.totalCameras = path.path.length;
        vehicle.totalCameras = path.totalCameras;
        await vehicle.save();
      }
      
      await path.save();
    }

    // Emit real-time update via Socket.io
    io.emit('vehicleDetected', {
      vehicleId,
      vehicleType: vehicle.vehicleType,
      cameraId,
      cameraName: finalCameraName,
      locationName: finalLocationName,
      timestamp: new Date(),
      totalCameras: vehicle.totalCameras,
    });

    res.json({ ok: true, vehicle, tracking, path });
  } catch (err) {
    console.error('Vehicle detection error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Mark vehicle as inactive (left tracking area)
router.patch('/:vehicleId/deactivate', async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ vehicleId: req.params.vehicleId });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    vehicle.isActive = false;
    await vehicle.save();

    // Complete the path
    const path = await VehiclePath.findOne({ vehicleId: req.params.vehicleId, isComplete: false });
    if (path) {
      path.isComplete = true;
      path.endTime = new Date();
      path.totalDuration = (path.endTime - path.startTime) / 1000;
      
      // Update last camera duration
      if (path.path.length > 0) {
        const lastCamera = path.path[path.path.length - 1];
        lastCamera.duration = (path.endTime - new Date(lastCamera.timestamp)) / 1000;
      }
      
      await path.save();
    }

    res.json({ ok: true, vehicle, path });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get active vehicles
router.get('/status/active', async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ isActive: true }).sort({ lastSeen: -1 });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get vehicle statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const totalVehicles = await Vehicle.countDocuments();
    const activeVehicles = await Vehicle.countDocuments({ isActive: true });
    const totalTracking = await VehicleTracking.countDocuments();
    const completedPaths = await VehiclePath.countDocuments({ isComplete: true });

    // Vehicle type distribution
    const typeDistribution = await Vehicle.aggregate([
      { $group: { _id: '$vehicleType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      totalVehicles,
      activeVehicles,
      totalTracking,
      completedPaths,
      typeDistribution,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
