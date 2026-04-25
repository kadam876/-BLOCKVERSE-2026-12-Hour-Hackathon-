#!/bin/bash

# Installation script for Crowd Alert System on Linux/Mac

echo ""
echo "========================================"
echo "Crowd Alert System - Installation"
echo "========================================"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 not found. Please install Python 3.14.3"
    exit 1
fi

python3 --version

echo ""
echo "[1/5] Installing PyTorch..."
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install PyTorch"
    exit 1
fi

echo ""
echo "[2/5] Installing Python dependencies..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

echo ""
echo "[3/5] Installing Backend dependencies..."
cd crowd-alert-system/backend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install backend dependencies"
    cd ../..
    exit 1
fi
cd ../..

echo ""
echo "[4/5] Installing Frontend dependencies..."
cd crowd-alert-system/frontend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install frontend dependencies"
    cd ../..
    exit 1
fi
cd ../..

echo ""
echo "[5/5] Verifying installation..."
python3 -c "import paddleocr; import torch; import cv2; print('✅ All dependencies installed successfully!')"
if [ $? -ne 0 ]; then
    echo "WARNING: Some dependencies may not be installed correctly"
    echo "Please check the error messages above"
fi

echo ""
echo "========================================"
echo "Installation Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Open 3 terminals"
echo "2. Terminal 1: python people.py"
echo "3. Terminal 2: cd crowd-alert-system/backend && npm start"
echo "4. Terminal 3: cd crowd-alert-system/frontend && npm run dev"
echo "5. Open browser: http://localhost:5173"
echo ""
