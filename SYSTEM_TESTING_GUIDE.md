# Crowd Alert System - Complete Testing Guide

## System Overview

The system now includes:
1. ✅ **Crowd Detection** - People counting with YOLO
2. ✅ **Multi-Camera Management** - Multiple IP webcams
3. ✅ **Face Recognition** - Suspect identification
4. ✅ **Vehicle Tracking** - Cross-camera vehicle path tracking
5. ✅ **Real-time Alerts** - Email notifications
6. ✅ **Enhanced Dashboard** - Complete system overview

## Prerequisites

### Required Services
- Python 3.14.3
- Node.js v22.19.0
- MongoDB (cloud or local)
- IP Webcam app on phone (or any RTSP/HTTP camera)

### Environment Setup
Ensure `.env` file in `crowd-alert-system/backend/` contains:
```
MONGO_URI=mongodb+srv://ahirelalit200_db_user:iamthebest@cluster0.wfwnljt.mongodb.net/prescriptionDB
PORT=4000
EMAIL_USER=lalitahire2025@gmail.com
EMAIL_PASS=kzbv jorx ikrm bbkv
```

## Starting the System

### Terminal 1: Python (Flask) - Port 5002
```bash
python people.py
```
**Expected Output:**
```
CUDA available. Using device: ...
[Face] Face detector initialized
 * Running on http://127.0.0.1:5002
```

### Terminal 2: Node.js Backend - Port 4000
```bash
cd crowd-alert-system/backend
npm run dev
```
**Expected Output:**
```
[nodemon] starting `node server.js`
Backend running on http://127.0.0.1:4000
MongoDB connected
✅ Email service ready
```

### Terminal 3: React Frontend - Port 5173
```bash
cd crowd-alert-system/frontend
npm run dev
```
**Expected Output:**
```
VITE v... ready in ...ms
➜  Local:   http://localhost:5173/
```

## Testing Each Feature

### 1. Dashboard Overview ✅

**URL:** `http://localhost:5173/`

**What to Check:**
- [ ] Total Locations count
- [ ] Active Cameras count (X/Y format)
- [ ] Active Vehicles count
- [ ] Active Suspects count
- [ ] Critical/Warning/Normal location counts
- [ ] Camera Overview section showing cameras grouped by location
- [ ] Each camera shows: name, status (LIVE/OFF), people count, features enabled
- [ ] Vehicle Tracking Overview (if vehicles detected)
- [ ] Vehicle type distribution chart
- [ ] Recent alerts list

**Expected Behavior:**
- Stats update in real-time
- Clicking on stat boxes navigates to respective pages
- Camera cards are clickable and navigate to Cameras page
- Live cameras show green "● LIVE" indicator

---

### 2. Location Management ✅

**URL:** `http://localhost:5173/locations`

**Test Steps:**
1. Click "Add Location"
2. Fill in:
   - Name: "Test Location"
   - Department: "Police"
   - Threshold: 5
   - Email: your email
3. Click "Add Location"

**What to Check:**
- [ ] Location appears in list
- [ ] Shows "Setup required" badge
- [ ] Can edit location
- [ ] Can view location details

---

### 3. Camera Management ✅

**URL:** `http://localhost:5173/cameras`

