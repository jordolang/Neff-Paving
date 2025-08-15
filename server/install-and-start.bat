@echo off
title Neff Paving Server Installation
color 0E

echo.
echo ========================================
echo    NEFF PAVING SERVER INSTALLATION
echo ========================================
echo.

cd /d "%~dp0"

echo Checking administrative privileges...
net session >nul 2>&1
if errorlevel 1 (
    echo ERROR: This script requires administrative privileges
    echo Please right-click and select "Run as Administrator"
    pause
    exit /b 1
)

echo Administrative privileges confirmed ✅
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js found: 
node --version
echo.

echo Installing Node.js dependencies...
npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo Dependencies installed ✅
echo.

echo Installing Windows Service...
node install-service.js
if errorlevel 1 (
    echo ERROR: Failed to install Windows service
    echo Make sure you are running as Administrator
    pause
    exit /b 1
)

echo.
echo Installing Life-Support System...
powershell -ExecutionPolicy Bypass -File "launcher-script.ps1" -Install
if errorlevel 1 (
    echo WARNING: Life-support installation may have failed
    echo Server will still work, but automatic restart may not function
)

echo.
echo ========================================
echo    INSTALLATION COMPLETE ✅
echo ========================================
echo.
echo • Windows Service: Installed and Started
echo • Life-Support: Hourly restart monitoring enabled  
echo • Server URL: http://localhost:3001
echo • CSV File: estimate-form-data-requests.csv
echo • Screenshots: screenshots\ folder
echo.
echo The server is now running and will automatically:
echo • Start on system boot
echo • Restart if it crashes
echo • Monitor for estimate submissions
echo • Show loud alerts with popups
echo • Save all data to CSV files
echo.
echo To manage the server:
echo • Windows Services: "Neff Paving Estimate Server"
echo • Control Panel: npm run start-gui
echo • Manual Start: start-server.bat
echo • Uninstall: npm run uninstall-service
echo.
echo ========================================

pause