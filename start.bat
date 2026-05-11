@echo off
title AgriManager - Starting...
echo.
echo  ====================================
echo   AgriManager - Farm Management System
echo  ====================================
echo.

echo  [1/3] Starting Backend API (Port 5000)...
start "AgriManager Backend" cmd /k "cd /d %~dp0backend && npm start"
timeout /t 2 /nobreak >nul

echo  [2/3] Starting ML Service (Port 5001)...
where python >nul 2>&1
if %ERRORLEVEL% == 0 (
    start "AgriManager ML Service" cmd /k "cd /d %~dp0ml && pip install -r requirements.txt -q && python app.py"
) else (
    where python3 >nul 2>&1
    if %ERRORLEVEL% == 0 (
        start "AgriManager ML Service" cmd /k "cd /d %~dp0ml && pip3 install -r requirements.txt -q && python3 app.py"
    ) else (
        echo  [!] Python not found - ML Service will not start.
        echo      Predictions will run in simulation mode.
    )
)
timeout /t 2 /nobreak >nul

echo  [3/3] Starting Frontend (Port 5173)...
start "AgriManager Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 4 /nobreak >nul

echo.
echo  Opening browser...
start http://localhost:5173
echo.
echo  ====================================
echo   Services Running:
echo   Backend API:  http://localhost:5000
echo   ML Service:   http://localhost:5001
echo   Frontend:     http://localhost:5173
echo  ====================================
echo.
echo  API Keys needed (edit .env files):
echo   backend\.env  - OPENWEATHER_API_KEY
echo   frontend\.env - VITE_GOOGLE_MAPS_API_KEY
echo.
echo  Install ML dependencies (first run only):
echo   cd ml ^&^& pip install -r requirements.txt
echo.
pause
