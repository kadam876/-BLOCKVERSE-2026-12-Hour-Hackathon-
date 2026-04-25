# Run the System Now - Complete Commands

## Prerequisites Check
- ✅ Python 3.14.3
- ✅ Node.js v22.19.0
- ✅ MongoDB configured
- ✅ All dependencies installed

## If First Time Setup

### Install All Dependencies
```bash
# Python dependencies
pip install -r requirements.txt

# Backend dependencies
cd crowd-alert-system/backend
npm install
cd ../..

# Frontend dependencies
cd crowd-alert-system/frontend
npm install
cd ../..
```

## Run the System (3 Terminals)

### Terminal 1: Python Flask Backend
```bash
python people.py
```

**Expected Output:**
```
CUDA available. Using device: [GPU name]
(or "CUDA not available. Using CPU.")
[Camera] Stream opened
[License Plate] Detected: ABC-1234
```

### Terminal 2: Node.js Backend API
```bash
cd crowd-alert-system/backend
npm start
```

**Expected Output:**
```
MongoDB connected
Backend running on http://127.0.0.1:4000
Socket client connected
```

### Terminal 3: React Frontend
```bash
cd crowd-alert-system/frontend
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

## Access the System

1. **Open Browser**: `http://localhost:5173`
2. **You should see**: Crowd Alert System Dashboard

## Quick Setup (First Time)

### Step 1: Add Location
1. Click **Locations** in navbar
2. Click **+ Add Location**
3. Fill in:
   - Name: "Main Gate"
   - Department: "Security"
   - Threshold: "20"
   - Email: "your-email@gmail.com"
4. Click **Add Location**

### Step 2: Add Camera
1. Click **Cameras** in navbar
2. Click **+ Add Camera**
3. Fill in:
   - Name: "Gate Camera"
   - Location: "Main Gate"
   - URL: "http://192.168.1.100:8080/video" (your IP Webcam)
   - ✅ Check "Enable Vehicle Tracking"
   - ✅ Check "Enable Face Recognition" (optional)
4. Click **Add Camera & Start Detection**

### Step 3: View Results
1. **Dashboard**: See statistics
2. **Cameras**: See live feed and detected plates
3. **License Plates**: See all detected vehicle plates
4. **Vehicles**: See vehicle tracking
5. **Weather**: See pollution data

## What You'll See

### On Dashboard
- Total Locations
- Active Cameras
- Active Vehicles
- **License Plates Detected** ← NEW!
- Critical/Warning/Normal locations
- Live surveillance (if active)
- Camera overview
- Vehicle tracking stats

### On Cameras Page
- Camera feed (if running)
- People count
- **Latest detected license plate** ← NEW!
- Vehicle tracking status
- Face recognition status

### On License Plates Page (NEW!)
- Grid of all detected plates
- Yellow plate with black border (realistic)
- Vehicle type and color
- Detection count
- First/last detection time
- Click for detailed history

## Real-time Features

✅ **Live Detection**: Plates detected as vehicles appear
✅ **Auto-update**: Dashboard updates every 5 seconds
✅ **Socket.io**: Real-time updates without refresh
✅ **Camera Integration**: Latest plate shown on camera card
✅ **History Tracking**: Full detection history per plate

## Monitoring

### Check Python is Working
- Look for `[License Plate] Detected:` messages
- Look for `[Vehicle] Failed to send` errors (if any)

### Check Node is Working
- Look for `Socket client connected` messages
- Check `/api/vehicle-numbers` endpoint

### Check Frontend is Working
- Dashboard loads without errors
- License Plates page shows data
- Real-time updates happen

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5002 (Python)
lsof -ti:5002 | xargs kill -9

# Kill process on port 4000 (Node)
lsof -ti:4000 | xargs kill -9

# Kill process on port 5173 (React)
lsof -ti:5173 | xargs kill -9
```

### MongoDB Connection Error
1. Check `.env` file in `crowd-alert-system/backend/`
2. Verify `MONGO_URI` is correct
3. Check internet connection
4. Restart Node backend

### Camera Feed Not Showing
1. Verify IP Webcam URL is correct
2. Test URL in browser: `http://192.168.x.x:8080/video`
3. Check camera is on same network
4. Check firewall settings

### License Plates Not Detected
1. Ensure vehicle tracking is enabled on camera
2. Check camera feed quality
3. Verify EasyOCR installed: `pip list | grep easyocr`
4. Check Python logs for errors

### Frontend Not Loading
1. Check React is running on port 5173
2. Clear browser cache: `Ctrl+Shift+Delete`
3. Open DevTools: `F12`
4. Check Console tab for errors

## Performance Tips

### For Better Detection
- Use high-quality camera
- Ensure good lighting
- Position camera to capture plates clearly
- Reduce distance to vehicles

### For Better Performance
- Increase `FRAME_SKIP` in `people.py` (default: 3)
- Use GPU if available
- Close other applications
- Monitor system resources

## Testing

### Test 1: People Detection
1. Add camera
2. Go to Cameras page
3. Should see people count updating

### Test 2: Vehicle Tracking
1. Enable vehicle tracking
2. Go to Cameras page
3. Should see vehicle count

### Test 3: License Plate Detection
1. Enable vehicle tracking
2. Go to License Plates page
3. Should see plates appearing

### Test 4: Real-time Updates
1. Go to Dashboard
2. Add camera
3. Should see stats updating automatically

## Stopping Services

Press `Ctrl+C` in each terminal:
```bash
# Terminal 1
Ctrl+C

# Terminal 2
Ctrl+C

# Terminal 3
Ctrl+C
```

## Next Steps

1. ✅ System running
2. ✅ Cameras added
3. ✅ Vehicle tracking enabled
4. ✅ License plates detected
5. 📊 Monitor dashboard
6. 📹 View camera feeds
7. 🚗 Check detected plates
8. 📍 Add more locations
9. 🎯 Add suspects (optional)
10. 🌤️ Configure weather API (optional)

## Documentation

- `QUICK_START_COMMANDS.md` - All commands
- `VEHICLE_NUMBER_DETECTION_SETUP.md` - Detailed setup
- `VEHICLE_NUMBER_IMPLEMENTATION_COMPLETE.md` - Implementation details
- `README.md` - Project overview

## Support

**If something doesn't work:**

1. Check all 3 terminals are running
2. Check ports are correct (5002, 4000, 5173)
3. Check MongoDB is connected
4. Check browser console (F12)
5. Check Python logs
6. Check Node logs

**Common Issues:**
- Port in use → Kill process
- MongoDB error → Check connection
- Camera not showing → Check URL
- Plates not detected → Check vehicle tracking enabled

## You're Ready! 🚀

All systems are implemented and ready to use. Start the 3 terminals and access the system at `http://localhost:5173`.

Enjoy the Crowd Alert System with Vehicle License Plate Detection!
