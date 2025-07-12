# SelAI Music Generator - Advanced AI Music Platform

A comprehensive AI-powered music generation platform with advanced features including AI training, subscription management, and professional music production tools.

## Features

### 🎵 AI Music Generation
- **Prompt-based music creation** with advanced AI models
- **Multiple genres and styles** support
- **Real-time generation** with progress tracking
- **High-quality audio output** (up to 320kbps)

### 🤖 AI Training System
- **User submission portal** for code and music training
- **Professional AI model training** from user data
- **Quality control and validation** system
- **Training progress tracking**

### 👤 User Management
- **Google OAuth integration** for seamless signup/signin
- **Traditional email/password authentication**
- **User profiles** with avatars and statistics
- **Music generation history** and analytics

### 💰 Subscription System
- **Monthly subscription** starting at $14 USD
- **Annual subscription** with discounts
- **Premium features** for subscribers
- **Secure payment processing** via Stripe

### 🎼 Advanced Music Features
- **Download generated music** in multiple formats
- **Remix capabilities** with AI assistance
- **Stem separation** (vocals, drums, bass, etc.)
- **MIDI export** for further editing
- **Playlist creation** and management

### 🎨 Professional Tools
- **Music visualization** and waveform display
- **BPM detection** and adjustment
- **Key detection** and transposition
- **Advanced audio effects** and processing

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** for database
- **Redis** for caching and sessions
- **JWT** for authentication
- **Stripe** for payments
- **Google OAuth** integration
- **FFmpeg** for audio processing
- **TensorFlow.js** for AI models

### Frontend
- **React.js** with TypeScript
- **Next.js** for SSR and routing
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Query** for state management
- **WaveSurfer.js** for audio visualization

### AI & Audio
- **OpenAI Whisper** for audio transcription
- **Custom AI models** for music generation
- **Web Audio API** for real-time processing
- **AudioWorklet** for advanced audio manipulation

## Quick Installation

### Prerequisites
- Node.js 18+ 
- MongoDB 6+
- Redis 6+
- FFmpeg
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/SLSTunnel/SelAiMusic.git
cd SelAiMusic
```

### 2. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install AI service dependencies
cd ../ai-service
npm install
```

### 3. Environment Setup
```bash
# Copy environment files
cp backend/env.example backend/.env
cp frontend/env.example frontend/.env
cp ai-service/env.example ai-service/.env
```

### 4. Configure Environment Variables
Edit the `.env` files with your configuration:

**Backend (.env)**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/selai_music
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# AI Service
AI_SERVICE_URL=http://localhost:3002

# File Storage
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET=selai-music-storage

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Frontend (.env)**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

**AI Service (.env)**
```env
MODEL_PATH=./models/music_generator
OPENAI_API_KEY=your-openai-api-key
CUDA_VISIBLE_DEVICES=0
```

### 5. Database Setup
```bash
# Start MongoDB
mongod

# Start Redis
redis-server

# Run database migrations
cd backend
npm run migrate
```

### 6. Start Services
```bash
# Terminal 1 - Backend API
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - AI Service
cd ai-service
npm run dev
```

### 7. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **AI Service**: http://localhost:3002

## Automated VPS Deployment (Recommended)

You can deploy the entire platform on your VPS with a single command using the provided `deploy.sh` script. This script will:
- Install all required dependencies (Node.js, MongoDB, Redis, FFmpeg, Nginx, PM2)
- Clone or update the repository
- Install all backend, frontend, and AI service dependencies
- Set up environment files
- Build the frontend
- Run database migrations
- Start all services with PM2
- Configure Nginx as a reverse proxy
- Prompt for SSL setup with Let's Encrypt

**To deploy:**
```bash
# Download or copy deploy.sh to your VPS, then run:
bash deploy.sh
```

- The script is idempotent and safe to run multiple times.
- Edit your `.env` files as needed after the first run.
- For SSL, follow the prompt at the end of the script.

See [`deploy.sh`](./deploy.sh) for details.

---

## VPS Deployment (Manual)

### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install Redis
sudo apt install redis-server

# Install FFmpeg
sudo apt install ffmpeg

# Install PM2
sudo npm install -g pm2
```

### 2. Clone and Setup
```bash
# Clone repository
git clone https://github.com/SLSTunnel/SelAiMusic.git
cd SelAiMusic

# Install dependencies
npm run install:all

# Setup environment
cp .env.example .env
# Edit .env with your production values
```

### 3. Start Services
```bash
# Start all services with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

### 4. Nginx Configuration
```bash
# Install Nginx
sudo apt install nginx

# Configure Nginx
sudo nano /etc/nginx/sites-available/music.miolong.com
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name music.miolong.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/music.miolong.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d music.miolong.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/google` - Google OAuth
- `POST /api/auth/logout` - User logout

### Music Generation Endpoints
- `POST /api/music/generate` - Generate music from prompt
- `GET /api/music/:id` - Get music details
- `GET /api/music/:id/download` - Download music
- `GET /api/music/:id/stems` - Get separated stems
- `GET /api/music/:id/midi` - Get MIDI file

### User Management Endpoints
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/music` - Get user's music
- `GET /api/user/playlists` - Get user's playlists

### Subscription Endpoints
- `POST /api/subscription/create` - Create subscription
- `GET /api/subscription/status` - Get subscription status
- `POST /api/subscription/cancel` - Cancel subscription

### AI Training Endpoints
- `POST /api/training/submit` - Submit training data
- `GET /api/training/status` - Get training status
- `GET /api/training/history` - Get training history

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Email: support@selaimusic.com
- Discord: https://discord.gg/selaimusic
- Documentation: https://docs.selaimusic.com

## Roadmap

- [ ] Advanced AI model training
- [ ] Real-time collaboration
- [ ] Mobile app development
- [ ] Advanced audio effects
- [ ] Social features
- [ ] API for third-party integrations 