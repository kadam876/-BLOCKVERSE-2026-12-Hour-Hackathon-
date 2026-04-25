import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  locationName: String,
  department: String,
  authorityEmail: String,
  peopleCount: Number,
  threshold: Number,
  maxPeopleInFrame: Number,
  avgDensityLevel: String,
  emailSent: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model('Alert', alertSchema);
