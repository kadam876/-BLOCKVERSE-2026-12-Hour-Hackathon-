import mongoose from 'mongoose';

const vehiclePathSchema = new mongoose.Schema({
  vehicleId: { type: String, required: true, index: true },
  path: [{
    cameraId: { type: mongoose.Schema.Types.ObjectId, ref: 'Camera' },
    cameraName: String,
    locationName: String,
    timestamp: Date,
    duration: Number, // Time spent at this camera (seconds)
  }],
  startTime: { type: Date, required: true },
  endTime: Date,
  totalDuration: Number, // Total tracking duration in seconds
  totalCameras: { type: Number, default: 0 },
  isComplete: { type: Boolean, default: false }, // Path tracking completed
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('VehiclePath', vehiclePathSchema);
