#!/bin/bash
# SelAI Music Generator Deployment Script
# Usage: bash deploy.sh

set -e

echo "🎵 Deploying SelAI Music Generator to music.miolong.com"

# 1. Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install dependencies
echo "🔧 Installing dependencies..."
sudo apt install -y curl git build-essential nginx redis-server ffmpeg

# 3. Install Node.js (18.x)
if ! command -v node >/dev/null 2>&1 || [[ $(node -v) != v18* ]]; then
  echo "📥 Installing Node.js 18.x..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# 4. Install MongoDB
if ! command -v mongod >/dev/null 2>&1; then
  echo "🗄️ Installing MongoDB..."
  wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
  echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
  sudo apt-get update
  sudo apt-get install -y mongodb-org
  sudo systemctl enable mongod
  sudo systemctl start mongod
fi

# 5. Install PM2 globally
echo "⚡ Installing PM2..."
sudo npm install -g pm2

# 6. Clone repo if not present
if [ ! -d "SelAiMusic" ]; then
  echo "📥 Cloning repository..."
  git clone https://github.com/SLSTunnel/SelAiMusic.git
  cd SelAiMusic
else
  echo "🔄 Updating repository..."
  cd SelAiMusic
  git pull
fi

# 7. Install all dependencies
echo "📦 Installing project dependencies..."
npm run install:all

# 8. Copy env files if not present
echo "⚙️ Setting up environment files..."
[ -f backend/.env ] || cp backend/env.example backend/.env
[ -f frontend/.env ] || cp frontend/env.example frontend/.env
[ -f ai-service/.env ] || cp ai-service/env.example ai-service/.env

# 9. Update environment files with correct domain
echo "🌐 Updating domain configuration..."
sed -i 's/your-domain.com/music.miolong.com/g' backend/.env
sed -i 's/your-domain.com/music.miolong.com/g' frontend/.env
sed -i 's/localhost:3000/music.miolong.com/g' frontend/.env
sed -i 's/localhost:3001/music.miolong.com/g' frontend/.env

# 10. Build frontend
echo "🏗️ Building frontend..."
cd frontend && npm run build && cd ..

# 11. Run database migrations
echo "🗄️ Running database migrations..."
cd backend && npm run migrate && cd ..

# 12. Create logs directory
mkdir -p logs

# 13. Start all services with PM2
echo "🚀 Starting services with PM2..."
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# 14. Create Nginx configuration
echo "🌐 Setting up Nginx..."
sudo tee /etc/nginx/sites-available/music.miolong.com > /dev/null <<EOF
server {
    listen 80;
    server_name music.miolong.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket support
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static files
    location /_next/static {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
}
EOF

# 15. Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/music.miolong.com /etc/nginx/sites-enabled/music.miolong.com
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# 16. SSL with Let's Encrypt (optional, interactive)
if ! sudo certbot certificates | grep -q music.miolong.com; then
  echo ""
  echo "🔒 SSL Certificate Setup"
  echo "To enable HTTPS, run the following command:"
  echo "sudo certbot --nginx -d music.miolong.com"
  echo ""
  echo "After SSL setup, add this to crontab for auto-renewal:"
  echo "sudo crontab -e"
  echo "Add: 0 12 * * * /usr/bin/certbot renew --quiet"
fi

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your site is now available at: http://music.miolong.com"
echo "📊 PM2 Status: pm2 status"
echo "📋 PM2 Logs: pm2 logs"
echo "🔄 Restart services: pm2 restart all"
echo "🛑 Stop services: pm2 stop all"
echo ""
echo "⚠️  Don't forget to:"
echo "   1. Edit your .env files with your API keys and secrets"
echo "   2. Set up SSL with: sudo certbot --nginx -d music.miolong.com"
echo "   3. Configure your domain DNS to point to this server's IP" 