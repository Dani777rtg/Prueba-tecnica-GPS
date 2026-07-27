#!/usr/bin/env bash
# Smoke checks against a running API (local or Render).
# Usage: ./scripts/smoke.sh http://localhost:3001

set -euo pipefail
BASE="${1:-http://localhost:3001}"

echo "Health..."
curl -sf "$BASE/health" | head -c 200
echo

echo "POST valid GPS..."
curl -sf -X POST "$BASE/gps" \
  -H "Content-Type: application/json" \
  -d '{"vehicle_id":"VH-SMOKE","lat":4.711,"lng":-74.0721,"timestamp":"2025-06-01T10:00:00Z"}' \
  | head -c 300
echo

echo "GET vehicles..."
curl -sf "$BASE/vehicles" | head -c 400
echo

echo "GET missing vehicle..."
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/vehicles/NO-EXISTE")
echo "status=$code (expect 404)"

echo "Smoke OK"
