#!/bin/bash
# Deploy TripPlanner to staging (PM2)
#
# Usage: ./infra/scripts/deploy-staging.sh
#
# This script:
#   1. Verifies prerequisites (pm2, Node.js, PostgreSQL, TLS certs)
#   2. Installs dependencies
#   3. Builds the frontend
#   4. Stops any existing staging PM2 processes
#   5. Starts backend + frontend via PM2 with the staging config
#   6. Runs smoke tests to verify the deployment
#
# Staging ports (HTTPS, self-signed certs):
#   Backend:  https://localhost:3001
#   Frontend: https://localhost:4173
#
# Prerequisites:
#   - pm2 installed globally: npm install -g pm2
#   - TLS certs generated: ./infra/scripts/generate-certs.sh
#   - PostgreSQL running with migrations applied
#   - Backend .env configured (DATABASE_URL, JWT_SECRET, etc.)
#
# NOTE: Database migrations are NOT run automatically by this script. Run
#   `cd backend && NODE_ENV=staging npm run migrate` manually ONLY when
#   technical-context.md lists a pending migration for the sprint. Sprint 42
#   is frontend-only — no migration required (schema stable at 001-010).

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ECOSYSTEM_CONFIG="$PROJECT_ROOT/infra/ecosystem.config.cjs"
BACKEND_URL="https://localhost:3001"
FRONTEND_URL="https://localhost:4173"

echo "============================================"
echo "  TripPlanner Staging Deploy"
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

# Verify TLS certs exist (staging serves HTTPS)
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
mkdir -p "$PROJECT_ROOT/backend/logs" "$PROJECT_ROOT/frontend/logs"

echo "  Prerequisites OK"
echo ""

# ---- Step 2: Install dependencies ----
echo "[2/6] Installing dependencies..."
cd "$PROJECT_ROOT/backend" && npm install --ignore-scripts 2>&1 | tail -1
cd "$PROJECT_ROOT/frontend" && npm install 2>&1 | tail -1
echo "  Dependencies installed"
echo ""

# ---- Step 3: Build frontend ----
echo "[3/6] Building frontend..."
cd "$PROJECT_ROOT/frontend" && npm run build 2>&1 | tail -3
echo "  Frontend built"
echo ""

# ---- Step 4: Stop existing staging processes ----
echo "[4/6] Stopping existing staging processes..."
pm2 delete triplanner-backend 2>/dev/null || true
pm2 delete triplanner-frontend 2>/dev/null || true
echo "  Existing processes stopped"
echo ""

# ---- Step 5: Start staging via PM2 ----
echo "[5/6] Starting staging services..."
cd "$PROJECT_ROOT"
pm2 start "$ECOSYSTEM_CONFIG"
pm2 save

echo ""
echo "  Waiting for services to start..."
sleep 5

# Show status
pm2 list | grep -E "triplanner-backend|triplanner-frontend" || true

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

# Frontend loads (HTTPS)
FRONTEND_RESPONSE=$(curl -sk "$FRONTEND_URL/" 2>/dev/null | head -1 || echo "FAILED")
if echo "$FRONTEND_RESPONSE" | grep -qi "doctype\|html"; then
  echo "  [PASS] Frontend serves HTML over HTTPS"
  SMOKE_PASS=$((SMOKE_PASS + 1))
else
  echo "  [FAIL] Frontend response: $FRONTEND_RESPONSE"
  SMOKE_FAIL=$((SMOKE_FAIL + 1))
fi

# Auth endpoint responds (401 for invalid creds)
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
  echo "  pm2 logs triplanner-backend --lines 50"
  exit 1
fi

echo ""
echo "Staging deployment successful!"
echo ""
echo "  Backend:  $BACKEND_URL"
echo "  Frontend: $FRONTEND_URL"
echo "  Health:   $BACKEND_URL/api/v1/health"
echo ""
echo "Useful commands:"
echo "  pm2 status                          — View process status"
echo "  pm2 logs triplanner-backend         — View backend logs"
echo "  pm2 logs triplanner-frontend        — View frontend logs"
echo "  pm2 restart triplanner-backend      — Restart backend"
echo "  pm2 monit                           — Dashboard with CPU/memory"
