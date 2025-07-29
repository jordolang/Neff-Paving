#!/bin/bash

# Neff Paving Application Startup Script

echo "🚀 Starting Neff Paving Application..."

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "node backend/server-simple.js" || true
pkill -f "npm run dev" || true

# Start backend server
echo "🖥️  Starting backend server..."
cd /app
nohup node backend/server-simple.js > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait for backend to start
sleep 3

# Check if backend is running
if curl -s http://localhost:8001/api/health > /dev/null; then
    echo "✅ Backend is running successfully"
else
    echo "❌ Backend failed to start"
    exit 1
fi

# Start frontend dev server (if needed for development)
echo "🎨 Starting frontend development server..."
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend dev server started with PID: $FRONTEND_PID"

echo "🎉 Application started successfully!"
echo ""
echo "🌐 Access URLs:"
echo "   Main Website: http://localhost:8001"
echo "   API Health:   http://localhost:8001/api/health"
echo ""
echo ""
echo "🔑 Google Maps API Keys available:"
echo "   - AIzaSyAmDOZqIBCkAZuQhpsfU7kaFDE3TRcDr4k"
echo "   - AIzaSyDwtECO1lWeBHEBR7oAXNw5G3OYar68ySk"
echo "   - AIzaSyB6igIPyhIPudzvwD6LbmgrCkxuEXvbjJE"
echo ""
echo "📝 Log files:"
echo "   Backend: /app/backend.log"
echo "   Frontend: /app/frontend.log"
echo ""
echo "Press Ctrl+C to stop all services"

# Keep script running
wait