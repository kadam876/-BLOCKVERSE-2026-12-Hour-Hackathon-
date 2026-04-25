import express from 'express';
import multer from 'multer';
import FormData from 'form-data';
import fetch from 'node-fetch';
import Location from '../models/Location.js';
import Alert from '../models/Alert.js';
import { sendAlertEmail } from '../services/emailService.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const cooldowns = {};
const COOLDOWN_MS = 5 * 60 * 1000;

// Get all alerts
router.get('/', async (req, res) => {
  const alerts = await Alert.find().sort({ timestamp: -1 });
  res.json(alerts);
});

// SSE streaming detection endpoint
router.post('/detect/:locationId', upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No video uploaded' });

  const location = await Location.findById(req.params.locationId);
  if (!location) return res.status(404).json({ error: 'Location not found' });
  if (!location.isConfigured) return res.status(400).json({ error: 'Location not configured yet.' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  // Track whether we've already fired the alert mid-stream
  let alertFiredDuringStream = false;
  let alertDoc = null;
  let alertFrameImage = null; // base64 JPEG of the frame that triggered the alert

  try {
    const form = new FormData();
    form.append('video', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    form.append('locationId', req.params.locationId);

    const flaskRes = await fetch('http://127.0.0.1:5002/detect_video_stream', {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });

    if (!flaskRes.ok) {
      send({ type: 'error', message: 'YOLO detection failed' });
      return res.end();
    }

    let buffer = '';
    for await (const chunk of flaskRes.body) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const raw = line.slice(5).trim();
        if (!raw) continue;

        let event;
        try { event = JSON.parse(raw); } catch { continue; }

        // ── PROGRESS: check threshold on every frame, fire alert immediately ──
        if (event.type === 'progress') {
          const { people_in_frame, frame } = event;

          if (people_in_frame > location.threshold && !alertFiredDuringStream) {
            const now = Date.now();
            const lastAlert = cooldowns[location._id] || 0;

            if (now - lastAlert > COOLDOWN_MS) {
              alertFiredDuringStream = true;
              cooldowns[location._id] = now;

              // Save the trigger frame image for the email
              alertFrameImage = event.frame_image || null;

              // Fire email immediately — don't await, let analysis continue
              // Fire email — await it to ensure status is correct before saving to DB
              let emailSent = false;
              const targetEmail = location.authorityEmail || process.env.EMAIL_USER;

              try {
                await sendAlertEmail({
                  to: targetEmail,
                  locationName: location.name,
                  peopleCount: people_in_frame,
                  threshold: location.threshold,
                  authorityType: location.department,
                  frameNumber: frame,
                  frameImage: alertFrameImage,
                });
                emailSent = true;
                console.log(`✅ Alert email sent to ${targetEmail} — frame ${frame}, ${people_in_frame} people`);
              } catch (err) {
                console.error(`❌ Email failed for ${location.name}:`, err.message);
              }

              // Save alert to DB with confirmed status
              alertDoc = await Alert.create({
                locationId: location._id,
                locationName: location.name,
                department: location.department,
                authorityEmail: targetEmail,
                peopleCount: people_in_frame,
                threshold: location.threshold,
                maxPeopleInFrame: people_in_frame,
                avgDensityLevel: 'Detecting...',
                emailSent: emailSent,
              });

              // Update location status immediately
              await Location.findByIdAndUpdate(location._id, {
                lastCount: people_in_frame,
                lastStatus: 'critical',
                lastUpdated: new Date(),
              });

              // Notify frontend that alert was triggered mid-stream
              send({
                type: 'alert',
                frame,
                peopleCount: people_in_frame,
                threshold: location.threshold,
                alertId: alertDoc._id,
                emailSent,
                message: `🚨 Threshold exceeded at frame ${frame} — ${people_in_frame} people detected`,
              });
            }
          }

          // Always forward progress event to frontend
          send(event);
        }

        // ── COMPLETE: finalize stats, update alert doc with final density ──
        else if (event.type === 'complete') {
          const { total_people, max_people_in_frame, avg_density_level, video_path } = event;

          const ratio = max_people_in_frame / location.threshold;
          const exceeded = max_people_in_frame > location.threshold;
          const status = exceeded ? 'critical' : ratio >= 0.75 ? 'warning' : 'normal';

          // Update location with final stats
          await Location.findByIdAndUpdate(location._id, {
            lastCount: max_people_in_frame,
            lastStatus: status,
            lastUpdated: new Date(),
          });

          // Update the alert doc with final density level if it was created mid-stream
          if (alertDoc) {
            await Alert.findByIdAndUpdate(alertDoc._id, {
              maxPeopleInFrame: max_people_in_frame,
              avgDensityLevel: avg_density_level,
            });
            alertDoc.maxPeopleInFrame = max_people_in_frame;
            alertDoc.avgDensityLevel = avg_density_level;
          }

          // If threshold exceeded but cooldown blocked mid-stream alert, still record it
          if (exceeded && !alertFiredDuringStream) {
            const now = Date.now();
            if (!cooldowns[location._id] || now - cooldowns[location._id] > COOLDOWN_MS) {
              cooldowns[location._id] = now;
              const targetEmail = location.authorityEmail || process.env.EMAIL_USER;
              let emailSent = false;
              try {
                await sendAlertEmail({
                  to: targetEmail,
                  locationName: location.name,
                  peopleCount: max_people_in_frame,
                  threshold: location.threshold,
                  authorityType: location.department,
                });
                emailSent = true;
              } catch (err) {
                console.error(`❌ Email failed:`, err.message);
              }
              alertDoc = await Alert.create({
                locationId: location._id,
                locationName: location.name,
                department: location.department,
                authorityEmail: targetEmail,
                peopleCount: max_people_in_frame,
                threshold: location.threshold,
                maxPeopleInFrame: max_people_in_frame,
                avgDensityLevel: avg_density_level,
                emailSent,
              });
            }
          }

          send({
            type: 'complete',
            detection: { total_people, max_people_in_frame, avg_density_level, video_path },
            status,
            threshold: location.threshold,
            exceeded,
            alert: alertDoc,
            videoUrl: `http://127.0.0.1:5002/video_result/${video_path}`,
          });

        } else {
          send(event);
        }
      }
    }
  } catch (err) {
    send({ type: 'error', message: err.message });
  }

  res.end();
});

