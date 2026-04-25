import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { sendAlertEmail } from './emailService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'db.json');

// Cooldown tracker: locationId -> last alert timestamp
const alertCooldowns = {};
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export function getLocations() {
  return readDB().locations;
}

export function getAlerts() {
  return readDB().alerts;
}

export function addLocation(location) {
  const db = readDB();
  const newLoc = { id: `loc_${uuidv4().slice(0, 6)}`, status: 'normal', lastCount: 0, lastUpdated: null, ...location };
  db.locations.push(newLoc);
  writeDB(db);
  return newLoc;
}

export function updateLocation(id, updates) {
  const db = readDB();
  const idx = db.locations.findIndex(l => l.id === id);
  if (idx === -1) return null;
  db.locations[idx] = { ...db.locations[idx], ...updates };
  writeDB(db);
  return db.locations[idx];
}

export function deleteLocation(id) {
  const db = readDB();
  db.locations = db.locations.filter(l => l.id !== id);
  writeDB(db);
}

export async function processCrowdCount(locationId, peopleCount, maxPeopleInFrame, avgDensityLevel) {
  const db = readDB();
  const location = db.locations.find(l => l.id === locationId);
  if (!location) throw new Error('Location not found');

  // Determine status
  const ratio = peopleCount / location.threshold;
  let status = 'normal';
  if (ratio >= 1) status = 'critical';
  else if (ratio >= 0.75) status = 'warning';

  // Update location stats
  const locIdx = db.locations.findIndex(l => l.id === locationId);
  db.locations[locIdx] = {
    ...location,
    lastCount: peopleCount,
    status,
    lastUpdated: new Date().toISOString(),
  };

  let alertCreated = null;

  // Trigger alert if over threshold and cooldown passed
  if (peopleCount > location.threshold) {
    const now = Date.now();
    const lastAlert = alertCooldowns[locationId] || 0;

    if (now - lastAlert > COOLDOWN_MS) {
      alertCooldowns[locationId] = now;

      const alert = {
        id: uuidv4(),
        locationId,
        locationName: location.name,
        authorityType: location.authority,
        peopleCount,
        threshold: location.threshold,
        maxPeopleInFrame,
        avgDensityLevel,
        timestamp: new Date().toISOString(),
        emailSent: false,
      };

      try {
        await sendAlertEmail({
          to: location.authorityEmail,
          locationName: location.name,
          peopleCount,
          threshold: location.threshold,
          authorityType: location.authority,
        });
        alert.emailSent = true;
      } catch (err) {
        console.error('Email failed:', err.message);
      }

      db.alerts.unshift(alert); // newest first
      alertCreated = alert;
    }
  }

  writeDB(db);
  return { location: db.locations[locIdx], alert: alertCreated };
}
