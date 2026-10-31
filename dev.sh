#!/usr/bin/env bash
# Chạy backend + frontend song song (dev).
# Usage: ./dev.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

PIDS=()

cleanup() {
  echo ""
  echo "Stopping..."
  for pid in "${PIDS[@]:-}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
    fi
  done
  exit 0
}

trap cleanup INT TERM

if [[ ! -d "$BACKEND" || ! -d "$FRONTEND" ]]; then
  echo "Không tìm thấy backend/frontend tại $ROOT"
  exit 1
fi

if [[ ! -d "$BACKEND/node_modules" ]]; then
  echo "→ npm install (backend)..."
  (cd "$BACKEND" && npm install)
fi

if [[ ! -d "$FRONTEND/node_modules" ]]; then
  echo "→ npm install (frontend)..."
  (cd "$FRONTEND" && npm install)
fi

if command -v docker >/dev/null 2>&1 && [[ -f "$ROOT/docker-compose.yml" ]]; then
  echo "→ MongoDB (docker compose)..."
  (cd "$ROOT" && docker compose up -d)
fi

echo "→ Backend  http://localhost:4000  ($BACKEND)"
(cd "$BACKEND" && npm run start:dev) &
PIDS+=($!)

echo "→ Frontend http://localhost:3000  ($FRONTEND)"
(cd "$FRONTEND" && npm run dev) &
PIDS+=($!)

echo ""
echo "Dev đang chạy. Ctrl+C để dừng cả hai."
wait
