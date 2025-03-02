@echo off
title Starting Services...
echo Starting MongoDB...

REM Load environment variables from config.txt
for /f "tokens=1,* delims==" %%A in (config.txt) do (
    set %%A=%%B
)

REM Start MongoDB Server in the background
start /b "" "%MONGODB_DIR%\mongod.exe" --dbpath "%DB_PATH%"

REM Wait for MongoDB to initialize
timeout /t 5 >nul

REM Start XAMPP Apache silently
echo Starting Apache (XAMPP)...
start /b "" "%XAMPP_PATH%\apache\bin\httpd.exe"

REM Wait for Apache to initialize
timeout /t 5 >nul

REM Start Node.js Server in the same command window
echo Starting Node.js Server...
cd /d "%NODE_SERVER_PATH%"
node server.js

echo.
echo ✅ All services started successfully!
echo (Press Ctrl+C to stop the server)
echo.
pause >nul
