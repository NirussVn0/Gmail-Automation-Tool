#!/bin/bash

# Simple script to kill processes on specific ports

echo "🔧 Killing processes on ports 3001 and 8001..."

# Kill processes on port 3001
echo "Checking port 3001..."
PIDS_3001=$(lsof -ti :3001 2>/dev/null || true)
if [[ -n "$PIDS_3001" ]]; then
    echo "Killing processes on port 3001: $PIDS_3001"
    echo "$PIDS_3001" | xargs kill -9 2>/dev/null || true
    sleep 1
    echo "✅ Port 3001 cleared"
else
    echo "✅ Port 3001 is already free"
fi

# Kill processes on port 8001
echo "Checking port 8001..."
PIDS_8001=$(lsof -ti :8001 2>/dev/null || true)
if [[ -n "$PIDS_8001" ]]; then
    echo "Killing processes on port 8001: $PIDS_8001"
    echo "$PIDS_8001" | xargs kill -9 2>/dev/null || true
    sleep 1
    echo "✅ Port 8001 cleared"
else
    echo "✅ Port 8001 is already free"
fi

# Kill any node/uvicorn processes that might be hanging
echo "Killing any hanging node/uvicorn processes..."
pkill -f "node.*3001" 2>/dev/null || true
pkill -f "next.*dev" 2>/dev/null || true
pkill -f "uvicorn.*8001" 2>/dev/null || true
pkill -f "uvicorn.*backend.main:app" 2>/dev/null || true

echo "🎉 Port cleanup complete!"

# Verify ports are free
echo "Verifying ports are free..."
if lsof -i :3001 >/dev/null 2>&1; then
    echo "❌ Port 3001 still in use"
else
    echo "✅ Port 3001 is free"
fi

if lsof -i :8001 >/dev/null 2>&1; then
    echo "❌ Port 8001 still in use"
else
    echo "✅ Port 8001 is free"
fi

echo "Ready to run ./run_all.sh"
