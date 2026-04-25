import express from 'express';
import Location from '../models/Location.js';

const router = express.Router();

// Get all locations
router.get('/', async (req, res) => {
  const locations = await Location.find();
  res.json(locations);
});

// Get single location
router.get('/:id', async (req, res) => {
  const loc = await Location.findById(req.params.id);
  if (!loc) return res.status(404).json({ error: 'Location not found' });
  res.json(loc);
});

// Create new location
router.post('/', async (req, res) => {
  const { name, coordinates, address, threshold, department, authorityEmail } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const loc = await Location.create({
      name,
      department: department || 'police',
      authorityEmail: authorityEmail || '',
      threshold: threshold || 0,
      avgTrainingCount: 0,
      isConfigured: !!threshold,
      coordinates: coordinates || undefined,
      address: address || undefined,
      timeBasedThresholds: [],
    });
    res.status(201).json(loc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete location
router.delete('/:id', async (req, res) => {
  await Location.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// Update location (basic fields)
router.patch('/:id', async (req, res) => {
  try {
    const { threshold, coordinates, address, department, authorityEmail } = req.body;
    const updateData = {};
    
    if (threshold !== undefined) updateData.threshold = Number(threshold);
    if (coordinates) updateData.coordinates = coordinates;
    if (address) updateData.address = address;
    if (department) updateData.department = department;
    if (authorityEmail) updateData.authorityEmail = authorityEmail;
    
    const loc = await Location.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!loc) return res.status(404).json({ error: 'Location not found' });
    res.json(loc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add time-based threshold
router.post('/:id/time-thresholds', async (req, res) => {
  try {
    const { name, startTime, endTime, threshold, daysOfWeek } = req.body;
    
    if (!name || !startTime || !endTime || !threshold) {
      return res.status(400).json({ error: 'Name, startTime, endTime, and threshold are required' });
    }
    
    const loc = await Location.findById(req.params.id);
    if (!loc) return res.status(404).json({ error: 'Location not found' });
    
    loc.timeBasedThresholds.push({
      name,
      startTime,
      endTime,
      threshold: Number(threshold),
      daysOfWeek: daysOfWeek || ['All'],
      isActive: true,
    });
    
    await loc.save();
    res.status(201).json(loc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get time-based thresholds for a location
router.get('/:id/time-thresholds', async (req, res) => {
  try {
    const loc = await Location.findById(req.params.id);
    if (!loc) return res.status(404).json({ error: 'Location not found' });
    res.json(loc.timeBasedThresholds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update time-based threshold
router.patch('/:id/time-thresholds/:thresholdId', async (req, res) => {
  try {
    const { name, startTime, endTime, threshold, daysOfWeek, isActive } = req.body;
    
    const loc = await Location.findById(req.params.id);
    if (!loc) return res.status(404).json({ error: 'Location not found' });
    
    const timeThreshold = loc.timeBasedThresholds.id(req.params.thresholdId);
    if (!timeThreshold) return res.status(404).json({ error: 'Time threshold not found' });
    
    if (name) timeThreshold.name = name;
    if (startTime) timeThreshold.startTime = startTime;
    if (endTime) timeThreshold.endTime = endTime;
    if (threshold) timeThreshold.threshold = Number(threshold);
    if (daysOfWeek) timeThreshold.daysOfWeek = daysOfWeek;
    if (isActive !== undefined) timeThreshold.isActive = isActive;
    
    await loc.save();
    res.json(loc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete time-based threshold
router.delete('/:id/time-thresholds/:thresholdId', async (req, res) => {
  try {
    const loc = await Location.findById(req.params.id);
    if (!loc) return res.status(404).json({ error: 'Location not found' });
    
    loc.timeBasedThresholds.id(req.params.thresholdId).deleteOne();
    await loc.save();
    res.json(loc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current applicable threshold for a location
router.get('/:id/current-threshold', async (req, res) => {
  try {
    const loc = await Location.findById(req.params.id);
    if (!loc) return res.status(404).json({ error: 'Location not found' });
    
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
    
    // Find matching time-based threshold
    const activeThreshold = loc.timeBasedThresholds.find(t => {
      if (!t.isActive) return false;
      if (t.daysOfWeek.includes('All') || t.daysOfWeek.includes(dayName)) {
        return currentTime >= t.startTime && currentTime <= t.endTime;
      }
      return false;
    });
    
    const currentThreshold = activeThreshold ? activeThreshold.threshold : loc.threshold;
    
    res.json({
      currentThreshold,
      activeTimeThreshold: activeThreshold || null,
      defaultThreshold: loc.threshold,
      allTimeThresholds: loc.timeBasedThresholds,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
