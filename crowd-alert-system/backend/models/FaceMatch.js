import mongoose from 'mongoose';

const faceMatchSchema = new mongoose.Schema({
  suspectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Suspect', required: true },
  suspectName: String,
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  locationName: String,
  confidence: Number, // 0-1 similarity score
  snapshotUrl: String, // base64 or file path
  timestamp: { type: Date, default: Date.now },
  cameraUrl: String,
  emailSent: { type: Boolean, default: false },
});

export default mongoose.model('FaceMatch', faceMatchSchema);
