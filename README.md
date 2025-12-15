# 🚀 Video & Media Server Deployment Guide

## 1. Prepare your VPS
1.  Connect to your VPS: `ssh root@194.238.16.22`
2.  Create a folder: `mkdir -p /home/ubuntu/video-server`
3.  Exit: `exit`

## 2. Upload the Code
Make sure you are in the `Documents/Broker System` folder on your Mac.
```bash
# Zip the project
cd video-server
zip -r video-server.zip .

# Upload to VPS
scp video-server.zip root@194.238.16.22:/home/ubuntu/video-server/
```

## 3. Install & Start (On VPS)
Connect again: `ssh root@194.238.16.22`

```bash
cd /home/ubuntu/video-server
apt install unzip
unzip video-server.zip
chmod +x setup.sh
./setup.sh
```

## 4. Finalize SSL
The script usually sets up Nginx. To get the green lock (HTTPS):
```bash
certbot --nginx -d video.royalkey.in
```

## 5. Usage
- **Endpoint**: `https://video.royalkey.in/upload`
- **Dashboards**: Your CRM is already configured to use this URL.
- **App**: Your Flutter app will automatically play these high-speed videos.

## Security Features Included
- **Rate Limiting**: Limits repeated requests to prevent brute-force attacks.
- **Helmet**: Adds security headers (XSS Filter, No-Sniff, etc.).
- **CORS**: Restricted to `royalkey.in`.