**Test Steps:**
1. Start IP Webcam app on phone
2. Note the IP address (e.g., http://192.168.1.100:8080/video)
3. Click "Add Camera"
4. Fill in:
   - Camera Name: "Main Entrance"
   - Location: Select "Test Location"
   - IP Webcam URL: Your phone's URL
   - Threshold: 3 (optional)
   - Email: your email (optional)
   - ✅ Enable Face Recognition
   - ✅ Enable Vehicle Tracking
5. Click "Add Camera & Start Detection"

**What to Check:**
- [ ] Camera feed appears in iframe
- [ ] Status shows "running" (blue badge)
- [ ] People count updates every 2 seconds
- [ ] Status changes: normal (green) → warning (orange) → critical (red)
- [ ] Features show: "🎯 Face Recognition • 🚗 Vehicle Tracking"
- [ ] Can start/stop camera
- [ ] Can delete camera

**Python Console Output:**
```
[Camera 673...] Stream opened: http://192.168.1.100:8080/video
[Camera 673...] Detected 2 people, 0 vehicles
```

**Backend Console Output:**
```
Socket client connected: abc123
```

---

### 4. Face Recognition ✅

**URL:** `http://localhost:5173/suspects`

**Test Steps:**
1. Click "Add Suspect"
2. Fill in:
   - Name: "John Doe"
   - Description: "Test suspect"
   - Upload a clear face photo
3. Click "Add Suspect"
4. Wait for face encoding (2-3 seconds)
5. Point camera at the same person

**What to Check:**
- [ ] Suspect appears in list with thumbnail
- [ ] Status shows "Active"
- [ ] When face matches:
  - [ ] Email alert sent
  - [ ] Match appears in suspect detail page
  - [ ] Shows confidence percentage
  - [ ] Shows detected snapshot

**Python Console Output:**
```
[Face] Loaded 1 suspects
[Face] MATCH FOUND: John Doe (87% confidence)
```

---

### 5. Vehicle Tracking ✅

**URL:** `http://localhost:5173/vehicles`

**Test Steps:**
1. Ensure camera has "Vehicle Tracking" enabled
2. Show a vehicle (car, truck, bus, motorcycle, or bicycle) to camera
3. Move vehicle across camera view
4. (Optional) If multiple cameras, move vehicle between cameras

**What to Check:**
- [ ] Vehicle appears in list with unique ID
- [ ] Vehicle type detected (🚗 car, 🚚 truck, etc.)
- [ ] Status shows "Active"
- [ ] Total cameras count increases when vehicle moves between cameras
- [ ] Click "View Path" to see:
  - [ ] Timeline visualization
  - [ ] Camera-to-camera movement
  - [ ] Duration at each camera
  - [ ] Detection history table

**Python Console Output:**
```
[Camera 673...] Detected 2 people, 1 vehicles
[Vehicle] Sending tracking data for vehicle_673_1
```

**Dashboard Updates:**
- [ ] Active Vehicles count increases
- [ ] Vehicle type distribution chart updates

---

### 6. Video Detection (Upload) ✅

**URL:** `http://localhost:5173/detect`

**Test Steps:**
1. Select location from dropdown
2. Location preview appears showing:
   - Threshold
   - Status
   - Department
   - Last count
3. Upload a video file with people
4. Click "Run Detection"

**What to Check:**
- [ ] Progress bar updates in real-time
- [ ] Live frame preview shows annotated video
- [ ] Inference log shows frame-by-frame detection
- [ ] If threshold exceeded:
  - [ ] Alert banner appears mid-stream
  - [ ] Email sent
- [ ] Final results show:
  - [ ] Total people count
  - [ ] Max people in frame
  - [ ] Density level
  - [ ] Annotated video playback

---

### 7. Alert History ✅

**URL:** `http://localhost:5173/alerts`

**What to Check:**
- [ ] All alerts listed with timestamps
- [ ] Shows location name, people count, threshold
- [ ] Email status (✅ sent or ❌ failed)
- [ ] Department badge
- [ ] Can filter by location
- [ ] Can filter by date range

---

### 8. Real-time Updates (Socket.io) ✅

**Test Steps:**
1. Open Dashboard in one browser tab
2. Open Cameras page in another tab
3. Add a camera or trigger detection

**What to Check:**
- [ ] Dashboard stats update without refresh
- [ ] Camera people counts update in real-time
- [ ] Vehicle counts update in real-time
- [ ] Alert banners appear instantly
- [ ] Status badges change color dynamically

**Browser Console (F12):**
```
Socket connected: abc123
```

---

## Feature Coordination Tests

### Test 1: Multi-Camera with All Features
1. Add 2+ cameras to same location
2. Enable Face Recognition on Camera 1
3. Enable Vehicle Tracking on Camera 2
4. Verify both work independently

### Test 2: Cross-Camera Vehicle Tracking
1. Add 2 cameras to different locations
2. Enable Vehicle Tracking on both
3. Show vehicle to Camera 1
4. Move vehicle to Camera 2
5. Check vehicle path shows both cameras

### Test 3: Simultaneous Alerts
1. Trigger crowd alert (exceed threshold)
2. Trigger face match alert
3. Verify both emails sent
4. Check Dashboard shows both alerts

### Test 4: Camera Start/Stop
1. Start camera with all features enabled
2. Stop camera
3. Verify:
   - Detection stops
   - Status changes to "stopped"
   - No more updates sent
4. Restart camera
5. Verify all features resume

---

## Common Issues & Solutions

### Issue: Camera feed not showing
**Solution:**
- Check IP Webcam app is running
- Verify phone and PC on same WiFi
- Try accessing URL directly in browser
- Check firewall settings

### Issue: Face recognition not working
**Solution:**
- Ensure face photo is clear and well-lit
- Check Python console for "[Face] Loaded X suspects"
- Verify face is visible to camera (not too far)
- Check confidence threshold (default 75%)

### Issue: Vehicle tracking not detecting
**Solution:**
- Ensure "Vehicle Tracking" checkbox was enabled
- Check Python console for vehicle detection logs
- Verify vehicle is in YOLO classes (car, truck, bus, motorcycle, bicycle)
- Try moving vehicle slowly across frame

### Issue: Socket.io connection errors
**Solution:**
- Hard refresh browser (Ctrl+Shift+R)
- Check backend is running on port 4000
- Clear browser cache
- Check browser console for errors

### Issue: Email not sending
**Solution:**
- Verify .env file has correct credentials
- Check email service logs in backend console
- Ensure Gmail App Password is correct
- Check spam folder

---

## Performance Monitoring

### Python Console
```
[Camera 673...] Detected 2 people, 1 vehicles
[Face] Loaded 3 suspects
[Vehicle] Sending tracking data for vehicle_673_1
```

### Backend Console
```
Socket client connected: abc123
POST /api/live/alert 200
POST /api/vehicles/detect 200
POST /api/face-match 200
```

### Browser Console (F12)
```
Socket connected: abc123
liveCount event received
vehicleDetected event received
```

---

## Success Criteria

✅ **All features working:**
- [ ] Dashboard shows all stats correctly
- [ ] Cameras grouped by location
- [ ] Real-time people counting
- [ ] Face recognition detecting suspects
- [ ] Vehicle tracking across cameras
- [ ] Email alerts sending
- [ ] Socket.io updates working
- [ ] All pages navigable and functional

✅ **Performance:**
- [ ] Detection runs at ~10 FPS (every 3rd frame)
- [ ] Updates sent every 2 seconds
- [ ] No lag in UI
- [ ] Socket.io reconnects automatically

✅ **Data Integrity:**
- [ ] Vehicle paths stored correctly
- [ ] Face matches recorded
- [ ] Alert history accurate
- [ ] Camera status synced

---

## Next Steps After Testing

1. **Production Deployment:**
   - Use environment variables for all configs
   - Set up proper MongoDB cluster
   - Configure email service (SendGrid, AWS SES)
   - Use HTTPS for all connections

2. **Scaling:**
   - Add load balancer for multiple cameras
   - Use Redis for Socket.io scaling
   - Implement camera stream caching
   - Add database indexing

3. **Enhancements:**
   - Add user authentication
   - Implement role-based access
   - Add camera health monitoring
   - Create mobile app
   - Add export/reporting features

---

## Support

If you encounter issues:
1. Check all three terminals for error messages
2. Verify all services are running
3. Check browser console (F12)
4. Review this guide's troubleshooting section
5. Ensure all dependencies are installed
