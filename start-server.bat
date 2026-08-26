@echo off
echo ---------------------------------------------------
echo  📋 Digital Notice Board - Server Starter
echo ---------------------------------------------------
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install it from: https://nodejs.org/
    echo.
    pause
    exit /b
)

:: Check for node_modules
if not exist "node_modules\" (
    echo [INFO] Installing dependencies...
    call npm install
)

echo [SUCCESS] Starting server...
echo.
call npm start

pause
