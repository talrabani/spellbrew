@echo off
echo Starting Spellbrew for local network access...
echo.
echo Your IP Address: 192.168.1.121
echo.
echo Frontend will be available at: http://192.168.1.121:5173
echo Backend will be available at: http://192.168.1.121:5000
echo.
echo Starting servers...

REM Start the backend server
start "Spellbrew Backend" cmd /k "cd server && npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak > nul

REM Start the frontend server
start "Spellbrew Frontend" cmd /k "cd client && npm run dev"

echo.
echo Both servers are starting...
echo You can now access the app from other devices on your network at:
echo http://192.168.1.121:5173
echo.
pause
