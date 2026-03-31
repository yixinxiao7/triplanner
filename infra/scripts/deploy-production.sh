#!/bin/bash
# Deploy TripPlanner to production (PM2)
#
# Usage: ./infra/scripts/deploy-production.sh
#
# This script:
#   1. Verifies prerequisites (pm2, Node.js, PostgreSQL, TLS certs)
#   2. Installs dependencies
#   3. Builds the frontend
#   4. Stops any existing production PM2 processes
#   5. Starts backend + frontend via PM2 with production config
#   6. Runs smoke tests to verify the deployment
#
# Production ports:
#   Backend:  https://localhost:3002
#   Frontend: https://localhost:4174
#
# Prerequisites:
#   - pm2 installed globally: npm install -g pm2
#   - TLS certs generated: ./infra/scripts/generate-certs.sh
#   - PostgreSQL running with migrations applied
#   - Backend .env configured (DATABASE_URL, JWT_SECRET, etc.)

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ECOSYSTEM_CONFIG="$PROJECT_ROOT/infra/ecosystem.production.config.cjs"
BACKEND_URL="https://localhost:3002"
FRONTEND_URL="https://localhost:4174"

echo "============================================"
echo "  TripPlanner Production Deploy"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"
echo ""

# ---- Step 1: Verify prerequisites ----
echo "[1/6] Verifying prerequisites..."

if ! command -v pm2 &> /dev/null; then
  echo "ERROR: pm2 is not installed. Run: npm install -g pm2"
  exit 1
fi

if ! command -v node &> /dev/null; then
  echo "ERROR: Node.js is not installed."
  exit 1
fi

echo "  pm2 version: $(pm2 --version)"
echo "  Node.js version: $(node --version)"

# Verify TLS certs exist
if [ ! -f "$PROJECT_ROOT/infra/certs/localhost-key.pem" ] || [ ! -f "$PROJECT_ROOT/infra/certs/localhost.pem" ]; then
  echo "WARNING: TLS certs not found. Generating..."
  "$PROJECT_ROOT/infra/scripts/generate-certs.sh"
fi

# Verify backend .env exists
if [ ! -f "$PROJECT_ROOT/backend/.env" ]; then
  echo "ERROR: backend/.env not found. Copy backend/.env.example and configure."
  exit 1
fi

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

echo "  Prerequisites OK"
echo ""

# ---- Step 2: Install dependencies ----
echo "[2/6] Installing dependencies..."
cd "$PROJECT_ROOT/backend" && npm install --omit=dev --ignore-scripts 2>&1 | tail -1
cd "$PROJECT_ROOT/frontend" && npm install 2>&1 | tail -1
echo "  Dependencies installed"
echo ""

# ---- Step 3: Build frontend ----
echo "[3/6] Building frontend..."
cd "$PROJECT_ROOT/frontend" && npm run build 2>&1 | tail -3
echo "  Frontend built"
echo ""

# ---- Step 4: Stop existing production processes ----
echo "[4/6] Stopping existing production processes..."
pm2 delete triplanner-prod-backend 2>/dev/null || true
pm2 delete triplanner-prod-frontend 2>/dev/null || true
echo "  Existing processes stopped"
echo ""

# ---- Step 5: Start production via PM2 ----
echo "[5/6] Starting production services..."
cd "$PROJECT_ROOT"
pm2 start "$ECOSYSTEM_CONFIG"
pm2 save

echo ""
echo "  Waiting for services to start..."
sleep 5

# Show status
pm2 list | grep triplanner-prod

echo ""

# ---- Step 6: Smoke tests ----
echo "[6/6] Running smoke tests..."
SMOKE_PASS=0
SMOKE_FAIL=0

# Health check
HEALTH_RESPONSE=$(curl -sk "$BACKEND_URL/api/v1/health" 2>/dev/null || echo "FAILED")
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
  echo "  [PASS] Health endpoint: $HEALTH_RESPONSE"
  SMOKE_PASS=$((SMOKE_PASS + 1))
else
  echo "  [FAIL] Health endpoint: $HEALTH_RESPONSE"
  SMOKE_FAIL=$((SMOKE_FAIL + 1))
fi

# Frontend loads
FRONTEND_RESPONSE=$(curl -sk "$FRONTEND_URL/" 2>/dev/null | head -1 || echo "FAILED")
if echo "$FRONTEND_RESPONSE" | grep -qi "doctype\|html"; then
  echo "  [PASS] Frontend serves HTML"
  SMOKE_PASS=$((SMOKE_PASS + 1))
else
  echo "  [FAIL] Frontend response: $FRONTEND_RESPONSE"
  SMOKE_FAIL=$((SMOKE_FAIL + 1))
fi

# Auth endpoint responds
AUTH_RESPONSE=$(curl -sk -o /dev/null -w "%{http_code}" -X POST "$BACKEND_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid@test.com","password":"wrong"}' 2>/dev/null || echo "000")
if [ "$AUTH_RESPONSE" = "401" ]; then
  echo "  [PASS] Auth endpoint responds (401 for invalid creds)"
  SMOKE_PASS=$((SMOKE_PASS + 1))
else
  echo "  [FAIL] Auth endpoint returned: $AUTH_RESPONSE"
  SMOKE_FAIL=$((SMOKE_FAIL + 1))
fi

# Trips endpoint requires auth
TRIPS_RESPONSE=$(curl -sk -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/v1/trips" 2>/dev/null || echo "000")
if [ "$TRIPS_RESPONSE" = "401" ]; then
  echo "  [PASS] Trips endpoint requires auth (401)"
  SMOKE_PASS=$((SMOKE_PASS + 1))
else
  echo "  [FAIL] Trips endpoint returned: $TRIPS_RESPONSE"
  SMOKE_FAIL=$((SMOKE_FAIL + 1))
fi

echo ""
echo "============================================"
echo "  Smoke Tests: $SMOKE_PASS passed, $SMOKE_FAIL failed"
echo "============================================"

if [ "$SMOKE_FAIL" -gt 0 ]; then
  echo ""
  echo "WARNING: Some smoke tests failed. Check logs:"
  echo "  pm2 logs triplanner-prod-backend --lines 50"
  exit 1
fi

echo ""
echo "Production deployment successful!"
echo ""
echo "  Backend:  $BACKEND_URL"
echo "  Frontend: $FRONTEND_URL"
echo "  Health:   $BACKEND_URL/api/v1/health"
echo ""
echo "Useful commands:"
echo "  pm2 status                            — View process status"
echo "  pm2 logs triplanner-prod-backend      — View backend logs"
echo "  pm2 logs triplanner-prod-frontend     — View frontend logs"
echo "  pm2 restart triplanner-prod-backend   — Restart backend"
echo "  pm2 monit                             — Dashboard with CPU/memory"
