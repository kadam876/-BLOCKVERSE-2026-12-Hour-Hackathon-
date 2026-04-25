# Crowd Alert System ΓÇö BLOCKVERSE 2026 Hackathon

An AI-powered real-time crowd detection and public safety platform built for Indian police and transport authorities. The system uses YOLOv11 to detect people in video feeds, triggers automated email alerts when crowd thresholds are exceeded, and provides a full-featured dashboard for monitoring locations, suspects, cameras, and vehicles.

---

## What It Does

- Detects people in uploaded videos or live IP camera streams using YOLOv11n
- Automatically calculates crowd density thresholds from a training video per location
- Fires email alerts with annotated frame snapshots when crowd exceeds the threshold
- Streams frame-by-frame detection progress to the frontend via Server-Sent Events (SSE)
- Manages multiple IP cameras simultaneously with per-camera detection loops
- Tracks suspects with face recognition using OpenCV DNN (HOG embeddings + cosine similarity)
- Tracks vehicles and their movement paths across locations
- Provides a real-time dashboard with Socket.IO live updates

---

## System Architecture

```
React Frontend (5173)
        Γöé
        Γû╝
Node.js + Express Backend (4000)  ΓöÇΓöÇΓöÇΓöÇ MongoDB (27017)
        Γöé                                    Γöé
        Γû╝                               Mongoose Models
Flask + YOLO AI Engine (5002)       (Location, Alert, Camera,
        Γöé                            Suspect, Vehicle, FaceMatch)
        Γû╝
  Gmail SMTP (email alerts)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| AI Detection | YOLOv11n (Ultralytics) |
| AI Server | Python 3.10+ / Flask / OpenCV |
| Face Recognition | OpenCV DNN (Caffe SSD) + HOG embeddings |
| Backend | Node.js 18+ / Express / Socket.IO |
| Database | MongoDB / Mongoose |
| Frontend | React 18 / Vite / React Router |
| Email Alerts | Nodemailer + Gmail SMTP |
| Live Streaming | Server-Sent Events (SSE) |
| Real-time Updates | Socket.IO |

---

## Features

### Crowd Detection
- Upload a video for batch processing ΓÇö YOLO annotates every frame and outputs a processed video
- Live streaming mode shows frame-by-frame progress with people count and density level (Low / Medium / High)
- Threshold auto-calculated from a training video (normal crowd day) per location

### Multi-Camera Management
- Add multiple IP webcam streams per location
- Each camera runs an independent detection thread
- Per-camera threshold and alert email configuration
- Camera status tracked in real-time

### Suspect Tracking
- Register suspects with a photo ΓÇö face embedding extracted automatically
- During live detection, faces in frames are compared against the suspect database
- Match alerts sent to backend when confidence ΓëÑ 75%

### Vehicle Tracking
- Log vehicles with plate numbers and associate them with locations
- Track movement paths across multiple checkpoints
- View full path history per vehicle

### Alert System
- Email alerts fire immediately when crowd threshold is exceeded
- Alert includes annotated frame image as attachment
- Full alert history with timestamps, location, and people count

### Dashboard
- Real-time overview of all locations and their current crowd status
- Auto-refreshes every 10 seconds
- Socket.IO pushes live updates from backend

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB running locally on port 27017
- NVIDIA GPU recommended (CPU works but slower)

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/kadam876/-BLOCKVERSE-2026-12-Hour-Hackathon-.git
cd -BLOCKVERSE-2026-12-Hour-Hackathon-
```

### 2. Install Python dependencies

With NVIDIA GPU (recommended):
```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu128
pip install flask flask-cors opencv-python ultralytics numpy pillow requests
```

CPU only:
```bash
pip install torch torchvision
pip install flask flask-cors opencv-python ultralytics numpy pillow requests
```

Or install everything at once:
```bash
pip install -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cu128
```

### 3. Install Node dependencies

```bash
cd crowd-alert-system/backend
npm install

cd ../frontend
npm install
```

### 4. Configure environment

Create `crowd-alert-system/backend/.env`:
```
MONGO_URI=mongodb://localhost:27017/crowd_alert
PORT=4000
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
```

> Gmail App Password required ΓÇö generate one at: https://myaccount.google.com/apppasswords

### 5. YOLO model

The `yolo11n.pt` model (5.4 MB) is included in the repo. If missing, Ultralytics will auto-download it on first run.

---

## Running the System

Open 3 terminals:

**Terminal 1 ΓÇö Flask AI engine:**
```bash
python people.py
```

**Terminal 2 ΓÇö Node.js backend:**
```bash
cd crowd-alert-system/backend
node server.js
```

