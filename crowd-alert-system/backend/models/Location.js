import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: String, enum: ['police', 'transport', 'POLICE', 'SECURITY', 'TRAFFIC', 'EMERGENCY', 'OTHER'], default: 'police' },
  authorityEmail: { type: String, default: '' },
  threshold: { type: Number, default: 0 },
  avgTrainingCount: { type: Number, default: 0 },
  isConfigured: { type: Boolean, default: false },
  coordinates: {
    lat: Number,
    lon: Number,
  },
  address: String,
  
  // Time-based thresholds
  timeBasedThresholds: [
    {
      name: String, // e.g., "Morning Rush", "Peak Hours", "Night"
      startTime: String, // HH:MM format (e.g., "08:00")
      endTime: String, // HH:MM format (e.g., "10:00")
      threshold: Number, // Threshold for this time period
      daysOfWeek: [String], // ["Monday", "Tuesday", ...] or ["All"]
      isActive: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now },
    }
  ],
  
  createdAt: { type: Date, default: Date.now },
  lastCount: { type: Number, default: 0 },
  lastStatus: { type: String, enum: ['normal', 'warning', 'critical'], default: 'normal' },
  lastUpdated: { type: Date, default: null },
});

export default mongoose.model('Location', locationSchema);