// Setup route SSE (training video)
router.post('/setup-stream/:locationId', upload.single('trainingVideo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No video uploaded' });

  const { department, authorityEmail } = req.body;
  if (!department || !authorityEmail) return res.status(400).json({ error: 'Missing fields' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const form = new FormData();
    form.append('video', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const flaskRes = await fetch('http://127.0.0.1:5002/detect_video_stream', {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });

    if (!flaskRes.ok) {
      send({ type: 'error', message: 'YOLO detection failed' });
      return res.end();
    }

    let buffer = '';
    for await (const chunk of flaskRes.body) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const raw = line.slice(5).trim();
        if (!raw) continue;
        let event;
        try { event = JSON.parse(raw); } catch { continue; }

        if (event.type === 'complete') {
          const { total_people, max_people_in_frame } = event;
          const Location_ = (await import('../models/Location.js')).default;
          const loc = await Location_.findByIdAndUpdate(
            req.params.locationId,
            {
              department,
              authorityEmail,
              avgTrainingCount: total_people,
              threshold: max_people_in_frame,
              isConfigured: true,
            },
            { new: true }
          );
          send({
            type: 'complete',
            location: loc,
            message: `Setup complete. Threshold set to ${max_people_in_frame} people.`,
          });
        } else {
          send(event);
        }
      }
    }
  } catch (err) {
    send({ type: 'error', message: err.message });
  }

  res.end();
});

export default router;
