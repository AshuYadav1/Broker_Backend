# RoyalKey Deployment Config

## Architecture
- **Origin**: VPS (Node.js + Nginx + Redis)
- **CDN**: Cloudflare (Global Caching)
- **Database**: PostgreSQL (Metadata)

## How to Deploy

### 1. One-Time Server Setup
SSH into your VPS and run:
```bash
# Copy setup script
scp deploy/setup_vps.sh root@your_vps_ip:~/

# Run it
ssh root@your_vps_ip
chmod +x setup_vps.sh
./setup_vps.sh
```

### 2. Configure Cloudflare
1. Go to Cloudflare Dashboard -> SSL/TLS.
2. Set mode to **Full (Strict)**.
3. Keep the "Orange Cloud" (Proxy) ENABLED for `video.royalkey.in`.

### 3. Deploy Updates
From your local `video-server` folder:
```bash
# Edit deploy.sh first with your IP!
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

## Scaling
To reach "Netflix Scale":
1. **Enable Cloudflare Stream**: For massive VoD storage/delivery.
2. **Add Load Balancer**: If Origin CPU spikes > 80%.
3. **Separate Database**: Move Postgres to a managed RDS/CloudSQL instance.
