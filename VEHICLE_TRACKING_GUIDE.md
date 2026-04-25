# Vehicle Path Tracking System

## Overview
Complete vehicle tracking system across multiple cameras with path visualization and timeline tracking.

## Features Implemented

### Backend
✅ **Models**
- `Vehicle.js` - Stores vehicle information (ID, type, status, cameras visited)
- `VehicleTracking.js` - Individual detection records with timestamps
- `VehiclePath.js` - Complete path history across cameras

✅ **Routes** (`/api/vehicles`)
- `GET /` - List all vehicles
- `GET /:vehicleId` - Get vehicle details
- `GET /:vehicleId/tracking` - Get detection history
- `GET /:vehicleId/path` - Get path visualization data
- `POST /detect` - Record vehicle detection (called by Python)
- `PATCH /:vehicleId/deactivate` - Mark vehicle as inactive
- `GET /status/active` - Get currently active vehicles
- `GET /stats/summary` - Get statistics

### Python (YOLO + SORT Tracking)
✅ **Vehicle Detection**
- Detects: cars, trucks, buses, motorcycles, bicycles
- Simple SORT-like tracker implementation
- Assigns unique IDs to each vehicle
- Tracks vehicles across frames
- IoU-based matching algorithm

✅ **Endpoints**
- `POST /vehicle/tracking/enable` - Enable tracking for a camera
- `GET /vehicle/tracking/status` - Get tracking status

✅ **Integration**
- Integrated with camera detection loop
- Sends tracking data to backend every 2 seconds
- Captures vehicle snapshots
- Tracks bounding boxes

### Frontend
✅ **Pages**
- `/vehicles` - Vehicle tracking dashboard with statistics
- `/vehicles/:vehicleId` - Detailed path visualization

✅ **Features**
- Real-time vehicle detection via Socket.io
- Filter by status (active/all) and type
- Vehicle type distribution chart
- Path visualization with timeline
- Detection history table
- Camera-to-camera movement tracking

## How to Use

### 1. Enable Vehicle Tracking on Camera
When adding a camera in the Cameras page:
1. Check "Enable Vehicle Tracking" checkbox
2. Camera will automatically detect and track vehicles

### 2. View Tracked Vehicles
Navigate to **Vehicles** page to see:
- Total vehicles tracked
- Active vehicles
- Vehicle type distribution
- List of all tracked vehicles

### 3. View Vehicle Path
Click "View Path" on any vehicle to see:
- Complete path across cameras
- Timeline visualization
- Duration at each camera
- Detection history

## Technical Details

### Vehicle Tracking Algorithm
```
1. YOLO detects vehicles in frame
2. SORT tracker matches detections to existing tracks
3. Assigns unique ID to new vehicles
4. Tracks movement across frames
5. Sends data to backend when vehicle moves between cameras
```

### Path Building Logic
```
1. First detection creates new Vehicle record
2. Each detection creates VehicleTracking record
3. VehiclePath aggregates movement between cameras
4. Calculates duration at each camera
5. Marks path as complete when vehicle leaves
```

### Vehicle Classes Detected
- 🚗 Car
- 🚚 Truck
- 🚌 Bus
- 🏍️ Motorcycle
- 🚲 Bicycle

## API Examples

### Enable Vehicle Tracking
```bash
POST http://127.0.0.1:5002/vehicle/tracking/enable
{
  "cameraId": "camera_123",
  "enabled": true
}
```

### Get Vehicle Path
```bash
GET http://127.0.0.1:4000/api/vehicles/vehicle_123/path
```

### Get Statistics
```bash
GET http://127.0.0.1:4000/api/vehicles/stats/summary
```

## Database Schema

### Vehicle
```javascript
{
  vehicleId: String (unique),
  vehicleType: String (car/truck/bus/motorcycle/bicycle),
  firstSeen: Date,
  lastSeen: Date,
  totalCameras: Number,
  isActive: Boolean,
  thumbnail: String (base64)
}
```

### VehicleTracking
```javascript
{
  vehicleId: String,
  cameraId: ObjectId,
  locationId: ObjectId,
  timestamp: Date,
  confidence: Number,
  direction: String,
  snapshot: String (base64),
  boundingBox: { x, y, width, height }
}
```

### VehiclePath
```javascript
{
  vehicleId: String,
  path: [{
    cameraId: ObjectId,
    cameraName: String,
    timestamp: Date,
    duration: Number
  }],
  startTime: Date,
  endTime: Date,
  totalDuration: Number,
  isComplete: Boolean
}
```

## Real-time Updates
- Socket.io event: `vehicleDetected`
- Emitted when vehicle is detected
- Frontend automatically updates vehicle list

## Performance Notes
- Tracking runs every 3rd frame (FRAME_SKIP)
- Updates sent to backend every 2 seconds
- IoU threshold: 0.3 for matching
- Max age: 30 frames before track is deleted
- Min hits: 2 detections before track is confirmed

## Future Enhancements (Optional)
- [ ] DeepSORT for better tracking
- [ ] Vehicle color detection
- [ ] Speed estimation
- [ ] License plate recognition
- [ ] Cross-camera re-identification
- [ ] Heatmap visualization
- [ ] Alert on suspicious patterns
