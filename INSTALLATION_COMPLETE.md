# ✅ Installation Complete!

## What Was Installed

✅ Python dependencies (Flask, OpenCV, YOLO, NumPy, PyTorch)
✅ Node.js backend dependencies
✅ React frontend dependencies
✅ All system components ready

## System Status

- **Python**: Ready ✅
- **Node.js Backend**: Ready ✅
- **React Frontend**: Ready ✅
- **MongoDB**: Configured ✅
- **License Plate Detection**: Ready ✅

## How to Start the System

### Option 1: Automatic (Recommended)
```powershell
.\start-system.ps1
```

This will open 3 terminals automatically and start all services.

### Option 2: Manual (3 Separate Terminals)

**Terminal 1 - Python Backend:**
```powershell
python people.py
```

**Terminal 2 - Node Backend:**
```powershell
cd crowd-alert-system/backend
npm start
```

**Terminal 3 - React Frontend:**
```powershell
cd crowd-alert-system/frontend
npm run dev
```

## Access the System

Once all 3 services are running:

1. Open browser: **http://localhost:5173**
2. You should see the Crowd Alert System dashboard

## First Time Setup

### Step 1: Add a Location
1. Click **Locations** in navbar
2. Click **+ Add Location**
3. Fill in:
   - Name: "Main Gate"
   - Department: "Security"
   - Threshold: "20"
   - Email: "your-email@gmail.com"
4. Click **Add Location**

### Step 2: Add a Camera
1. Click **Cameras** in navbar
2. Click **+ Add Camera**
3. Fill in:
   - Name: "Gate Camera"
   - Location: "Main Gate"
   - URL: "http://192.168.1.100:8080/video" (your IP Webcam)
   - ✅ Check "Enable Vehicle Tracking"
4. Click **Add Camera & Start Detection**

### Step 3: View Results
- **Dashboard**: See statistics
- **Cameras**: See live feed
- **License Plates**: See detected plates
- **Vehicles**: See vehicle tracking

## What Each Service Does

### Python Backend (Port 5002)
- Detects people using YOLO
- Tracks vehicles
- Detects license plates
- Recognizes faces
- Sends data to Node backend

### Node Backend (Port 4000)
- Manages database (MongoDB)
- Provides API endpoints
- Handles real-time updates (Socket.io)
- Sends email alerts
- Stores all data

### React Frontend (Port 5173)
- User interface
- Dashboard
- Camera management
- License plate viewing
- Real-time updates

## Features Available

✅ Real-time people detection
✅ Vehicle tracking
✅ **License plate detection** (NEW!)
✅ Vehicle color identification
✅ Face recognition
✅ Weather monitoring
✅ Pollution tracking
✅ Interactive map
✅ Dashboard with statistics
✅ Alert system
✅ Real-time updates

## Troubleshooting

### Services Won't Start

**Check if ports are in use:**
```powershell
# Check port 5002 (Python)
netstat -ano | findstr :5002

# Check port 4000 (Node)
netstat -ano | findstr :4000

# Check port 5173 (React)
netstat -ano | findstr :5173
```

**Kill process on port:**
```powershell
# Replace <PID> with the process ID
taskkill /PID <PID> /F
```

### MongoDB Connection Error
1. Check `.env` file in `crowd-alert-system/backend/`
2. Verify `MONGO_URI` is correct
3. Check internet connection
4. Restart Node backend

### Camera Feed Not Showing
1. Verify IP Webcam URL is correct
2. Test URL in browser
3. Check camera is on same network
4. Check firewall settings

### License Plates Not Detected
1. Enable vehicle tracking on camera
2. Check camera feed quality
3. Check Python logs for errors

### Frontend Not Loading
1. Check React is running on 5173
2. Clear browser cache: `Ctrl+Shift+Delete`
3. Open DevTools: `F12`
4. Check Console tab for errors

## Environment Variables

File: `crowd-alert-system/backend/.env`

```
MONGO_URI=mongodb+srv://ahirelalit200_db_user:iamthebest@cluster0.wfwnljt.mongodb.net/prescriptionDB
EMAIL_USER=lalitahire2025@gmail.com
EMAIL_PASS=kzbv jorx ikrm bbkv
PORT=4000
```

## Performance Tips

- Use high-quality camera for better detection
- Ensure good lighting
- Position camera to capture plates clearly
- Monitor system resources
- Use GPU if available

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

## Documentation

- `START_HERE.md` - Quick start guide
- `QUICK_START_COMMANDS.md` - All commands
- `QUICK_REFERENCE.md` - Quick reference card
- `VEHICLE_NUMBER_DETECTION_SETUP.md` - License plate details
- `IMPLEMENTATION_SUMMARY.md` - Implementation details

## Next Steps

1. ✅ Installation complete
2. ▶️ Start services (use `start-system.ps1`)
3. ▶️ Add location
4. ▶️ Add camera
5. ▶️ Enable vehicle tracking
6. ▶️ View detected plates
7. ▶️ Monitor dashboard

## Support

**If something doesn't work:**

1. Check all 3 terminals are running
2. Check ports are correct (5002, 4000, 5173)
3. Check MongoDB is connected
4. Check browser console (F12)
5. Check Python logs
6. Check Node logs

## You're Ready! 🚀

Everything is installed and ready to use.

**Next:** Run `.\start-system.ps1` to start all services!

---

**Installation Date**: April 25, 2026
**Status**: ✅ Complete
**Ready to Use**: Yes
