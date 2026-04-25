import mongoose from 'mongoose';

const vehicleNumberSchema = new mongoose.Schema({
  vehicleNumber: { type: String, required: true, index: true }, // License plate
  vehicleType: { type: String, enum: ['car', 'truck', 'bus', 'motorcycle', 'bicycle', 'unknown'], default: 'unknown' },
  color: String,
  firstDetected: { type: Date, default: Date.now },
  lastDetected: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  isWatchlisted: { type: Boolean, default: false },
  ownerName: String,
  detectionCount: { type: Number, default: 0 },
  thumbnail: String, // Base64 image
  lastCameraId: String, // Last camera that detected this vehicle
  lastCameraName: String, // Last camera name
  detectionHistory: [
    {
      cameraId: String,
      cameraName: String,
      timestamp: { type: Date, default: Date.now },
      thumbnail: String,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('VehicleNumber', vehicleNumberSchema);
