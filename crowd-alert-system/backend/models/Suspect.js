import mongoose from 'mongoose';

const suspectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  imageUrl: String,
  faceEmbedding: [Number], // 128-dimensional face encoding
  uploadedAt: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: null },
  matchCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

export default mongoose.model('Suspect', suspectSchema);
