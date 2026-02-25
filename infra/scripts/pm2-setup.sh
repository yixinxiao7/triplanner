#!/bin/bash
# Set up pm2 for TripPlanner staging backend
#
# Usage: ./infra/scripts/pm2-setup.sh
#
# Prerequisites: pm2 must be installed globally (npm install -g pm2)

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ECOSYSTEM_CONFIG="$PROJECT_ROOT/infra/ecosystem.config.cjs"

echo "=== TripPlanner pm2 Setup ==="
echo ""

# Verify pm2 is installed
if ! command -v pm2 &> /dev/null; then
  echo "ERROR: pm2 is not installed. Run: npm install -g pm2"
  exit 1
fi

echo "pm2 version: $(pm2 --version)"

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"
echo "Created logs directory: $PROJECT_ROOT/logs"

# Install pm2 log rotation module
echo ""
echo "Installing pm2-logrotate module..."
pm2 install pm2-logrotate 2>/dev/null || echo "pm2-logrotate may already be installed"

# Configure log rotation: 10MB max size, 7 files retained, compress old logs
pm2 set pm2-logrotate:max_size 10M 2>/dev/null || true
pm2 set pm2-logrotate:retain 7 2>/dev/null || true
pm2 set pm2-logrotate:compress true 2>/dev/null || true
pm2 set pm2-logrotate:rotateInterval '0 0 * * *' 2>/dev/null || true
echo "Log rotation configured: 10MB max, 7 files retained, daily rotation"

# Stop any existing triplanner processes
pm2 delete triplanner-backend 2>/dev/null || true

# Start the backend with the ecosystem config
echo ""
echo "Starting backend via pm2..."
cd "$PROJECT_ROOT"
pm2 start "$ECOSYSTEM_CONFIG"

# Save the pm2 process list (for auto-restart on reboot)
pm2 save

echo ""
echo "=== pm2 Setup Complete ==="
echo ""
echo "Useful commands:"
echo "  pm2 status                      — View process status"
echo "  pm2 logs triplanner-backend     — View live logs"
echo "  pm2 restart triplanner-backend  — Restart the backend"
echo "  pm2 stop triplanner-backend     — Stop the backend"
echo "  pm2 monit                       — Dashboard with CPU/memory"
echo ""
echo "To auto-start pm2 on system boot:"
echo "  pm2 startup"
echo "  (follow the instructions it prints)"