**Terminal 3 ΓÇö React frontend:**
```bash
cd crowd-alert-system/frontend
npm run dev
```

Open `http://localhost:5173`

---

## Usage Guide

### Setting Up a Location
1. Go to **Locations** ΓåÆ Add a new location
2. Click the location ΓåÆ complete the setup wizard
3. Enter department (Police / Transport) and authority email
4. Upload a training video (normal crowd day) ΓÇö YOLO calculates the threshold automatically

### Running Detection
1. Go to **Detect** ΓåÆ upload a test video
2. Live inference streams frame-by-frame with people count overlay
3. If crowd exceeds threshold ΓåÆ email alert fires with annotated frame

### Live Camera
1. Go to **Cameras** ΓåÆ add an IP webcam URL
2. Start detection ΓÇö the camera thread runs independently in the background
3. Alerts fire automatically when threshold is exceeded

### Suspects
1. Go to **Suspects** ΓåÆ add a suspect with a photo
2. Enable face recognition in live detection settings
3. Matches are logged automatically with confidence score and face snapshot

### Vehicles
1. Go to **Vehicles** ΓåÆ register a vehicle with plate number
2. Log checkpoint sightings to build a movement path
3. View full path history on the vehicle detail page

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/locations` | List all locations |
| POST | `/api/locations` | Create location |
| GET | `/api/alerts` | Alert history |
| POST | `/api/live/alert` | Trigger crowd alert check |
| GET | `/api/suspects` | List suspects |
| POST | `/api/face-match` | Log a face match |
| GET | `/api/cameras` | List cameras |
| GET | `/api/vehicles` | List vehicles |
| POST | `/live/start` | Start live detection (Flask) |
| POST | `/live/stop` | Stop live detection (Flask) |
| POST | `/detect_video_stream` | Stream video detection (SSE) |

---

## Project Structure

```
Γö£ΓöÇΓöÇ people.py                        # Flask AI server (YOLO + face recognition)
Γö£ΓöÇΓöÇ yolo11n.pt                       # YOLO model weights
Γö£ΓöÇΓöÇ requirements.txt
Γö£ΓöÇΓöÇ templates/                       # Flask HTML templates
Γö£ΓöÇΓöÇ crowd-alert-system/
Γöé   Γö£ΓöÇΓöÇ backend/
Γöé   Γöé   Γö£ΓöÇΓöÇ server.js                # Express + Socket.IO server
Γöé   Γöé   Γö£ΓöÇΓöÇ models/                  # Mongoose schemas
Γöé   Γöé   Γöé   Γö£ΓöÇΓöÇ Alert.js
Γöé   Γöé   Γöé   Γö£ΓöÇΓöÇ Camera.js
Γöé   Γöé   Γöé   Γö£ΓöÇΓöÇ FaceMatch.js
Γöé   Γöé   Γöé   Γö£ΓöÇΓöÇ Location.js
Γöé   Γöé   Γöé   Γö£ΓöÇΓöÇ Suspect.js
Γöé   Γöé   Γöé   Γö£ΓöÇΓöÇ Vehicle.js
Γöé   Γöé   Γöé   ΓööΓöÇΓöÇ VehicleTracking.js
Γöé   Γöé   Γö£ΓöÇΓöÇ routes/                  # Express route handlers
Γöé   Γöé   ΓööΓöÇΓöÇ services/
Γöé   Γöé       Γö£ΓöÇΓöÇ crowdService.js      # Threshold logic + alert trigger
Γöé   Γöé       ΓööΓöÇΓöÇ emailService.js      # Nodemailer email sender
Γöé   ΓööΓöÇΓöÇ frontend/
Γöé       ΓööΓöÇΓöÇ src/
Γöé           Γö£ΓöÇΓöÇ App.jsx              # Router + nav
Γöé           ΓööΓöÇΓöÇ pages/
Γöé               Γö£ΓöÇΓöÇ Dashboard.jsx
Γöé               Γö£ΓöÇΓöÇ VideoDetect.jsx
Γöé               Γö£ΓöÇΓöÇ LiveCamera.jsx
Γöé               Γö£ΓöÇΓöÇ Cameras.jsx
Γöé               Γö£ΓöÇΓöÇ Suspects.jsx
Γöé               Γö£ΓöÇΓöÇ VehicleTracking.jsx
Γöé               Γö£ΓöÇΓöÇ AlertHistory.jsx
Γöé               ΓööΓöÇΓöÇ Locations.jsx
```

---

## Built At

BLOCKVERSE 2026 ΓÇö 12-Hour Hackathon

**Repository:** https://github.com/kadam876/-BLOCKVERSE-2026-12-Hour-Hackathon-

Timing: 4:05
