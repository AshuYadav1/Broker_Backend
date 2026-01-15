#!/bin/bash

# deploy.sh
# Run this script LOCALLY to push code to the VPS.
# Usage: ./deploy.sh
set -e # 1. Stop script on any error

VPS_USER="root" # CHANGE THIS
VPS_IP="194.238.16.22" # Updated with your IP
APP_DIR="/var/www/video-server"

echo "🚀 Deploying to $VPS_IP..."

# 1. Build TypeScript
echo "🔨 Building TypeScript..."
npm exec prisma generate
npm run build

# 2. Sync Files
# Note: creating directory just in case
ssh "$VPS_USER@$VPS_IP" "mkdir -p $APP_DIR"

echo "📡 Uploading files..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'uploads' \
  --exclude '.env' \
  --exclude 'public/videos' \
  --exclude 'public/images' \
  --exclude 'public/documents' \
  --exclude 'logs' \
  ./ "$VPS_USER@$VPS_IP:$APP_DIR"
# .env is EXCLUDED to prevent overwriting server-side DB connection and secrets!

# 3. Remote Commands
echo "🔄 Running remote setup..."
ssh "$VPS_USER@$VPS_IP" << 'EOF'
  cd /var/www/video-server
  
  # Update system and install OpenSSL (Critical for Prisma)
  apt-get update -y
  apt-get install -y openssl ca-certificates

  # Install Production Deps (Using npm install to generate lockfile if needed)
  npm install --omit=dev

  # Generate Prisma Client (Ensure Linux binary)
  npm exec prisma generate

  # Run DB Schema Sync (Using db push as migrations are not used)
  npx prisma db push --accept-data-loss

  # Restart PM2 (Server + Worker)
  pm2 reload video-server || pm2 start dist/server.js --name video-server
  pm2 reload video-worker || pm2 start dist/worker.js --name video-worker
  pm2 save

  # Reload Nginx
  # WARNING: Do NOT overwrite nginx.conf automatically as it wipes SSL certs!
  # sudo cp deploy/nginx.conf /etc/nginx/nginx.conf
  echo "⚠️ Skipping Nginx Config overwrite to preserve SSL/HTTPS."
  echo "👉 If you need to update Nginx, edit /etc/nginx/sites-available/default on the server manually."
  # Fix Permissions for Static Files (Critical for Nginx 404)
  sudo chmod -R 755 /var/www/video-server/public

  sudo service nginx reload
EOF

echo "✅ Deployment Successful!"
