import mongoose from 'mongoose';

const cameraSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cameraUrl: { type: String, required: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  locationName: String,
  threshold: { type: Number, default: 20 },
  alertEmail: String,
  faceRecognitionEnabled: { type: Boolean, default: false },
  vehicleTrackingEnabled: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  status: { type: String, enum: ['running', 'stopped', 'error'], default: 'stopped' },
  lastCount: { type: Number, default: 0 },
  lastVehicleCount: { type: Number, default: 0 },
  lastStatus: { type: String, enum: ['normal', 'warning', 'critical'], default: 'normal' },
  lastUpdated: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Camera', cameraSchema);
