import express from 'express';
import FaceMatch from '../models/FaceMatch.js';
import Suspect from '../models/Suspect.js';
import Location from '../models/Location.js';
import { io } from '../server.js';
import { sendFaceMatchEmail } from '../services/emailService.js';

const router = express.Router();

const cooldowns = {};
const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes between alerts per suspect

// Receive face match from Python
router.post('/', async (req, res) => {
  const { suspectId, suspectName, locationId, confidence, snapshot } = req.body;

  try {
    const suspect = await Suspect.findById(suspectId);
    if (!suspect) return res.status(404).json({ error: 'Suspect not found' });

    const location = locationId ? await Location.findById(locationId) : null;

    // Check cooldown
    const now = Date.now();
    const last = cooldowns[suspectId] || 0;

    if (now - last < COOLDOWN_MS) {
      return res.json({ ok: true, alerted: false, reason: 'cooldown' });
    }

    cooldowns[suspectId] = now;

    // Save match record
    const match = await FaceMatch.create({
      suspectId,
      suspectName: suspect.name,
      locationId: location?._id,
      locationName: location?.name || 'Unknown',
      confidence,
      snapshotUrl: snapshot ? `data:image/jpeg;base64,${snapshot}` : null,
      cameraUrl: location?.name || '',
    });

    // Update suspect stats
    await Suspect.findByIdAndUpdate(suspectId, {
      lastSeen: new Date(),
      $inc: { matchCount: 1 },
    });

    // Send email alert
    let emailSent = false;
    if (location?.authorityEmail) {
      try {
        await sendFaceMatchEmail({
          to: location.authorityEmail,
          suspectName: suspect.name,
          suspectDescription: suspect.description,
          locationName: location.name,
          confidence,
          snapshot,
          suspectImage: suspect.imageUrl,
        });
        emailSent = true;
        await FaceMatch.findByIdAndUpdate(match._id, { emailSent: true });
      } catch (err) {
        console.error('Face match email failed:', err.message);
      }
    }

    // Emit real-time alert to frontend
    io.emit('faceMatch', {
      matchId: match._id,
      suspectId,
      suspectName: suspect.name,
      locationName: location?.name || 'Unknown',
      confidence,
      timestamp: match.timestamp,
      emailSent,
    });

    res.json({ ok: true, alerted: true, matchId: match._id });
  } catch (err) {
    console.error('Face match error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
