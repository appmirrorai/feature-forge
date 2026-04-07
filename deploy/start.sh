#!/usr/bin/env bash
# Feature Forge — production start script for Mac Mini
# Builds the frontend and starts the server.
# Add this as a Login Item or run via launchd.
#
# Usage: bash deploy/start.sh

set -e
cd "$(dirname "$0")/.."

echo "Building frontend..."
npm run build

echo "Starting server on port ${PORT:-3000}..."
exec node server.js
