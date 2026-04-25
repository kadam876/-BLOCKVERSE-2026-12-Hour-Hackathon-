import express from 'express';
import multer from 'multer';
import FormData from 'form-data';
import fetch from 'node-fetch';
import Suspect from '../models/Suspect.js';
import FaceMatch from '../models/FaceMatch.js';
import Location from '../models/Location.js';
import { io } from '../server.js';
import { sendFaceMatchEmail } from '../services/emailService.js';

const cooldowns = {};
const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes cooldown per suspect

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get all suspects
router.get('/', async (req, res) => {
  const suspects = await Suspect.find().sort({ uploadedAt: -1 });
  res.json(suspects);
});

// Get single suspect
router.get('/:id', async (req, res) => {
  const suspect = await Suspect.findById(req.params.id);
  if (!suspect) return res.status(404).json({ error: 'Suspect not found' });
  res.json(suspect);
});

// Upload suspect image and extract face embedding
router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    // Send image to Flask for face encoding
    const form = new FormData();
    form.append('image', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const flaskRes = await fetch('http://127.0.0.1:5002/face/encode', {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });

    const data = await flaskRes.json();
    if (!flaskRes.ok) throw new Error(data.error || 'Face encoding failed');

    // Save suspect with face embedding
    const suspect = await Suspect.create({
      name,
      description: description || '',
      imageUrl: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
      faceEmbedding: data.encoding,
    });

    res.status(201).json(suspect);
  } catch (err) {
    console.error('Suspect upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Delete suspect
router.delete('/:id', async (req, res) => {
  await Suspect.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// Toggle suspect active status
router.patch('/:id/toggle', async (req, res) => {
  const suspect = await Suspect.findById(req.params.id);
  if (!suspect) return res.status(404).json({ error: 'Suspect not found' });
  
  suspect.isActive = !suspect.isActive;
  await suspect.save();
  res.json(suspect);
});

// Get all face matches
router.get('/matches/all', async (req, res) => {
  const matches = await FaceMatch.find()
    .populate('suspectId')
    .sort({ timestamp: -1 })
    .limit(50);
  res.json(matches);
});

// Get matches for specific suspect
router.get('/:id/matches', async (req, res) => {
  const matches = await FaceMatch.find({ suspectId: req.params.id })
    .sort({ timestamp: -1 });
  res.json(matches);
});

// Add face match
router.post('/match', async (req, res) => {
  try {
    const { suspectId, locationId, videoName, confidence, snapshot } = req.body;
    
    const suspect = await Suspect.findById(suspectId);
    if (!suspect) return res.status(404).json({ error: 'Suspect not found' });

    let locationName = videoName || 'Unknown Location';
    if (locationId) {
      const loc = await Location.findById(locationId);
      if (loc) {
        locationName = videoName ? `${loc.name} (${videoName})` : loc.name;
      }
    }

    const match = await FaceMatch.create({
      suspectId,
      suspectName: suspect.name,
      locationId: locationId || null,
      locationName,
      confidence,
      snapshotUrl: `data:image/jpeg;base64,${snapshot}`
    });

    suspect.matchCount = (suspect.matchCount || 0) + 1;
    suspect.lastSeen = new Date();
    await suspect.save();

    // Check cooldown and send email
    const now = Date.now();
    const last = cooldowns[suspectId] || 0;
    if (now - last > COOLDOWN_MS) {
      cooldowns[suspectId] = now;
      
      // Determine recipient email
      let recipientEmail = process.env.ALERT_EMAIL || process.env.EMAIL_USER;
      
      // Try to find Camera first, then Location
      try {
        const camera = await (await import('../models/Camera.js')).default.findById(locationId).populate('locationId');
        if (camera) {
          recipientEmail = camera.alertEmail || camera.locationId?.authorityEmail || recipientEmail;
        } else {
          const location = await Location.findById(locationId);
          if (location && location.authorityEmail) {
            recipientEmail = location.authorityEmail;
          }
        }
      } catch (e) {
        // ID might not be a valid MongoDB ID (e.g. video filename)
        const location = await Location.findOne({ name: locationName });
        if (location && location.authorityEmail) {
          recipientEmail = location.authorityEmail;
        }
      }

      sendFaceMatchEmail({
        to: recipientEmail,
        suspectName: suspect.name,
        suspectDescription: suspect.description,
        locationName: locationName,
        confidence: confidence,
        snapshot: snapshot,
        suspectImage: suspect.imageUrl
      }).then(async () => {
        await FaceMatch.findByIdAndUpdate(match._id, { emailSent: true });
        console.log(`✅ Face match email sent to ${recipientEmail} for ${suspect.name}`);
      }).catch(err => console.error('Suspect match email failed:', err.message));
    }

    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
