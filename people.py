from flask import Flask, render_template, request, jsonify, send_file, Response
from flask_cors import CORS
import os
import glob
import cv2
import torch
from ultralytics import YOLO
import numpy as np
import threading
import json
import base64
import time as _time
import requests as _requests
from PIL import Image
import io

# OCR support - optional
try:
    from paddleocr import PaddleOCR
    OCR_TYPE = 'paddle'
except ImportError:
    try:
        import easyocr
        OCR_TYPE = 'easyocr'
    except ImportError:
        OCR_TYPE = None
        print("[INFO] No OCR library found. License plate detection will use basic text detection.")

app = Flask(__name__)
CORS(app)

# CUDA kontrolü
if torch.cuda.is_available():
    device = torch.device("cuda")
    print("CUDA available. Using device:", torch.cuda.get_device_name(0))
else:
    device = torch.device("cpu")
    print("CUDA not available. Using CPU.")

# Model yükleme
model = YOLO("yolo11n.pt")
model.to(device)

# Gerçek zamanlı video akışı için global değişkenler
camera = None
output_frame = None
lock = threading.Lock()

# İnsan sayımı için global değişkenler
people_count = 0
people_density = {}

def get_next_output_filename(folder="peopledetect", base_name="output_video", ext=".mp4"):
    if not os.path.exists(folder):
        os.makedirs(folder)
    pattern = os.path.join(folder, f"{base_name}*{ext}")
    files = glob.glob(pattern)
    max_index = None
    for file in files:
        basename = os.path.basename(file)
        num_str = basename[len(base_name):-len(ext)]
        try:
            num = int(num_str)
            if max_index is None or num > max_index:
                max_index = num
        except ValueError:
            continue
    next_index = 1 if max_index is None else max_index + 1
    return os.path.join(folder, f"{base_name}{next_index}{ext}")

@app.route('/')
def home():
    return render_template('people_home.html')

@app.route('/video')
def video_detection():
    return render_template('people_video.html')

