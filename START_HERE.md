# 🚀 START HERE - Complete Setup Guide

## What You Have
A complete **Crowd Alert System** with:
- ✅ Real-time people detection
- ✅ Vehicle tracking
- ✅ **License plate detection** (NEW!)
- ✅ Face recognition
- ✅ Weather & pollution monitoring
- ✅ Interactive map
- ✅ Dashboard with statistics

## Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
# Windows
install.bat

# Linux/Mac
bash install.sh

# Or manually
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
cd crowd-alert-system/backend && npm install && cd ../..
cd crowd-alert-system/frontend && npm install && cd ../..
```

### Step 2: Start Services (3 Terminals)

**Terminal 1 - Python Backend:**
```bash
python people.py
```

**Terminal 2 - Node Backend:**
```bash
cd crowd-alert-system/backend
npm start
```

**Terminal 3 - React Frontend:**
```bash
cd crowd-alert-system/frontend
npm run dev
```

### Step 3: Access System
Open browser: **http://localhost:5173**

### Step 4: Add Location & Camera
1. Click **Locations** → **+ Add Location**
2. Fill in details and save
3. Click **Cameras** → **+ Add Camera**
4. Select location, enter IP Webcam URL
5. ✅ Check **Enable Vehicle Tracking**
6. Click **Add Camera & Start Detection**

### Step 5: View Results
- **Dashboard**: See statistics
- **Cameras**: See live feed
- **License Plates**: See detected plates (NEW!)
- **Vehicles**: See vehicle tracking
- **Weather**: See pollution data

## Detailed Setup

### Prerequisites
- Python 3.14.3 ✅
- Node.js v22.19.0 ✅
- MongoDB configured ✅
- IP Webcam app on phone (optional)

### Installation Issues?

**If PyTorch fails:**
```bash
# Try CPU version
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Or GPU version (NVIDIA)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
```

**If PaddleOCR fails:**
```bash
pip install paddleocr paddlepaddle
```

**If npm fails:**
```bash
# Clear cache
npm cache clean --force

# Reinstall
npm install
```

See `PYTHON_314_INSTALLATION.md` for detailed troubleshooting.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│              (http://localhost:5173)                     │
│  Dashboard | Cameras | License Plates | Vehicles | etc  │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/Socket.io
┌────────────────────▼────────────────────────────────────┐
│              Node.js Backend API                         │
│              (http://localhost:4000)                     │
│  Routes | Database | Socket.io | Email | Alerts         │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP
┌────────────────────▼────────────────────────────────────┐
│            Python Flask Backend                          │
│              (http://localhost:5002)                     │
│  YOLO | Vehicle Tracking | License Plate OCR | Face Rec │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                  MongoDB Database                        │
│  Locations | Cameras | Vehicles | Plates | Alerts | etc │
└─────────────────────────────────────────────────────────┘
```

## Features Overview

### 📊 Dashboard
- Total locations, cameras, vehicles, suspects
- Live surveillance status
- Camera overview by location
- Vehicle tracking stats
- Recent alerts

### 📹 Cameras
- Add/manage cameras
- Live feed display
- People count
- **Latest detected license plate** ✨
- Vehicle tracking status
- Face recognition status

### 🚗 License Plates (NEW!)
- Grid view of all detected plates
- Realistic yellow plate styling
- Vehicle type and color
- Detection count and timestamps
- Full detection history
- Camera correlation
- Active/inactive filtering

### 🚙 Vehicles
- Vehicle tracking across cameras
- Path visualization
- Timeline of movements
- Vehicle statistics
- Type distribution

### 👤 Suspects
- Add suspects with photos
- Face recognition matching
- Detection alerts
- Suspect details

### 🌤️ Weather
- Real-time weather data
- Air quality index (AQI)
- Pollution heatmap
- Crowd-pollution correlation
- Interactive map

### 📍 Locations
- Add monitoring locations
- Set thresholds
- Configure alerts
- View statistics

### 🚨 Alerts
- Real-time alerts
- Email notifications
- Alert history
- Filtering and search

## Configuration

### Environment Variables
Create `.env` in `crowd-alert-system/backend/`:
```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
PORT=4000
```

### Camera Setup
1. Install IP Webcam app on phone
2. Start app and note the URL
3. Add camera with URL: `http://phone-ip:8080/video`
4. Enable features as needed

### OpenWeatherMap API (Optional)
1. Get free API key from openweathermap.org
2. Add to backend environment
3. Weather features will work

## Troubleshooting

### Services Won't Start
```bash
# Check if ports are in use
# Windows
netstat -ano | findstr :5002
netstat -ano | findstr :4000
netstat -ano | findstr :5173

# Linux/Mac
lsof -i :5002
lsof -i :4000
lsof -i :5173

# Kill process (Windows)
taskkill /PID <PID> /F

# Kill process (Linux/Mac)
kill -9 <PID>
```

### MongoDB Connection Error
1. Check `.env` file
2. Verify MongoDB is running
3. Test connection: `mongosh "mongodb+srv://..."`

### Camera Feed Not Showing
1. Verify IP Webcam URL is correct
2. Test URL in browser
3. Check camera is on same network
4. Check firewall settings

### License Plates Not Detected
1. Enable vehicle tracking on camera
2. Check camera feed quality
3. Verify PaddleOCR installed: `pip list | grep paddle`
4. Check Python logs for errors

### Frontend Not Loading
1. Check React is running on 5173
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

## Documentation

- `QUICK_START_COMMANDS.md` - All commands
- `PYTHON_314_INSTALLATION.md` - Python 3.14 setup
- `VEHICLE_NUMBER_DETECTION_SETUP.md` - License plate details
- `VEHICLE_NUMBER_IMPLEMENTATION_COMPLETE.md` - Implementation info
- `RUN_SYSTEM_NOW.md` - Quick reference

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

## Next Steps

1. ✅ Install dependencies
2. ✅ Start 3 services
3. ✅ Add location
4. ✅ Add camera
5. ✅ Enable vehicle tracking
6. 📊 Monitor dashboard
7. 📹 View camera feeds
8. 🚗 Check detected plates
9. 📍 Add more locations
10. 🎯 Add suspects (optional)

## You're Ready! 🎉

Everything is set up and ready to use. Start the 3 terminals and access the system at `http://localhost:5173`.

Enjoy the Crowd Alert System with Vehicle License Plate Detection!

---

**Questions?** Check the documentation files or review the logs in each terminal.
