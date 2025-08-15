@echo off
title Neff Paving Server Startup
color 0E

echo.
echo ======================================
echo    NEFF PAVING SERVER STARTUP
echo ======================================
echo.

cd /d "%~dp0"

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
echo Checking dependencies...
if not exist "node_modules\" (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo Dependencies already installed
)

echo.
echo Starting Neff Paving Server...
echo Server will run on http://localhost:3001
echo Press Ctrl+C to stop the server
echo.

node server.js

if errorlevel 1 (
    echo.
    echo ERROR: Server failed to start
    pause
)

echo.
echo Server stopped
pause