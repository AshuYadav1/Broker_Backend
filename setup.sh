#!/bin/bash

# Update System
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install FFmpeg
sudo apt install -y ffmpeg

# Install Nginx
sudo apt install -y nginx

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Setup Project
# Assumes you have copied the 'video-server' folder to /home/ubuntu/video-server
cd /home/ubuntu/video-server
npm install
npm run build

# Start Server with PM2
pm2 start dist/server.js --name "video-server"
pm2 save
pm2 startup

# Configure Nginx
# Only creates the config, user must symlink and restart
echo "
server {
    listen 80;
    server_name video.royalkey.in;

    # SSL configuration will be added by Certbot later
    # listen 443 ssl; 

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        
        # Security Headers
        add_header X-Frame-Options \"SAMEORIGIN\";
        add_header X-XSS-Protection \"1; mode=block\";
        add_header X-Content-Type-Options \"nosniff\";
    }

    # Optimize delivery for all static media (videos, images, pdfs)
    location /media/ {
        alias /home/ubuntu/video-server/public/;
        add_header Cache-Control 'public, max-age=3600';
        add_header Access-Control-Allow-Origin *;
        autoindex off;
    }
}
" > nginx_config_video

# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

echo "Setup Complete!"
echo "1. Verify nginx config: sudo nginx -t"
echo "2. Enable site: sudo ln -s /etc/nginx/sites-available/video-server /etc/nginx/sites-enabled/"
echo "3. Restart Nginx: sudo systemctl restart nginx"
echo "4. Enable SSL (HTTPS): sudo certbot --nginx -d video.royalkey.in"
