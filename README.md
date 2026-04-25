# Crowd Alert System

AI-powered crowd detection and real-time alert system for Indian police and transport authorities.
Built for BLOCKVERSE 2026 Hackathon.

## Architecture

```
React Frontend (5173) → Node.js Backend (4000) → Flask + YOLO (5002) → MongoDB
                                                        ↓
                                                  Gmail SMTP (alerts)
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB (running locally on port 27017)
- NVIDIA GPU recommended (CPU works but slower)

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/kadam876/-BLOCKVERSE-2026-12-Hour-Hackathon-.git
cd -BLOCKVERSE-2026-12-Hour-Hackathon-
```

### 2. Install Python dependencies

**With NVIDIA GPU (recommended):**
```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu128
pip install flask opencv-python ultralytics numpy
```

**CPU only:**
```bash
pip install torch torchvision
pip install flask opencv-python ultralytics numpy
```

Or install everything at once (GPU version):
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

> Gmail App Password required. Generate at: https://myaccount.google.com/apppasswords

### 5. Download YOLO model

The `yolo11n.pt` model file is included in the repo (5.4 MB).
If missing, it will auto-download on first run.

---

## Run

Open 3 terminals:

**Terminal 1 — Flask YOLO engine:**
```bash
python people.py
```

**Terminal 2 — Node.js backend:**
```bash
cd crowd-alert-system/backend
node server.js
```

**Terminal 3 — React frontend:**
```bash
cd crowd-alert-system/frontend
npm run dev
```

Open `http://localhost:5173`

---

## Usage

1. **Locations** → Add a location → click it → complete setup wizard
   - Enter department (Police / Transport) + authority email
   - Upload a **training video** (normal crowd day) → YOLO calculates threshold automatically

2. **Test** → Upload a testing video → live inference stream shows frame-by-frame detection
   - If crowd exceeds threshold → email alert fires immediately with annotated frame image

3. **Dashboard** → Real-time status of all locations (auto-refreshes every 10s)

4. **Alerts** → Full history of all triggered alerts

---

## Tech Stack

| Layer | Technology |
|---|---|
| AI Detection | YOLOv11n (Ultralytics) |
| AI Server | Python + Flask |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Frontend | React + Vite |
| Email | Nodemailer + Gmail SMTP |
| Streaming | Server-Sent Events (SSE) |
