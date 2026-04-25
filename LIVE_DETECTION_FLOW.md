# Live Detection & Email Alert Flow

## How It Works

### 1. **Start Detection**
- User enters IP Webcam URL: `http://YOUR_PHONE_IP:8080/video`
- User selects location: `Test Camera`
- User enters custom threshold (optional): e.g., `5` (or leaves empty to use default `20`)
- Clicks **Start Detection**

### 2. **Python YOLO Processing**
- Flask receives the request at `/live/start`
- Starts background thread that:
  - Captures frames from IP Webcam every 3rd frame (optimization)
  - Runs YOLO person detection on each frame
  - Counts number of people detected
  - Every 2 seconds, sends data to Node.js backend

### 3. **Backend Processing**
- Node.js receives POST at `/api/live/alert` with:
  ```json
  {
    "locationId": "...",
    "peopleCount": 12,
    "customThreshold": 5,
    "frameImage": "base64_jpeg_string"
  }
  ```
- Compares `peopleCount` vs `threshold`:
  - If `peopleCount > threshold` → **ALERT TRIGGERED**
  - Status: `critical` (red), `warning` (orange), or `normal` (green)

### 4. **Email Alert (When Threshold Exceeded)**
- **Cooldown**: 5 minutes between alerts per location (prevents spam)
- **Email sent to**: `lalitahire2025@gmail.com` (configured in .env)
- **Email includes**:
  - Location name
  - People count vs threshold
  - Severity level (CRITICAL/HIGH/MODERATE)
  - Frame image showing detected people with bounding boxes
  - Smart action suggestions based on department (police/transport)

### 5. **Real-Time Updates**
- Socket.io broadcasts to all connected browsers:
  - `liveCount` event → updates people count in real-time
  - `crowdAlert` event → shows red alert banner when threshold exceeded
- Dashboard shows live status with pulsing green dot

---

## Testing the Flow

### Quick Test (Low Threshold)
1. Set threshold to `5`
2. Point camera at 6+ people
3. Within 2 seconds, you should see:
   - People count update to `6` or more
   - Status turns **red** (critical)
   - Alert banner appears
   - Email sent to `lalitahire2025@gmail.com`

### Check Email
- **Subject**: `🚨 [CRITICAL] Crowd Alert — Test Camera (6 people / threshold: 5)`
- **Body**: HTML email with frame image, stats, and action suggestions
- **Attachment**: JPEG image of the detection frame

---

## Current Configuration

| Setting | Value |
|---------|-------|
| Email | `lalitahire2025@gmail.com` |
| Default Threshold | 20 people |
| Cooldown | 5 minutes |
| Detection Interval | Every 2 seconds |
| Frame Processing | Every 3rd frame |

---

## Troubleshooting

**Email not sending?**
- Check backend logs for "Email failed" errors
- Verify Gmail App Password is correct in `.env`
- Check spam folder

**No detection?**
- Verify camera URL works in browser
- Check Flask logs: `[Live] Stream opened`
- Ensure people are visible in camera frame

**Threshold not working?**
- Make sure you entered a number in the threshold field
- Check backend logs to see what threshold is being used
- Try a very low threshold (e.g., 1) to test immediately
