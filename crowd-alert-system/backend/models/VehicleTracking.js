import mongoose from 'mongoose';

const vehicleTrackingSchema = new mongoose.Schema({
  vehicleId: { type: String, required: true, index: true }, // Links to Vehicle
  cameraId: { type: mongoose.Schema.Types.ObjectId, ref: 'Camera', required: true },
  cameraName: String,
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  locationName: String,
  timestamp: { type: Date, default: Date.now, index: true },
  confidence: { type: Number, default: 0 }, // Detection confidence
  direction: { type: String, enum: ['north', 'south', 'east', 'west', 'unknown'], default: 'unknown' },
  speed: Number, // Optional: estimated speed in km/h
  snapshot: String, // Base64 image of detection
  boundingBox: {
    x: Number,
    y: Number,
    width: Number,
    height: Number,
  },
});

// Index for efficient path queries
vehicleTrackingSchema.index({ vehicleId: 1, timestamp: 1 });

export default mongoose.model('VehicleTracking', vehicleTrackingSchema);
