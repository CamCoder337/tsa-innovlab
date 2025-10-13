#!/bin/sh

# Docker entrypoint script for runtime environment variable injection
# This script creates a JavaScript file with environment variables that can be accessed at runtime

set -e

echo "🚀 Starting TSA Frontend..."
echo "📝 Injecting runtime environment variables..."

# Create env-config.js file that will be loaded by index.html
cat <<EOF > /usr/share/nginx/html/env-config.js
window._env_ = {
  VITE_API_URL: "${VITE_API_URL:-http://localhost:3333}",
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL:-}",
  VITE_SUPABASE_ANON_KEY: "${VITE_SUPABASE_ANON_KEY:-}",
  VITE_GOOGLE_MAPS_API_KEY: "${VITE_GOOGLE_MAPS_API_KEY:-}"
};
EOF

echo "✅ Environment configuration injected:"
echo "   VITE_API_URL = ${VITE_API_URL:-http://localhost:3333}"
echo "   VITE_SUPABASE_URL = ${VITE_SUPABASE_URL:-(not set)}"
echo "   VITE_SUPABASE_ANON_KEY = ${VITE_SUPABASE_ANON_KEY:-(not set)}"
echo "   VITE_GOOGLE_MAPS_API_KEY = ${VITE_GOOGLE_MAPS_API_KEY:-(not set)}"
echo ""
echo "🌐 Starting nginx..."

# Start nginx in foreground
exec nginx -g "daemon off;"
