import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import 'dotenv/config';
import locationRoutes from './routes/locations.js';
import alertRoutes from './routes/alerts.js';
import liveRoutes from './routes/live.js';
import suspectRoutes from './routes/suspects.js';
import faceMatchRoutes from './routes/faceMatch.js';
import cameraRoutes from './routes/cameras.js';
import vehicleRoutes from './routes/vehicles.js';
import vehicleNumberRoutes from './routes/vehicleNumber.js';
import weatherRoutes from './routes/weather.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 4000;

export const io = new Server(httpServer, {
  cors: { origin: '*' },
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err.message));

app.use('/api/locations', locationRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/suspects', suspectRoutes);
app.use('/api/face-match', faceMatchRoutes);
app.use('/api/cameras', cameraRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/vehicle-numbers', vehicleNumberRoutes);
app.use('/api/weather', weatherRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

io.on('connection', (socket) => {
  console.log('Socket client connected:', socket.id);
  socket.on('disconnect', () => console.log('Socket client disconnected:', socket.id));
});

httpServer.listen(PORT, '127.0.0.1', () =>
  console.log(`Backend running on http://127.0.0.1:${PORT}`)
);