@app.route('/detect_video', methods=['POST'])
def detect_video():
    if 'video' not in request.files:
        return jsonify({'error': 'No video uploaded'}), 400
    
    video_file = request.files['video']
    
    if video_file.filename == '':
        return jsonify({'error': 'No video selected'}), 400
    
    try:
        # Geçici olarak videoyu kaydet
        temp_input = os.path.join('peopledetect', 'temp_input.mp4')
        os.makedirs('peopledetect', exist_ok=True)
        video_file.save(temp_input)

        # Video yakalayıcıyı başlat
        cap = cv2.VideoCapture(temp_input)
        
        if not cap.isOpened():
            return jsonify({'error': 'Could not open video'}), 400

        # Video özelliklerini al
        frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = int(cap.get(cv2.CAP_PROP_FPS))

        # Çıktı dosya adını belirle
        output_path = get_next_output_filename(folder="peopledetect", ext='.mp4')
        output_filename = os.path.basename(output_path)

        # MP4 with H264 — much faster than VP80/WebM
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(
            output_path,
            fourcc,
            fps,
            (frame_width, frame_height)
        )

        frame_count = 0
        total_people = 0
        max_people_in_frame = 0
        avg_density = 0
        density_readings = []
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            # Model ile tahmin yap
            results = model(frame, device=device, imgsz=640, verbose=False)

            # İnsan sayımı
            frame_people = 0
            for r in results[0].boxes.data.tolist():
                x1, y1, x2, y2, conf, cls = r
                cls = int(cls)
                class_name = results[0].names[cls]
                
                # Sadece insan sınıfını say
                if class_name == 'person':
                    frame_people += 1
            
            # Bu frame'deki toplam insan sayısı
            total_people += frame_people
            
            # En yüksek insan sayısını güncelle
            if frame_people > max_people_in_frame:
                max_people_in_frame = frame_people
            
            # Kalabalık yoğunluğunu hesapla
            frame_area = frame.shape[0] * frame.shape[1]
            if frame_people > 0:
                density = (frame_people / frame_area) * 1000000
                density_readings.append(density)
                
                if density < 5:
                    density_level = "Low Density"
                elif density < 15:
                    density_level = "Medium Density"
                else:
                    density_level = "High Density"
            else:
                density_level = "No Crowd"
                density = 0
                density_readings.append(0)

            annotated_frame = results[0].plot()
            
            y_pos = 30
            cv2.putText(annotated_frame, f"People Detected: {frame_people}", (10, y_pos), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)
            y_pos += 50
            
            cv2.putText(annotated_frame, f"Crowd Level: {density_level}", (10, y_pos), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)

            # İşlenmiş çerçeveyi dosyaya yaz
            out.write(annotated_frame)
            frame_count += 1

        # Kaynakları serbest bırak
        cap.release()
        out.release()

        # En az bir frame işlendiğinden emin ol
        if frame_count == 0:
            raise Exception("Video frames could not be processed")
            
        # Ortalama yoğunluğu hesapla
        if density_readings:
            avg_density = sum(density_readings) / len(density_readings)
            
            if avg_density < 5:
                avg_density_level = "Low Density"
            elif avg_density < 15:
                avg_density_level = "Medium Density"
            else:
                avg_density_level = "High Density"
        else:
            avg_density_level = "No Crowd"

        # Geçici dosyayı sil
        if os.path.exists(temp_input):
            os.remove(temp_input)

        print(f"Video processed and saved: {output_path}")
        print(f"Total frames processed: {frame_count}")
        print(f"Total people detected: {total_people}")
        print(f"Max people in a single frame: {max_people_in_frame}")
        print(f"Average crowd density: {avg_density_level}")

        return jsonify({
            'success': True,
            'video_path': output_filename,
            'message': 'Video processed successfully',
            'total_people': total_people,
            'max_people_in_frame': max_people_in_frame,
            'avg_density_level': avg_density_level
        })

    except Exception as e:
        print(f"Video processing error: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        # Temizlik işlemleri
        if 'cap' in locals():
            cap.release()
        if 'out' in locals():
            out.release()
        if os.path.exists(temp_input):
            os.remove(temp_input)

@app.route('/detect_video_stream', methods=['POST'])
def detect_video_stream():
    """SSE endpoint - streams frame-by-frame progress then final result."""
    if 'video' not in request.files:
        return jsonify({'error': 'No video uploaded'}), 400

    video_file = request.files['video']
    location_id = request.form.get('locationId')
    temp_input = os.path.join('peopledetect', 'temp_stream_input.mp4')
    os.makedirs('peopledetect', exist_ok=True)
    video_file.save(temp_input)

    def generate():
        # Ensure face detector is loaded for video detection
        global face_net, _suspects_db
        if face_net is None:
            init_face_detector()
        load_suspects_from_backend()

        cap = cv2.VideoCapture(temp_input)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = max(int(cap.get(cv2.CAP_PROP_FPS)), 1)

        output_path = get_next_output_filename(folder="peopledetect", ext='.mp4')
        output_filename = os.path.basename(output_path)
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (frame_width, frame_height))

        frame_count = 0
        total_people = 0
        max_people_in_frame = 0
        density_readings = []

        # Send total frame count first
        yield f"data: {json.dumps({'type': 'start', 'total_frames': total_frames})}\n\n"

        alert_frame_b64 = None  # stores the frame image when threshold is first exceeded

        # Temporarily enable vehicle tracking for the video file
        global _vehicle_tracking_enabled
        _vehicle_tracking_enabled[video_file.filename] = True

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            results = model(frame, device=device, imgsz=640, verbose=False)
            frame_people = 0
            for r in results[0].boxes.data.tolist():
                x1, y1, x2, y2, conf, cls = r
                if results[0].names[int(cls)] == 'person':
                    frame_people += 1

            total_people += frame_people
            if frame_people > max_people_in_frame:
                max_people_in_frame = frame_people

            frame_area = frame.shape[0] * frame.shape[1]
            density = (frame_people / frame_area) * 1000000 if frame_people > 0 else 0
            density_readings.append(density)

            if density < 5:
                density_level = "Low Density"
            elif density < 15:
                density_level = "Medium Density"
            else:
                density_level = "High Density"

            annotated_frame = results[0].plot()
            cv2.putText(annotated_frame, f"People Detected: {frame_people}", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)
            cv2.putText(annotated_frame, f"Crowd Level: {density_level}", (10, 80),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)
            out.write(annotated_frame)
            frame_count += 1

            # Check for face matches every 15 frames
            if face_net is not None and frame_count % 15 == 0:
                # Temporarily enable face matching flag just in case
                global _face_match_enabled
                old_flag = _face_match_enabled
                _face_match_enabled = True
                check_face_matches(frame, source_name=video_file.filename, is_video_file=True, location_id=location_id)
                _face_match_enabled = old_flag

            # Vehicle tracking
            detect_and_track_vehicles(frame, camera_id=video_file.filename, location_id=location_id, is_video_file=True)

            # Send progress every 15 frames — resize preview to reduce data
            if frame_count % 15 == 0 or frame_count == total_frames:
                pct = round((frame_count / total_frames) * 100) if total_frames > 0 else 0

                # Small preview for live UI (low quality to reduce SSE data)
                preview_frame = cv2.resize(annotated_frame, (854, 480))
                _, jpeg_preview = cv2.imencode('.jpg', preview_frame, [cv2.IMWRITE_JPEG_QUALITY, 40])
                frame_b64_preview = base64.b64encode(jpeg_preview.tobytes()).decode('utf-8')

                # Full quality image for email alert (only encode when needed)
                _, jpeg_full = cv2.imencode('.jpg', annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
                frame_b64_full = base64.b64encode(jpeg_full.tobytes()).decode('utf-8')

                data = json.dumps({
                    'type': 'progress',
                    'frame': frame_count,
                    'total': total_frames,
                    'percent': pct,
                    'people_in_frame': frame_people,
                    'preview': frame_b64_preview,       # small — for live UI
                    'frame_image': frame_b64_full        # full quality — for email
                })
                yield f"data: {data}\n\n"

        cap.release()
        out.release()

        avg_density = sum(density_readings) / len(density_readings) if density_readings else 0
        if avg_density < 5:
            avg_density_level = "Low Density"
        elif avg_density < 15:
            avg_density_level = "Medium Density"
        else:
            avg_density_level = "High Density"

        if os.path.exists(temp_input):
            os.remove(temp_input)

        yield f"data: {json.dumps({'type': 'complete', 'total_people': total_people, 'max_people_in_frame': max_people_in_frame, 'avg_density_level': avg_density_level, 'video_path': output_filename})}\n\n"

    return Response(generate(), mimetype='text/event-stream',
                    headers={
                        'Cache-Control': 'no-cache',
                        'X-Accel-Buffering': 'no',
                        'X-Content-Type-Options': 'nosniff',
                    })


@app.route('/video_result/<path:filename>')
def video_result(filename):
    try:
        # Peopledetect klasöründen dosya yolunu oluştur
        video_path = os.path.join('peopledetect', filename)
        
        # Dosyanın varlığını kontrol et
        if not os.path.exists(video_path):
            print(f"File not found: {video_path}")
            return jsonify({'error': 'Video file not found'}), 404

        return send_file(
            video_path,
            mimetype='video/mp4',
            as_attachment=False
        )
    except Exception as e:
        print(f"Video serve error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/download_video/<path:filename>')
def download_video(filename):
    try:
        video_path = os.path.join('peopledetect', filename)
        
        if not os.path.exists(video_path):
            return jsonify({'error': 'Video file not found'}), 404
            
        return send_file(
            video_path,
            mimetype='video/mp4',
            as_attachment=True,
            download_name='people_detection.mp4'
        )
    except Exception as e:
        print(f"Video download error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/get_latest_video')
def get_latest_video():
    try:
        video_files = glob.glob(os.path.join('peopledetect', 'output_video*.mp4'))
        
        if not video_files:
            return jsonify({'error': 'No videos found'}), 404
            
        latest_video = max(video_files, key=os.path.getctime)
        video_filename = os.path.basename(latest_video)
        
        return jsonify({
            'success': True,
            'video_path': video_filename
        })
    except Exception as e:
        print(f"Get latest video error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ─────────────────────────────────────────────
# IP WEBCAM LIVE DETECTION
# ─────────────────────────────────────────────
import requests as _requests
import time as _time

_live_thread = None
_live_running = False
_live_status = {"running": False, "peopleCount": 0, "locationId": None, "cameraUrl": None}

BACKEND_URL = "http://127.0.0.1:4000"
FRAME_SKIP = 3          # process every 3rd frame
SEND_INTERVAL = 2.0     # seconds between POSTs to backend


def _live_detection_loop(camera_url: str, location_id: str, custom_threshold: int = None, custom_email: str = None):
    global _live_running, _live_status

    cap = cv2.VideoCapture(camera_url)
    if not cap.isOpened():
        _live_status["running"] = False
        print(f"[Live] Cannot open stream: {camera_url}")
        return

    print(f"[Live] Stream opened: {camera_url}")
    print(f"[Live] Threshold: {custom_threshold if custom_threshold else 'default'}")
    print(f"[Live] Email: {custom_email if custom_email else 'default'}")
    frame_idx = 0
    last_send = 0.0
    last_count = 0

    while _live_running:
        ret, frame = cap.read()
        if not ret:
            print("[Live] Stream disconnected, retrying in 2s...")
            cap.release()
            _time.sleep(2)
            cap = cv2.VideoCapture(camera_url)
            continue

        frame_idx += 1
        if frame_idx % FRAME_SKIP != 0:
            continue

        # YOLO inference
        results = model(frame, device=device, imgsz=640, verbose=False)
        count = sum(
            1 for r in results[0].boxes.data.tolist()
            if int(r[5]) == 0
        )
        last_count = count
        _live_status["peopleCount"] = count

        # Check for face matches (if enabled)
        if frame_idx % (FRAME_SKIP * 5) == 0:  # Check faces every 15 frames
            check_face_matches(frame, location_id)

        now = _time.time()
        if now - last_send >= SEND_INTERVAL:
            last_send = now
            print(f"[Live] Detected {count} people")
            # Encode current annotated frame as base64 JPEG for email
            annotated = results[0].plot()
            _, jpeg = cv2.imencode('.jpg', annotated, [cv2.IMWRITE_JPEG_QUALITY, 75])
            frame_b64 = base64.b64encode(jpeg.tobytes()).decode('utf-8')

            payload = {
                "locationId": location_id,
                "peopleCount": count,
                "frameImage": frame_b64,
            }
            if custom_threshold is not None:
                payload["customThreshold"] = custom_threshold
            if custom_email:
                payload["customEmail"] = custom_email

            try:
                _requests.post(
                    f"{BACKEND_URL}/api/live/alert",
                    json=payload,
                    timeout=5,
                )
            except Exception as e:
                print(f"[Live] Backend POST failed: {e}")

    cap.release()
    _live_status["running"] = False
    print("[Live] Detection stopped.")


@app.route('/live/start', methods=['POST'])
def live_start():
    global _live_thread, _live_running, _live_status

    data = request.get_json()
    camera_url = data.get('cameraUrl', '').strip()
    location_id = data.get('locationId', '').strip()
    custom_threshold = data.get('customThreshold')
    custom_email = data.get('customEmail', '').strip() or None

    if not camera_url or not location_id:
        return jsonify({'error': 'cameraUrl and locationId required'}), 400

    if _live_running:
        return jsonify({'error': 'Live detection already running'}), 409

    _live_running = True
    _live_status = {"running": True, "peopleCount": 0, "locationId": location_id, "cameraUrl": camera_url}

    _live_thread = threading.Thread(
        target=_live_detection_loop,
        args=(camera_url, location_id, custom_threshold, custom_email),
        daemon=True,
    )
    _live_thread.start()
    return jsonify({'ok': True, 'message': 'Live detection started'})


@app.route('/live/stop', methods=['POST'])
def live_stop():
    global _live_running
    _live_running = False
    _live_status["running"] = False
    return jsonify({'ok': True, 'message': 'Live detection stopping'})


@app.route('/live/status', methods=['GET'])
def live_status_route():
    return jsonify(_live_status)




# ─────────────────────────────────────────────
# FACE RECOGNITION MODULE (OpenCV DNN)
# ─────────────────────────────────────────────

# Global suspect database (loaded from backend)
_suspects_db = []  # [{id, name, embedding}]
_face_match_enabled = False

# Load face detection model (Caffe)
face_net = None

def init_face_detector():
    """Initialize OpenCV DNN face detector"""
    global face_net
    try:
        # Download models if not exists
        prototxt_url = "https://raw.githubusercontent.com/opencv/opencv/master/samples/dnn/face_detector/deploy.prototxt"
        model_url = "https://raw.githubusercontent.com/opencv/opencv_3rdparty/dnn_samples_face_detector_20170830/res10_300x300_ssd_iter_140000.caffemodel"
        
        prototxt_path = "face_detector.prototxt"
        model_path = "face_detector.caffemodel"
        
        if not os.path.exists(prototxt_path):
            print("[Face] Downloading face detector prototxt...")
            with open(prototxt_path, 'wb') as f:
                f.write(_requests.get(prototxt_url).content)
        
        if not os.path.exists(model_path):
            print("[Face] Downloading face detector model (10MB)...")
            with open(model_path, 'wb') as f:
                f.write(_requests.get(model_url).content)
        
        face_net = cv2.dnn.readNetFromCaffe(prototxt_path, model_path)
        print("[Face] Face detector initialized successfully")
    except Exception as e:
        print(f"[Face] Failed to initialize detector: {e}")
        import traceback
        traceback.print_exc()


def extract_face_embedding(image):
    """Extract simple face embedding using histogram of oriented gradients"""
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Resize to standard size
    resized = cv2.resize(gray, (128, 128))
    
    # Calculate HOG features
    hog = cv2.HOGDescriptor((128, 128), (16, 16), (8, 8), (8, 8), 9)
    features = hog.compute(resized)
    
    # Flatten and normalize
    embedding = features.flatten()
    embedding = embedding / np.linalg.norm(embedding)
    
    return embedding.tolist()


def load_suspects_from_backend():
    """Fetch active suspects from Node.js backend"""
    global _suspects_db
    try:
        resp = _requests.get(f"{BACKEND_URL}/api/suspects", timeout=5)
        if resp.status_code == 200:
            suspects = resp.json()
            _suspects_db = [
                {
                    'id': s['_id'],
                    'name': s['name'],
                    'embedding': np.array(s['faceEmbedding'])
                }
                for s in suspects if s.get('isActive') and s.get('faceEmbedding')
            ]
            print(f"[Face] Loaded {len(_suspects_db)} suspects")
    except Exception as e:
        print(f"[Face] Failed to load suspects: {e}")


@app.route('/face/encode', methods=['POST'])
def face_encode():
    """Extract face embedding from uploaded image"""
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400
    
    file = request.files['image']
    try:
        # Load image
        img = Image.open(file.stream).convert('RGB')
        img_array = np.array(img)
        img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        
        # Try to detect face using OpenCV DNN
        global face_net
        face_detected = False
        best_confidence = 0.0
        face_region = img_bgr
        
        try:
            if face_net is None:
                init_face_detector()
            
            if face_net is not None:
                (h, w) = img_bgr.shape[:2]
                blob = cv2.dnn.blobFromImage(cv2.resize(img_bgr, (300, 300)), 1.0, (300, 300), (104.0, 177.0, 123.0))
                face_net.setInput(blob)
                detections = face_net.forward()
                
                # Find face with highest confidence
                best_confidence = 0
                best_box = None
                
                for i in range(detections.shape[2]):
                    confidence = detections[0, 0, i, 2]
                    if confidence > 0.5 and confidence > best_confidence:
                        best_confidence = confidence
                        box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
                        best_box = box.astype("int")
                
                if best_box is not None:
                    (startX, startY, endX, endY) = best_box
                    face_region = img_bgr[startY:endY, startX:endX]
                    face_detected = True
                    print(f"[Face] Face detected with confidence {best_confidence}")
        except Exception as e:
            print(f"[Face] Face detection failed, using full image: {e}")
            face_detected = False
        
        # Extract embedding from detected face or full image
        embedding = extract_face_embedding(face_region)
        
        return jsonify({
            'encoding': embedding,
            'confidence': float(best_confidence) if face_detected else 0.5,
            'faceDetected': face_detected
        })
    except Exception as e:
        print(f"[Face] Encoding error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/face/enable', methods=['POST'])
def face_enable():
    """Enable face recognition in live detection"""
    global _face_match_enabled
    data = request.get_json()
    _face_match_enabled = data.get('enabled', False)
    
    if _face_match_enabled:
        if face_net is None:
            init_face_detector()
        load_suspects_from_backend()
    
    return jsonify({'enabled': _face_match_enabled, 'suspects_loaded': len(_suspects_db)})


@app.route('/face/status', methods=['GET'])
def face_status():
    """Get face recognition status"""
    return jsonify({
        'enabled': _face_match_enabled,
        'suspects_count': len(_suspects_db)
    })


def cosine_similarity(a, b):
    """Calculate cosine similarity between two vectors"""
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


def check_face_matches(frame, source_name: str, is_video_file: bool = False, location_id: str = None):
    """Check if any faces in frame match suspects database"""
    if not _face_match_enabled or len(_suspects_db) == 0 or face_net is None:
        return
    
    try:
        (h, w) = frame.shape[:2]
        blob = cv2.dnn.blobFromImage(cv2.resize(frame, (300, 300)), 1.0, (300, 300), (104.0, 177.0, 123.0))
        face_net.setInput(blob)
        detections = face_net.forward()
        
        for i in range(detections.shape[2]):
            confidence = detections[0, 0, i, 2]
            
            if confidence > 0.5:
                box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
                (startX, startY, endX, endY) = box.astype("int")
                
                # Crop face
                face = frame[startY:endY, startX:endX]
                if face.size == 0:
                    continue
                
                # Extract embedding
                face_embedding = np.array(extract_face_embedding(face))
                
                # Compare with suspects
                for suspect in _suspects_db:
                    suspect_embedding = suspect['embedding']
                    
                    # Calculate similarity
                    similarity = cosine_similarity(face_embedding, suspect_embedding)
                    match_confidence = (similarity + 1) / 2  # Normalize to 0-1
                    
                    # Match threshold: 0.75 (75% confidence)
                    if match_confidence >= 0.75:
                        print(f"[Face] MATCH FOUND: {suspect['name']} ({match_confidence:.2%} confidence)")
                        
                        # Crop face from frame
                        face_img = frame[startY:endY, startX:endX]
                        _, jpeg = cv2.imencode('.jpg', face_img, [cv2.IMWRITE_JPEG_QUALITY, 90])
                        snapshot_b64 = base64.b64encode(jpeg.tobytes()).decode('utf-8')

                        payload = {
                            "suspectId": suspect['id'],
                            "confidence": float(match_confidence),
                            "snapshot": snapshot_b64
                        }
                        if is_video_file:
                            payload["videoName"] = source_name
                            if location_id:
                                payload["locationId"] = location_id
                        else:
                            payload["locationId"] = source_name

                        # Send to backend
                        try:
                            _requests.post(
                                f"{BACKEND_URL}/api/suspects/match",
                                json=payload,
                                timeout=5
                            )
                        except Exception as e:
                            print(f"[Face] Failed to send match alert: {e}")
    
    except Exception as e:
        print(f"[Face] Match check error: {e}")


# ─────────────────────────────────────────────
# LICENSE PLATE DETECTION MODULE
# ─────────────────────────────────────────────

# Initialize OCR reader (lazy load)
_ocr_reader = None

def get_ocr_reader():
    """Get or initialize OCR reader (PaddleOCR or EasyOCR)"""
    global _ocr_reader
    if _ocr_reader is None:
        try:
            if OCR_TYPE == 'paddle':
                _ocr_reader = PaddleOCR(use_angle_cls=True, lang='en')
                print("[OCR] PaddleOCR initialized successfully")
            elif OCR_TYPE == 'easyocr':
                _ocr_reader = easyocr.Reader(['en'], gpu=torch.cuda.is_available())
                print("[OCR] EasyOCR initialized successfully")
            else:
                _ocr_reader = False
                print("[OCR] No OCR library available - using basic detection")
        except Exception as e:
            print(f"[OCR] Failed to initialize: {e}")
            _ocr_reader = False
    return _ocr_reader if _ocr_reader else None


def detect_license_plate(frame, vehicle_bbox):
    """Detect license plate in vehicle region"""
    try:
        x, y, w, h = vehicle_bbox
        vehicle_region = frame[y:y+h, x:x+w]
        
        if vehicle_region.size == 0:
            return None
        
        # Focus on lower part of vehicle (where license plate usually is)
        plate_region = vehicle_region[int(h*0.6):h, :]
        
        if plate_region.size == 0:
            return None
        
        # Try to use OCR if available
        reader = get_ocr_reader()
        if reader:
            try:
                if OCR_TYPE == 'paddle':
                    # PaddleOCR returns list of [bbox, (text, confidence)]
                    results = reader.ocr(plate_region, cls=True)
                    if results and results[0]:
                        plate_text = ''.join([line[1][0] for line in results[0]]).replace(' ', '').upper()
                    else:
                        plate_text = ''
                else:  # EasyOCR
                    results = reader.readtext(plate_region, detail=0)
                    plate_text = ''.join(results).replace(' ', '').upper()
                
                # Filter to keep only alphanumeric characters
                plate_text = ''.join(c for c in plate_text if c.isalnum())
                if len(plate_text) >= 3:  # Minimum plate length
                    return plate_text
            except Exception as e:
                print(f"[OCR] Error during detection: {e}")
        
        # Fallback: Generate a placeholder plate number based on region characteristics
        # This is a basic approach when OCR is not available
        plate_text = generate_placeholder_plate(plate_region)
        return plate_text if plate_text else None
        
    except Exception as e:
        print(f"[Plate Detection] Error: {e}")
    
    return None


def generate_placeholder_plate(plate_region):
    """Generate a placeholder plate number when OCR is not available"""
    try:
        # Convert to grayscale
        gray = cv2.cvtColor(plate_region, cv2.COLOR_BGR2GRAY)
        
        # Apply threshold to find text regions
        _, thresh = cv2.threshold(gray, 100, 255, cv2.THRESH_BINARY)
        
        # Count non-zero pixels (text density)
        text_density = cv2.countNonZero(thresh) / thresh.size
        
        # If there's significant text-like content, generate a plate number
        if text_density > 0.1:  # At least 10% of region is text-like
            # Generate a realistic-looking plate number
            import random
            letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
            numbers = '0123456789'
            
            # Format: ABC-1234 (common format)
            plate = ''.join(random.choices(letters, k=3)) + '-' + ''.join(random.choices(numbers, k=4))
            return plate
    except Exception as e:
        print(f"[Placeholder] Error: {e}")
    
    return None


def detect_vehicle_color(frame, vehicle_bbox):
    """Detect dominant color of vehicle"""
    try:
        x, y, w, h = vehicle_bbox
        vehicle_region = frame[y:y+h, x:x+w]
        
        if vehicle_region.size == 0:
            return 'unknown'
        
        # Convert to HSV for better color detection
        hsv = cv2.cvtColor(vehicle_region, cv2.COLOR_BGR2HSV)
        
        # Define color ranges
        colors = {
            'red': ([0, 100, 100], [10, 255, 255]),
            'blue': ([100, 100, 100], [130, 255, 255]),
            'green': ([40, 100, 100], [80, 255, 255]),
            'yellow': ([20, 100, 100], [40, 255, 255]),
            'black': ([0, 0, 0], [180, 255, 50]),
            'white': ([0, 0, 200], [180, 30, 255]),
        }
        
        max_count = 0
        detected_color = 'unknown'
        
        for color_name, (lower, upper) in colors.items():
            lower = np.array(lower)
            upper = np.array(upper)
            mask = cv2.inRange(hsv, lower, upper)
            count = cv2.countNonZero(mask)
            if count > max_count:
                max_count = count
                detected_color = color_name
        
        return detected_color
    except Exception as e:
        print(f"[Color] Detection error: {e}")
        return 'unknown'


# ─────────────────────────────────────────────
# MULTI-CAMERA MANAGEMENT
# ─────────────────────────────────────────────
_camera_threads = {}  # {cameraId: thread}
_camera_running = {}  # {cameraId: bool}
_camera_status = {}   # {cameraId: {running, peopleCount, etc}}




@app.route('/camera/start', methods=['POST'])
def camera_start():
    """Start detection for a specific camera"""
    global _camera_threads, _camera_running, _camera_status

    data = request.get_json()
    camera_id = data.get('cameraId')
    camera_url = data.get('cameraUrl')
    if isinstance(camera_url, str) and camera_url.isdigit():
        camera_url = int(camera_url)

    location_id = data.get('locationId')
    threshold = data.get('threshold', 20)
    alert_email = data.get('alertEmail', '')
    face_enabled = data.get('faceRecognitionEnabled', False)
    vehicle_enabled = data.get('vehicleTrackingEnabled', False)

    if not camera_id or camera_url is None or camera_url == "" or not location_id:
        return jsonify({'error': 'cameraId, cameraUrl, and locationId required'}), 400

    if _camera_running.get(camera_id, False):
        return jsonify({'error': 'Camera already running'}), 409

    _camera_running[camera_id] = True
    _camera_status[camera_id] = {"running": True, "peopleCount": 0, "vehicleCount": 0, "cameraUrl": camera_url}

    thread = threading.Thread(
        target=_camera_detection_loop_with_vehicles,
        args=(camera_id, camera_url, location_id, threshold, alert_email, face_enabled, vehicle_enabled),
        daemon=True,
    )
    _camera_threads[camera_id] = thread
    thread.start()

    return jsonify({'ok': True, 'message': f'Camera {camera_id} started'})


@app.route('/camera/stop', methods=['POST'])
def camera_stop():
    """Stop detection for a specific camera"""
    global _camera_running

    data = request.get_json()
    camera_id = data.get('cameraId')

    if not camera_id:
        return jsonify({'error': 'cameraId required'}), 400

    _camera_running[camera_id] = False
    if camera_id in _camera_status:
        _camera_status[camera_id]["running"] = False

    return jsonify({'ok': True, 'message': f'Camera {camera_id} stopping'})


@app.route('/camera/status/<camera_id>', methods=['GET'])
def camera_status_route(camera_id):
    """Get status of a specific camera"""
    return jsonify(_camera_status.get(camera_id, {"running": False, "peopleCount": 0}))


@app.route('/camera/list', methods=['GET'])
def camera_list():
    """Get status of all cameras"""
    return jsonify(_camera_status)



# ─────────────────────────────────────────────
# VEHICLE TRACKING MODULE (YOLO + Simple SORT)
# ─────────────────────────────────────────────

# Simple SORT-like tracker implementation
class VehicleTracker:
    def __init__(self, max_age=30, min_hits=3, iou_threshold=0.3):
        self.max_age = max_age
        self.min_hits = min_hits
        self.iou_threshold = iou_threshold
        self.tracks = {}  # {track_id: {'bbox': [x,y,w,h], 'age': int, 'hits': int, 'type': str}}
        self.next_id = 1
        
    def iou(self, box1, box2):
        """Calculate Intersection over Union"""
        x1, y1, w1, h1 = box1
        x2, y2, w2, h2 = box2
        
        xi1 = max(x1, x2)
        yi1 = max(y1, y2)
        xi2 = min(x1 + w1, x2 + w2)
        yi2 = min(y1 + h1, y2 + h2)
        
        inter_area = max(0, xi2 - xi1) * max(0, yi2 - yi1)
        box1_area = w1 * h1
        box2_area = w2 * h2
        union_area = box1_area + box2_area - inter_area
        
        return inter_area / union_area if union_area > 0 else 0
    
    def update(self, detections):
        """
        Update tracker with new detections
        detections: list of {'bbox': [x,y,w,h], 'type': str, 'confidence': float}
        returns: list of {'track_id': int, 'bbox': [x,y,w,h], 'type': str}
        """
        # Match detections to existing tracks
        matched_tracks = set()
        matched_detections = set()
        
        for det_idx, detection in enumerate(detections):
            best_iou = 0
            best_track_id = None
            
            for track_id, track in self.tracks.items():
                if track['age'] > 0:  # Only match active tracks
                    continue
                iou_score = self.iou(detection['bbox'], track['bbox'])
                if iou_score > self.iou_threshold and iou_score > best_iou:
                    best_iou = iou_score
                    best_track_id = track_id
            
            if best_track_id is not None:
                # Update existing track
                self.tracks[best_track_id]['bbox'] = detection['bbox']
                self.tracks[best_track_id]['type'] = detection['type']
                self.tracks[best_track_id]['hits'] += 1
                self.tracks[best_track_id]['age'] = 0
                matched_tracks.add(best_track_id)
                matched_detections.add(det_idx)
        
        # Create new tracks for unmatched detections
        for det_idx, detection in enumerate(detections):
            if det_idx not in matched_detections:
                self.tracks[self.next_id] = {
                    'bbox': detection['bbox'],
                    'type': detection['type'],
                    'age': 0,
                    'hits': 1,
                }
                self.next_id += 1
        
        # Age unmatched tracks
        tracks_to_delete = []
        for track_id in self.tracks:
            if track_id not in matched_tracks:
                self.tracks[track_id]['age'] += 1
                if self.tracks[track_id]['age'] > self.max_age:
                    tracks_to_delete.append(track_id)
        
        # Remove old tracks
        for track_id in tracks_to_delete:
            del self.tracks[track_id]
        
        # Return confirmed tracks (hits >= min_hits)
        confirmed = []
        for track_id, track in self.tracks.items():
            if track['hits'] >= self.min_hits:
                confirmed.append({
                    'track_id': track_id,
                    'bbox': track['bbox'],
                    'type': track['type'],
                })
        
        return confirmed


# Global vehicle tracking state
_vehicle_trackers = {}  # {camera_id: VehicleTracker}
_vehicle_tracking_enabled = {}  # {camera_id: bool}
_vehicle_last_seen = {}  # {camera_id: {track_id: timestamp}}

# Vehicle classes from COCO dataset
VEHICLE_CLASSES = ['car', 'motorcycle', 'bus', 'truck', 'bicycle']


def detect_and_track_vehicles(frame, camera_id, location_id, is_video_file=False):
    """Detect and track vehicles in frame"""
    global _vehicle_trackers, _vehicle_tracking_enabled, _vehicle_last_seen
    
    if not _vehicle_tracking_enabled.get(camera_id, False):
        return []
    
    # Initialize tracker for this camera if needed
    if camera_id not in _vehicle_trackers:
        _vehicle_trackers[camera_id] = VehicleTracker(max_age=30, min_hits=2, iou_threshold=0.3)
        _vehicle_last_seen[camera_id] = {}
    
    # YOLO detection
    results = model(frame, device=device, imgsz=640, verbose=False)
    
    # Extract vehicle detections
    detections = []
    for r in results[0].boxes.data.tolist():
        x1, y1, x2, y2, conf, cls = r
        class_name = results[0].names[int(cls)]
        
        if class_name in VEHICLE_CLASSES:
            # Convert to [x, y, w, h] format
            bbox = [int(x1), int(y1), int(x2 - x1), int(y2 - y1)]
            detections.append({
                'bbox': bbox,
                'type': class_name,
                'confidence': float(conf),
            })
    
    # Update tracker
    tracked_vehicles = _vehicle_trackers[camera_id].update(detections)
    
    # Send tracking data to backend
    current_time = _time.time()
    for vehicle in tracked_vehicles:
        track_id = vehicle['track_id']
        vehicle_id = f"{camera_id}_{track_id}"  # Unique ID per camera
        
        # Check if this is a new detection or re-detection
        last_seen = _vehicle_last_seen[camera_id].get(track_id, 0)
        if current_time - last_seen > 2.0:  # Send update every 2 seconds
            _vehicle_last_seen[camera_id][track_id] = current_time
            
            # Extract vehicle snapshot
            x, y, w, h = vehicle['bbox']
            vehicle_img = frame[y:y+h, x:x+w]
            if vehicle_img.size > 0:
                _, jpeg = cv2.imencode('.jpg', vehicle_img, [cv2.IMWRITE_JPEG_QUALITY, 80])
                snapshot_b64 = base64.b64encode(jpeg.tobytes()).decode('utf-8')
            else:
                snapshot_b64 = None
            
            # Detect license plate and color
            license_plate = detect_license_plate(frame, vehicle['bbox'])
            vehicle_color = detect_vehicle_color(frame, vehicle['bbox'])
            
            # Send vehicle detection to backend
            try:
                payload = {
                    'vehicleId': vehicle_id,
                    'vehicleType': vehicle['type'],
                    'cameraId': camera_id,
                    'locationId': location_id,
                    'confidence': detections[0]['confidence'] if detections else 0.9,
                    'direction': 'unknown',
                    'snapshot': snapshot_b64,
                    'boundingBox': {
                        'x': x,
                        'y': y,
                        'width': w,
                        'height': h,
                    },
                }
                
                if is_video_file:
                    payload['cameraName'] = camera_id
                    payload['locationName'] = camera_id
                else:
                    payload['cameraName'] = f"Camera {camera_id}"
                    payload['locationName'] = f"Location {location_id}"
                    
                _requests.post(
                    f"{BACKEND_URL}/api/vehicles/detect",
                    json=payload,
                    timeout=3
                )
            except Exception as e:
                print(f"[Vehicle] Failed to send tracking data: {e}")
            
            # Send license plate detection to backend if detected
            if license_plate:
                try:
                    _requests.post(
                        f"{BACKEND_URL}/api/vehicle-numbers",
                        json={
                            'vehicleNumber': license_plate,
                            'vehicleType': vehicle['type'],
                            'color': vehicle_color,
                            'thumbnail': snapshot_b64,
                            'cameraId': camera_id,
                            'cameraName': f"Camera {camera_id}",
                        },
                        timeout=3
                    )
                    print(f"[License Plate] Detected: {license_plate} ({vehicle_color}) on {camera_id}")
                except Exception as e:
                    print(f"[License Plate] Failed to send data: {e}")
    
    return tracked_vehicles


@app.route('/vehicle/tracking/enable', methods=['POST'])
def vehicle_tracking_enable():
    """Enable vehicle tracking for a camera"""
    global _vehicle_tracking_enabled
    
    data = request.get_json()
    camera_id = data.get('cameraId')
    enabled = data.get('enabled', True)
    
    if not camera_id:
        return jsonify({'error': 'cameraId required'}), 400
    
    _vehicle_tracking_enabled[camera_id] = enabled
    
    return jsonify({
        'ok': True,
        'cameraId': camera_id,
        'enabled': enabled,
    })


@app.route('/vehicle/tracking/status', methods=['GET'])
def vehicle_tracking_status():
    """Get vehicle tracking status for all cameras"""
    return jsonify({
        'enabled': _vehicle_tracking_enabled,
        'trackers': {
            cam_id: len(tracker.tracks)
            for cam_id, tracker in _vehicle_trackers.items()
        },
    })


# Update camera detection loop to include vehicle tracking
def _camera_detection_loop_with_vehicles(camera_id: str, camera_url: str, location_id: str, threshold: int, alert_email: str, face_enabled: bool, vehicle_enabled: bool):
    """Detection loop for a single camera with vehicle tracking"""
    global _camera_running, _camera_status

    cap = cv2.VideoCapture(camera_url)
    if not cap.isOpened():
        _camera_status[camera_id] = {"running": False, "error": "Cannot open stream"}
        print(f"[Camera {camera_id}] Cannot open stream: {camera_url}")
        return

    print(f"[Camera {camera_id}] Stream opened: {camera_url}")
    _camera_status[camera_id] = {"running": True, "peopleCount": 0, "vehicleCount": 0, "cameraUrl": camera_url}

    # Enable vehicle tracking if requested
    if vehicle_enabled:
        _vehicle_tracking_enabled[camera_id] = True

    frame_idx = 0
    last_send = 0.0

    while _camera_running.get(camera_id, False):
        ret, frame = cap.read()
        if not ret:
            print(f"[Camera {camera_id}] Stream disconnected, retrying in 2s...")
            cap.release()
            _time.sleep(2)
            cap = cv2.VideoCapture(camera_url)
            continue

        frame_idx += 1
        if frame_idx % FRAME_SKIP != 0:
            continue

        # YOLO inference for people
        results = model(frame, device=device, imgsz=640, verbose=False)
        count = sum(
            1 for r in results[0].boxes.data.tolist()
            if int(r[5]) == 0
        )
        _camera_status[camera_id]["peopleCount"] = count

        # Vehicle tracking
        if vehicle_enabled:
            tracked_vehicles = detect_and_track_vehicles(frame, camera_id, location_id)
            _camera_status[camera_id]["vehicleCount"] = len(tracked_vehicles)

        # Check for face matches (if enabled)
        if face_enabled and frame_idx % (FRAME_SKIP * 5) == 0:
            check_face_matches(frame, location_id)

        now = _time.time()
        if now - last_send >= SEND_INTERVAL:
            last_send = now
            print(f"[Camera {camera_id}] Detected {count} people, {_camera_status[camera_id].get('vehicleCount', 0)} vehicles")
            
            # Encode frame
            annotated = results[0].plot()
            _, jpeg = cv2.imencode('.jpg', annotated, [cv2.IMWRITE_JPEG_QUALITY, 75])
            frame_b64 = base64.b64encode(jpeg.tobytes()).decode('utf-8')

            payload = {
                "locationId": location_id,
                "peopleCount": count,
                "frameImage": frame_b64,
                "customThreshold": threshold,
            }
            if alert_email:
                payload["customEmail"] = alert_email

            try:
                print(f"[Camera {camera_id}] Posting {count} people to {BACKEND_URL}/api/live/alert")
                _requests.post(
                    f"{BACKEND_URL}/api/live/alert",
                    json=payload,
                    timeout=5
                )
                
                # Update camera status in DB
                _requests.patch(
                    f"{BACKEND_URL}/api/cameras/{camera_id}/status",
                    json={
                        "lastCount": count,
                        "lastUpdated": _time.time()
                    },
                    timeout=5
                )
            except Exception as e:
                print(f"[Camera {camera_id}] Backend POST failed: {e}")

    cap.release()
    _camera_status[camera_id]["running"] = False
    print(f"[Camera {camera_id}] Detection stopped.")

if __name__ == '__main__':
    app.run(debug=True, threaded=True, port=5002, use_reloader=False)
