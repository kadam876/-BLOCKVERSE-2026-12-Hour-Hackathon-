import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  vehicleId: { type: String, required: true, unique: true }, // Unique tracking ID
  vehicleType: { type: String, enum: ['car', 'truck', 'bus', 'motorcycle', 'bicycle', 'unknown'], default: 'unknown' },
  firstSeen: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
  totalCameras: { type: Number, default: 1 }, // Number of cameras it appeared in
  isActive: { type: Boolean, default: true }, // Currently being tracked
  color: String, // Optional: vehicle color
  thumbnail: String, // Base64 image of first detection
});

export default mongoose.model('Vehicle', vehicleSchema);
