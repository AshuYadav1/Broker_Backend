#!/bin/bash
VPS_USER="root"
VPS_IP="194.238.16.22"

echo "🚀 Force Pushing Schema to VPS Database..."
echo "(This bypasses local migration files)"

ssh "$VPS_USER@$VPS_IP" << 'EOF'
  cd /var/www/video-server
  
  echo "🔄 Pushing Schema..."
  # prisma db push updates the DB schema directly from schema.prisma
  npx prisma db push
  
  echo "✅ Database is now in sync with schema!"
EOF
