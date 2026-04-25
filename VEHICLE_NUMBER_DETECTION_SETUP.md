# Vehicle License Plate Detection Setup

## Overview
This document explains the new vehicle license plate detection feature that has been added to the Crowd Alert System.

## Features Added

### 1. License Plate Detection
- **Technology**: EasyOCR for optical character recognition
- **Detection**: Automatically detects license plates from vehicle regions
- **Color Detection**: Identifies vehicle color (red, blue, green, yellow, black, white)
- **Real-time**: Detects and records license plates as vehicles are tracked

### 2. Backend Components

#### New Model: VehicleNumber
- `vehicleNumber`: License plate text (indexed for fast lookup)
- `vehicleType`: Type of vehicle (car, truck, bus, motorcycle, bicycle)
- `color`: Detected vehicle color
- `firstDetected`: Timestamp of first detection
- `lastDetected`: Timestamp of last detection
- `isActive`: Boolean flag for active status
- `detectionCount`: Total number of times detected
- `thumbnail`: Base64 encoded vehicle image
- `lastCameraId`: ID of last camera that detected it
- `lastCameraName`: Name of last camera
- `detectionHistory`: Array of all detection events with camera info

#### New Routes: `/api/vehicle-numbers`
- `GET /` - Get all vehicle numbers
- `GET /:id` - Get single vehicle number details
- `GET /active/list` - Get vehicles detected in last 5 minutes
- `POST /` - Record detected vehicle number (called by Python)
- `PATCH /:id` - Update vehicle number info
- `DELETE /:id` - Delete vehicle number record

### 3. Frontend Components

#### New Page: Vehicle Numbers (`/vehicle-numbers`)
- Grid view of all detected license plates
- License plate displayed in yellow with black border (realistic style)
- Shows vehicle type, color, detection count
- Shows first and last detection timestamps
- Toggle active/inactive status
- Delete records
- Detail modal with full detection history
- Real-time updates via Socket.io
- Filter for active vehicles (last 5 minutes)

#### Updated Pages
- **Cameras**: Shows latest detected vehicle number on each camera card
- **Dashboard**: Added "License Plates Detected" stat card
- **Navigation**: Added "License Plates" link in navbar

### 4. Python Detection

#### New Functions in `people.py`
- `get_ocr_reader()`: Lazy-loads EasyOCR reader
- `detect_license_plate(frame, vehicle_bbox)`: Detects license plate text
- `detect_vehicle_color(frame, vehicle_bbox)`: Detects vehicle color

#### Integration
- License plate detection runs when vehicle tracking is enabled
- Detects plates from lower 40% of vehicle region (where plates typically are)
- Sends detected plates to backend via `/api/vehicle-numbers` endpoint
- Logs all detections with camera info

## Installation & Setup

### 1. Install Python Dependencies
```bash
pip install -r requirements.txt
```

This includes:
- `easyocr==1.7.1` - For license plate OCR

### 2. Start the Services

**Terminal 1 - Flask Backend (Python)**
```bash
python people.py
```
Runs on: `http://127.0.0.1:5002`

**Terminal 2 - Node Backend**
```bash
cd crowd-alert-system/backend
npm start
```
Runs on: `http://127.0.0.1:4000`

**Terminal 3 - React Frontend**
```bash
cd crowd-alert-system/frontend
npm run dev
```
Runs on: `http://127.0.0.1:5173`

### 3. Enable Vehicle Tracking on Cameras
1. Go to **Cameras** page
2. Add a new camera or edit existing one
3. Check "Enable Vehicle Tracking" checkbox
4. Save camera

Once enabled, the system will:
- Detect vehicles using YOLO
- Extract license plates using EasyOCR
- Detect vehicle color
- Send data to backend
- Display on camera cards and dashboard

## Usage

### Viewing Detected License Plates
1. Navigate to **License Plates** page in navbar
2. View all detected vehicles in grid format
3. Click on any vehicle to see detailed information
4. Use "Show Active Only" toggle to filter recent detections

### Real-time Updates
- Camera cards show latest detected license plate
- Dashboard shows total detected plates
- Updates happen automatically via Socket.io

### Managing Records
- **Activate/Deactivate**: Toggle active status
- **Delete**: Remove vehicle record
- **View History**: See all detection events with camera info

## Performance Notes

### OCR Processing
- First OCR initialization takes ~2-3 seconds (model download)
- Subsequent detections are faster (~100-200ms per plate)
- Runs on GPU if available, CPU otherwise
- Processes lower 40% of vehicle region for efficiency

### Detection Accuracy
- Works best with clear, well-lit license plates
- Accuracy depends on:
  - Image quality and resolution
  - Lighting conditions
  - Plate angle and distance
  - Vehicle speed

### Optimization Tips
1. **Adjust detection frequency**: Modify `FRAME_SKIP` in `people.py`
2. **Reduce region**: Adjust plate detection region in `detect_license_plate()`
3. **GPU acceleration**: Ensure CUDA is properly configured
4. **Database indexing**: Vehicle numbers are indexed for fast queries

## Troubleshooting

### License Plates Not Detected
1. Check vehicle tracking is enabled on camera
2. Verify camera feed quality
3. Check Python logs for OCR errors
4. Ensure EasyOCR is installed: `pip install easyocr`

### Slow Performance
1. Check GPU availability: `nvidia-smi`
2. Reduce frame processing rate
3. Check system resources (CPU, RAM)
4. Consider reducing image resolution

### Database Issues
1. Verify MongoDB connection
2. Check vehicle number model is created
3. Ensure indexes are built

## API Examples

### Record Vehicle Number
```bash
curl -X POST http://127.0.0.1:4000/api/vehicle-numbers \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleNumber": "ABC-1234",
    "vehicleType": "car",
    "color": "black",
    "thumbnail": "base64_image_data",
    "cameraId": "camera_id",
    "cameraName": "Main Gate"
  }'
```

### Get Active Vehicles
```bash
curl http://127.0.0.1:4000/api/vehicle-numbers/active/list
```

### Get Vehicle Details
```bash
curl http://127.0.0.1:4000/api/vehicle-numbers/{id}
```

### Update Vehicle
```bash
curl -X PATCH http://127.0.0.1:4000/api/vehicle-numbers/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleType": "truck",
    "color": "white",
    "isActive": false
  }'
```

## Future Enhancements

1. **Advanced OCR**: Support for multiple languages and plate formats
2. **Plate Recognition**: Validate plate format by country/region
3. **Alerts**: Send alerts for specific license plates
4. **Analytics**: Track vehicle movement patterns
5. **Integration**: Connect with traffic databases
6. **Export**: Export detected plates to CSV/PDF

## Files Modified/Created

### Created
- `crowd-alert-system/backend/routes/vehicleNumber.js` - Vehicle number routes
- `crowd-alert-system/frontend/src/pages/VehicleNumbers.jsx` - Vehicle numbers page

### Modified
- `crowd-alert-system/backend/models/VehicleNumber.js` - Enhanced model with camera tracking
- `crowd-alert-system/backend/server.js` - Added vehicle number routes
- `crowd-alert-system/frontend/src/App.jsx` - Added route and navigation
- `crowd-alert-system/frontend/src/pages/Cameras.jsx` - Show detected plates on cards
- `crowd-alert-system/frontend/src/pages/Dashboard.jsx` - Added license plate stats
- `people.py` - Added OCR and color detection functions
- `requirements.txt` - Added easyocr dependency

## Support

For issues or questions:
1. Check logs in Python terminal
2. Check browser console for frontend errors
3. Verify MongoDB connection
4. Ensure all services are running
5. Check network connectivity between services
