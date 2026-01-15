#!/bin/bash
# verify_nginx.sh
# Fetches the current Nginx config from the server for review

VPS_USER="root"
VPS_IP="194.238.16.22"

echo "🔍 Fetching current Nginx configuration..."
scp "$VPS_USER@$VPS_IP:/etc/nginx/sites-enabled/*" ./current_nginx_sites_enabled_dump
# Also try default expected paths if wildcard fails or maps to nothing useful
ssh "$VPS_USER@$VPS_IP" "cat /etc/nginx/sites-available/default" > ./current_nginx_default.conf

echo "✅ Configuration fetched to current_nginx_default.conf"
echo "👉 Please review this file before applying changes."
