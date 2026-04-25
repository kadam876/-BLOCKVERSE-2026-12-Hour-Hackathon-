# Quick Reference Card

## Installation (Choose One)

### Automated (Recommended)
```bash
# Windows
install.bat

# Linux/Mac
bash install.sh
```

### Manual
```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
cd crowd-alert-system/backend && npm install && cd ../..
cd crowd-alert-system/frontend && npm install && cd ../..
```

## Start Services (3 Terminals)

```bash
# Terminal 1
python people.py

# Terminal 2
cd crowd-alert-system/backend && npm start

# Terminal 3
cd crowd-alert-system/frontend && npm run dev
```

## Access System
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000
- **Python**: http://localhost:5002

## Setup (First Time)

1. **Add Location**
   - Locations → + Add Location
   - Fill details → Save

2. **Add Camera**
   - Cameras → + Add Camera
   - Select location
   - Enter IP Webcam URL
   - ✅ Enable Vehicle Tracking
   - Save

3. **View Results**
   - Dashboard → See stats
   - Cameras → See feed & plates
   - License Plates → See all plates
   - Vehicles → See tracking

## Key Pages

| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | / | Overview & stats |
| Cameras | /cameras | Manage cameras |
| License Plates | /vehicle-numbers | View detected plates |
| Vehicles | /vehicles | Vehicle tracking |
| Suspects | /suspects | Face recognition |
| Weather | /weather | Pollution data |
| Alerts | /alerts | Alert history |
| Locations | /locations | Manage locations |

## API Endpoints

### Vehicle Numbers
```
GET    /api/vehicle-numbers              # All plates
GET    /api/vehicle-numbers/:id          # Single plate
GET    /api/vehicle-numbers/active/list  # Recent plates
POST   /api/vehicle-numbers              # Record plate
PATCH  /api/vehicle-numbers/:id          # Update plate
DELETE /api/vehicle-numbers/:id          # Delete plate
```

### Cameras
```
GET    /api/cameras                      # All cameras
GET    /api/cameras/:id                  # Single camera
POST   /api/cameras                      # Add camera
DELETE /api/cameras/:id                  # Delete camera
PATCH  /api/cameras/:id/toggle           # Start/stop
PATCH  /api/cameras/:id/status           # Update status
```

### Locations
```
GET    /api/locations                    # All locations
GET    /api/locations/:id                # Single location
POST   /api/locations                    # Add location
PATCH  /api/locations/:id                # Update location
DELETE /api/locations/:id                # Delete location
```

## Troubleshooting

### Port in Use
```bash
# Windows
netstat -ano | findstr :5002
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5002
kill -9 <PID>
```

### MongoDB Error
- Check `.env` file
- Verify connection string
- Test: `mongosh "mongodb+srv://..."`

### Camera Not Showing
- Verify URL is correct
- Test URL in browser
- Check network connection
- Check firewall

### Plates Not Detected
- Enable vehicle tracking
- Check camera quality
- Verify PaddleOCR: `pip list | grep paddle`
- Check Python logs

### Frontend Not Loading
- Check React running on 5173
- Clear cache: `Ctrl+Shift+Delete`
- Open DevTools: `F12`
- Check Console tab

## Environment Variables

Create `.env` in `crowd-alert-system/backend/`:
```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
PORT=4000
```

## Performance Tips

- Increase `FRAME_SKIP` in `people.py` for speed
- Use GPU if available
- Close other applications
- Monitor system resources
- Use high-quality camera

## Testing

### Test 1: People Detection
```
Cameras → Should see people count
```

### Test 2: Vehicle Tracking
```
Enable vehicle tracking → Cameras → Should see vehicle count
```

### Test 3: License Plates
```
Enable vehicle tracking → License Plates → Should see plates
```

### Test 4: Real-time
```
Dashboard → Add camera → Stats should update automatically
```

## Common Commands

```bash
# Check Python version
python --version

# Check Node version
node --version

# Check npm version
npm --version

# Install dependencies
pip install -r requirements.txt

# Start backend
npm start

# Start frontend
npm run dev

# Run Python
python people.py

# Check ports
netstat -ano | findstr :5002  # Windows
lsof -i :5002                 # Linux/Mac

# Clear npm cache
npm cache clean --force

# Reinstall node_modules
rm -rf node_modules package-lock.json
npm install
```

## File Locations

```
Project Root
├── people.py                          # Python backend
├── requirements.txt                   # Python dependencies
├── install.bat / install.sh           # Installation scripts
├── crowd-alert-system/
│   ├── backend/
│   │   ├── server.js                  # Node server
│   │   ├── package.json               # Node dependencies
│   │   ├── .env                       # Environment variables
│   │   ├── models/
│   │   │   └── VehicleNumber.js       # Plate model
│   │   └── routes/
│   │       └── vehicleNumber.js       # Plate routes
│   └── frontend/
│       ├── src/
│       │   ├── App.jsx                # Main app
│       │   └── pages/
│       │       └── VehicleNumbers.jsx # Plate page
│       └── package.json               # Frontend dependencies
└── Documentation/
    ├── START_HERE.md
    ├── PYTHON_314_INSTALLATION.md
    ├── QUICK_START_COMMANDS.md
    └── VEHICLE_NUMBER_DETECTION_SETUP.md
```

## Documentation

| File | Purpose |
|------|---------|
| START_HERE.md | Begin here |
| PYTHON_314_INSTALLATION.md | Python 3.14 setup |
| QUICK_START_COMMANDS.md | All commands |
| VEHICLE_NUMBER_DETECTION_SETUP.md | Detailed setup |
| VEHICLE_NUMBER_IMPLEMENTATION_COMPLETE.md | Implementation |
| RUN_SYSTEM_NOW.md | Quick reference |
| IMPLEMENTATION_SUMMARY.md | Summary |
| QUICK_REFERENCE.md | This file |

## Features

✅ Real-time people detection
✅ Vehicle tracking
✅ **License plate detection** ← NEW!
✅ Vehicle color identification
✅ Face recognition
✅ Weather monitoring
✅ Pollution tracking
✅ Interactive map
✅ Dashboard
✅ Alerts
✅ Real-time updates

## Status

✅ **READY FOR PRODUCTION**

All components implemented, tested, and documented.

---

**Quick Start**: Read `START_HERE.md`
**Setup Issues**: Read `PYTHON_314_INSTALLATION.md`
**All Commands**: Read `QUICK_START_COMMANDS.md`
