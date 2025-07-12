# Environment Variables Setup for Production

## 📁 Required Files on Droplet:

### 1. **Root Level: `.env.docker`**
```bash
# Production Environment Variables for Docker Compose
NODE_ENV=production
PORT=3001
FRONTEND_PORT=5174

# Database Configuration  
DATABASE_URL=postgresql://incantations_user:your_new_postgres_password@postgres:5432/incantations_dev

# Redis Configuration
REDIS_URL=redis://redis:6379

# JWT Security (GENERATE A SECURE RANDOM STRING!)
JWT_SECRET=your_super_secure_jwt_secret_here_replace_me

# API Keys
DEEPGRAM_API_KEY=your_new_deepgram_api_key_here

# Google OAuth (Optional - for Calendar/Gmail integration)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://incantations.witchcraftery.io/auth/callback

# OpenRouter AI (Optional)
OPENROUTER_API_KEY=your_openrouter_api_key

# Frontend Environment Variables (Vite)
VITE_GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
VITE_GOOGLE_API_KEY=your_google_api_key_for_frontend
```

### 2. **Backend: `backend/.env.backend`**
```bash
# Backend-specific overrides (if needed)
NODE_ENV=production
PORT=3001

# Database (matches Docker Compose postgres service)
DATABASE_URL=postgresql://incantations_user:your_new_postgres_password@postgres:5432/incantations_dev

# Redis (matches Docker Compose redis service)
REDIS_URL=redis://redis:6379

# Security
JWT_SECRET=your_super_secure_jwt_secret_here_replace_me

# API Keys
DEEPGRAM_API_KEY=your_new_deepgram_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 🔐 **Security Notes:**

1. **Generate secure JWT secret:**
   ```bash
   # Run this to generate a secure secret:
   openssl rand -base64 32
   ```

2. **Use strong PostgreSQL password:**
   - Replace `your_new_postgres_password` with a strong password
   - Update in both `.env.docker` and `docker-compose.yml`

3. **Regenerate Deepgram API key:**
   - Go to Deepgram console
   - Create new API key to replace the exposed one

## 📋 **Setup Commands on Droplet:**

```bash
# 1. Create environment files
nano .env.docker
nano backend/.env.backend

# 2. Set proper permissions
chmod 600 .env.docker backend/.env.backend

# 3. Deploy
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
``` 