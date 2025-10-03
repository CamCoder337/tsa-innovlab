#!/bin/sh

# Docker entrypoint script for runtime environment variable injection
# This script creates a JavaScript file with environment variables that can be accessed at runtime

set -e

echo "🚀 Starting TSA Frontend..."
echo "📝 Injecting runtime environment variables..."

# Create env-config.js file that will be loaded by index.html
cat <<EOF > /usr/share/nginx/html/env-config.js
window._env_ = {
  VITE_API_URL: "${VITE_API_URL:-http://localhost:3333}"
};
EOF

echo "✅ Environment configuration injected:"
echo "   VITE_API_URL = ${VITE_API_URL:-http://localhost:3333}"
echo ""
echo "🌐 Starting nginx..."

# Start nginx in foreground
exec nginx -g "daemon off;"
