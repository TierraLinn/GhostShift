#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo ""
echo "Starting GhostShift..."
echo "App:       http://localhost:8787"
echo "Signup:    http://localhost:8787/signup.html"
echo "Dashboard: http://localhost:8787/dashboard.html"
echo "Demo:      http://localhost:8787/demo-player.html"
echo ""
echo "Keep this terminal open while using the app."
echo ""

exec node ./backend/server.mjs
