import express from 'express';
import Alert from '../models/Alert.js';
import Location from '../models/Location.js';
import { sendAlertEmail } from '../services/emailService.js';
import { io } from '../server.js';
import { updateLocationWeather } from '../services/weatherService.js';

const router = express.Router();

const cooldowns = {};
const COOLDOWN_MS = 15 * 1000; // 15 seconds for testing (was 5 mins)

// Called by Python YOLO script on every detection tick
// POST /api/live/alert
// Body: { locationId, peopleCount, frameImage?, customThreshold?, customEmail? }
router.post('/alert', async (req, res) => {
  const { locationId, peopleCount, frameImage, customThreshold, customEmail } = req.body;
  console.log(`[LIVE API] Received payload from Python. Location ID: ${locationId}, People Count: ${peopleCount}`);
  if (!locationId || peopleCount == null) {
    return res.status(400).json({ error: 'locationId and peopleCount required' });
  }

  try {
    const location = await Location.findById(locationId);
    if (!location) return res.status(404).json({ error: 'Location not found' });

    // Use custom threshold if provided, otherwise use location's threshold
    const threshold = customThreshold != null ? Number(customThreshold) : location.threshold;
    const emailTo = customEmail || location.authorityEmail;
    const ratio = threshold > 0 ? peopleCount / threshold : 0;
    const status = ratio >= 1 ? 'critical' : ratio >= 0.75 ? 'warning' : 'normal';

    // Update location live stats
    await Location.findByIdAndUpdate(locationId, {
      lastCount: peopleCount,
      lastStatus: status,
      lastUpdated: new Date(),
    });

    // Emit live count to all connected frontend clients
    io.emit('liveCount', {
      locationId,
      locationName: location.name,
      peopleCount,
      threshold,
      status,
    });

    // Update weather data periodically (every 10 minutes)
    const lastWeatherUpdate = location.lastWeatherUpdate || 0;
    const now = Date.now();
    if (now - lastWeatherUpdate > 10 * 60 * 1000) {
      // Update weather in background
      updateLocationWeather(locationId, peopleCount).catch(err => {
        console.error('Weather update failed:', err.message);
      });
      location.lastWeatherUpdate = now;
      await location.save();
    }

    // Fire alert if threshold exceeded and cooldown passed
    if (peopleCount > threshold) {
      const now = Date.now();
      const last = cooldowns[locationId] || 0;

      if (now - last > COOLDOWN_MS) {
        cooldowns[locationId] = now;

        let emailSent = false;
        try {
          console.log(`[ALERT] Threshold exceeded at ${location.name} (${peopleCount} > ${threshold}). Sending email to ${emailTo}...`);
          await sendAlertEmail({
            to: emailTo,
            locationName: location.name,
            peopleCount,
            threshold,
            authorityType: location.department,
            frameImage: frameImage || null,
          });
          emailSent = true;
          console.log(`[ALERT] Email successfully sent to ${emailTo}`);
        } catch (err) {
          console.error('❌ Live alert email failed:', err.message);
        }

        const alert = await Alert.create({
          locationId: location._id,
          locationName: location.name,
          department: location.department,
          authorityEmail: emailTo, // Use the actual recipient
          peopleCount,
          threshold,
          maxPeopleInFrame: peopleCount,
          avgDensityLevel: ratio >= 2 ? 'High Density' : ratio >= 1 ? 'Medium Density' : 'Low Density',
          emailSent,
        });

        // Emit crowd alert event to frontend
        io.emit('crowdAlert', {
          locationId,
          locationName: location.name,
          peopleCount,
          threshold,
          status: 'critical',
          emailSent,
          alertId: alert._id,
          timestamp: alert.timestamp,
        });
      } else {
        console.log(`[ALERT] Threshold exceeded at ${location.name}, but waiting for 15s cooldown before sending next email.`);
      }
    }

    res.json({ ok: true, status });
  } catch (err) {
    console.error('Live alert error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/live/status — returns all locations for the live page
router.get('/status', async (req, res) => {
  const locations = await Location.find({ isConfigured: true });
  res.json(locations);
});

export default router;
