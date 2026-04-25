@echo off
REM Installation script for Crowd Alert System on Windows

echo.
echo ========================================
echo Crowd Alert System - Installation
echo ========================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.14.3
    pause
    exit /b 1
)

echo [1/5] Installing PyTorch...
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
if errorlevel 1 (
    echo ERROR: Failed to install PyTorch
    pause
    exit /b 1
)

echo.
echo [2/5] Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [3/5] Installing Backend dependencies...
cd crowd-alert-system\backend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    cd ..\..
    pause
    exit /b 1
)
cd ..\..

echo.
echo [4/5] Installing Frontend dependencies...
cd crowd-alert-system\frontend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    cd ..\..
    pause
    exit /b 1
)
cd ..\..

echo.
echo [5/5] Verifying installation...
python -c "import paddleocr; import torch; import cv2; print('✅ All dependencies installed successfully!')"
if errorlevel 1 (
    echo WARNING: Some dependencies may not be installed correctly
    echo Please check the error messages above
)

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Open 3 terminals
echo 2. Terminal 1: python people.py
echo 3. Terminal 2: cd crowd-alert-system\backend ^& npm start
echo 4. Terminal 3: cd crowd-alert-system\frontend ^& npm run dev
echo 5. Open browser: http://localhost:5173
echo.
pause
