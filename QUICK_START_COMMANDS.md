# Quick Start - All Commands to Run

## Prerequisites
- Python 3.14.3 installed
- Node.js v22.19.0 installed
- MongoDB connection configured
- All dependencies installed

## Step 1: Install Dependencies (First Time Only)

### Python Dependencies
```bash
pip install -r requirements.txt
```

### Backend Dependencies
```bash
cd crowd-alert-system/backend
npm install
cd ../..
```

### Frontend Dependencies
```bash
cd crowd-alert-system/frontend
npm install
cd ../..
```

## Step 2: Start All Services

**Open 3 separate terminals and run these commands:**

### Terminal 1 - Flask Backend (Python Detection)
```bash
python people.py
```
- Runs on: `http://127.0.0.1:5002`
- Handles: Video detection, people counting, vehicle tracking, license plate detection, face recognition

### Terminal 2 - Node.js Backend (API Server)
```bash
cd crowd-alert-system/backend
npm start
```
- Runs on: `http://127.0.0.1:4000`
- Handles: Database operations, API endpoints, Socket.io events

### Terminal 3 - React Frontend (Web UI)
```bash
cd crowd-alert-system/frontend
npm run dev
```
- Runs on: `http://127.0.0.1:5173`
- Open in browser: `http://localhost:5173`

## Step 3: Access the System

1. Open browser: `http://localhost:5173`
2. You should see the Crowd Alert System dashboard

## Step 4: Add a Location

1. Click **Locations** in navbar
2. Click **+ Add Location**
3. Fill in:
   - Location Name (e.g., "Main Gate")
   - Department (e.g., "Security")
   - Threshold (e.g., 20 people)
   - Authority Email (e.g., your email)
   - Coordinates (optional, for map)
4. Click **Add Location**

## Step 5: Add a Camera

1. Click **Cameras** in navbar
2. Click **+ Add Camera**
3. Fill in:
   - Camera Name (e.g., "Gate Camera 1")
   - Location (select from dropdown)
   - IP Webcam URL (e.g., `http://192.168.1.100:8080/video`)
   - Threshold (optional, uses location default)
   - Alert Email (optional, uses location default)
   - Check **Enable Vehicle Tracking** to detect license plates
   - Check **Enable Face Recognition** for suspect matching
4. Click **Add Camera & Start Detection**

## Step 6: View Live Detection

1. Click **Cameras** to see camera feeds
2. Click **Dashboard** to see statistics
3. Click **License Plates** to see detected vehicle plates
4. Click **Vehicles** to see vehicle tracking
5. Click **Weather** to see pollution data

## Common Tasks

### View Detected License Plates
```
Dashboard → License Plates Detected (stat card)
OR
Navbar → License Plates
```

### View Vehicle Tracking
```
Dashboard → Active Vehicles (stat card)
OR
Navbar → Vehicles
```

### View Suspects
```
Dashboard → Active Suspects (stat card)
OR
Navbar → Suspects
```

### View Alerts
```
Navbar → Alerts
```

### View Weather & Pollution
```
Navbar → Weather
```

## Stopping Services

To stop all services:
1. Press `Ctrl+C` in each terminal
2. Wait for graceful shutdown

## Troubleshooting

### Services Won't Start
1. Check if ports are in use:
   - Python: 5002
   - Node: 4000
   - React: 5173
2. Kill existing processes on those ports
3. Restart services

### MongoDB Connection Error
1. Check `.env` file has correct `MONGO_URI`
2. Verify MongoDB is running
3. Check internet connection

### Camera Feed Not Showing
1. Verify IP Webcam URL is correct
2. Check camera is accessible from your network
3. Try accessing URL directly in browser

### License Plates Not Detected
1. Ensure vehicle tracking is enabled on camera
2. Check camera feed quality
3. Verify EasyOCR is installed: `pip install easyocr`
4. Check Python logs for errors

### Frontend Not Loading
1. Check React is running on port 5173
2. Clear browser cache: `Ctrl+Shift+Delete`
3. Check browser console for errors (F12)

## Environment Variables

Create `.env` file in `crowd-alert-system/backend/`:
```
MONGO_URI=mongodb+srv://ahirelalit200_db_user:iamthebest@cluster0.wfwnljt.mongodb.net/prescriptionDB
EMAIL_USER=lalitahire2025@gmail.com
EMAIL_PASS=kzbv jorx ikrm bbkv
PORT=4000
```

## Testing the System

### Test 1: People Detection
1. Add camera with IP Webcam
2. Go to Cameras page
3. Should see people count updating

### Test 2: Vehicle Tracking
1. Enable vehicle tracking on camera
2. Go to Cameras page
3. Should see vehicle count updating

### Test 3: License Plate Detection
1. Enable vehicle tracking on camera
2. Go to License Plates page
3. Should see detected plates appearing

### Test 4: Face Recognition
1. Add suspects first (Suspects page)
2. Enable face recognition on camera
3. Should see face matches in alerts

## Performance Tips

1. **Reduce frame processing**: Increase `FRAME_SKIP` in `people.py`
2. **Use GPU**: Ensure CUDA is configured for faster processing
3. **Optimize database**: Add indexes for frequently queried fields
4. **Cache data**: Frontend caches data for 5 seconds

## Next Steps

1. Configure OpenWeatherMap API key (optional)
2. Add multiple cameras for better coverage
3. Set up email alerts
4. Configure face recognition with suspects
5. Monitor dashboard for real-time updates

## Support

Check logs in each terminal for errors:
- **Python logs**: Terminal 1
- **Node logs**: Terminal 2
- **React logs**: Terminal 3 + Browser Console (F12)

For detailed setup, see:
- `VEHICLE_NUMBER_DETECTION_SETUP.md` - License plate detection
- `FINAL_SETUP_COMPLETE.md` - System overview
- `README.md` - Project documentation
