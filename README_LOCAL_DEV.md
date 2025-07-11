# Local Development Setup

This guide explains how to run the Incantations Voice AI Task Manager locally for development without Docker.

## Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm
- PostgreSQL database (local or remote)
- Redis server (local or remote)

### One-Command Local Development

Run both frontend and backend simultaneously:

```bash
npm run dev:local
```

This command will:
- Start the **backend** on `http://localhost:3001` using tsx
- Start the **frontend** on `http://localhost:5173` using Vite
- Both services will auto-reload on file changes

## Manual Setup (Alternative)

If you prefer to run services individually:

### 1. Install Dependencies

```bash
# Install root workspace dependencies
npm install

# Or install all dependencies at once
npm run install:all
```

### 2. Environment Configuration

#### Backend (.env in /backend/)
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://username:password@localhost:5432/incantations
REDIS_URL=redis://localhost:6379
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_jwt_secret_here
OPENROUTER_API_KEY=your_openrouter_api_key
```

#### Frontend (.env in /voice-ai-task-manager/)
```env
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 3. Start Services Individually

#### Backend (Port 3001)
```bash
npm run backend:dev
# or
cd backend && npm run dev
```

#### Frontend (Port 5173)
```bash
npm run frontend:dev
# or
cd voice-ai-task-manager && FRONTEND_PORT=5173 npm run dev
```

## LAN Testing with TailScale

### TailScale Setup for Cross-Device Testing

TailScale provides secure access to your local development server from any device in your TailScale network, perfect for testing on mobile devices or other computers.

#### 1. Install TailScale
- Download and install TailScale on your development machine
- Install TailScale on any devices you want to test with
- Sign in with the same account on all devices

#### 2. Get Your TailScale IP
```bash
# Get your TailScale IP address
tailscale ip -4
```

#### 3. Access Your Local Dev Server
Once TailScale is running, you can access your development server from any TailScale-connected device:

- **Frontend**: `http://[TAILSCALE_IP]:5173`
- **Backend API**: `http://[TAILSCALE_IP]:3001`

Example:
- Frontend: `http://100.64.1.2:5173`
- Backend: `http://100.64.1.2:3001`

#### 4. Update Environment Variables for TailScale Testing

When testing via TailScale, update your frontend environment:

```env
# In voice-ai-task-manager/.env
VITE_API_URL=http://[YOUR_TAILSCALE_IP]:3001
```

#### Benefits of TailScale for Development:
- ✅ **Secure**: Encrypted connection between devices
- ✅ **Easy**: No port forwarding or firewall configuration needed
- ✅ **Cross-Platform**: Test on iOS, Android, other computers
- ✅ **Always Connected**: Works from anywhere with internet
- ✅ **No Public Exposure**: Your dev server stays private

## Google OAuth Configuration

### Development OAuth Setup

For Google OAuth to work with `http://localhost:5173`, you need to configure your Google Cloud Console:

#### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "Credentials"
4. Click on your OAuth 2.0 Client ID (or create one)

#### 2. Add Authorized Origins
In the "Authorized JavaScript origins" section, add:
```
http://localhost:5173
```

#### 3. Add Authorized Redirect URIs
In the "Authorized redirect URIs" section, add:
```
http://localhost:5173/auth/callback
http://localhost:5173/login
```

#### 4. For TailScale Testing
If you're testing via TailScale, also add:
```
http://[YOUR_TAILSCALE_IP]:5173
http://[YOUR_TAILSCALE_IP]:5173/auth/callback
http://[YOUR_TAILSCALE_IP]:5173/login
```

**Note**: Replace `[YOUR_TAILSCALE_IP]` with your actual TailScale IP address.

#### 5. Save and Test
- Click "Save" in the Google Cloud Console
- Wait a few minutes for changes to propagate
- Test OAuth login at `http://localhost:5173`

## Available Scripts

### Root Level Scripts
- `npm run dev:local` - Start both frontend and backend for local development
- `npm run build` - Build both frontend and backend for production
- `npm run install:all` - Install dependencies for all workspaces

### Backend Scripts (from root)
- `npm run backend:dev` - Start backend in development mode
- `npm run backend:build` - Build backend for production

### Frontend Scripts (from root)  
- `npm run frontend:dev` - Start frontend in development mode
- `npm run frontend:build` - Build frontend for production

## Port Configuration

| Service | Local Port | Purpose |
|---------|------------|---------|
| Frontend | 5173 | Vite development server |
| Backend | 3001 | Express API server |
| PostgreSQL | 5432 | Database (if local) |
| Redis | 6379 | Cache/session store (if local) |

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
If port 5173 or 3001 is busy:
```bash
# Kill processes on specific ports
lsof -ti:5173 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

#### 2. Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in backend/.env
- Verify database exists and credentials are correct

#### 3. Redis Connection Issues
- Ensure Redis is running: `redis-server`
- Check REDIS_URL in backend/.env

#### 4. Google OAuth Issues
- Verify `http://localhost:5173` is in authorized origins
- Check GOOGLE_CLIENT_ID matches in both frontend and backend
- Clear browser cache and cookies

#### 5. CORS Issues
The backend is configured to allow:
- `http://localhost:5173` (development frontend)
- `http://localhost:5174` (alternative frontend port)

If you need to add TailScale IPs or other origins, update the CORS configuration in `/backend/src/index.ts`.

## Development Tips

### Hot Reloading
Both services support hot reloading:
- **Backend**: Uses `tsx watch` for automatic TypeScript compilation and restart
- **Frontend**: Uses Vite's hot module replacement (HMR)

### Code Formatting
```bash
# Format all code
cd voice-ai-task-manager && npm run format
cd backend && # (add formatting script if needed)
```

### Testing
```bash
# Run frontend tests
cd voice-ai-task-manager && npm test

# Run backend tests (if configured)
cd backend && npm test
```

## Architecture Overview

```
┌─────────────────┐    HTTP/API     ┌──────────────────┐
│   Frontend      │ ──────────────► │     Backend      │
│   (React/Vite)  │                 │   (Express/TS)   │
│   Port: 5173    │                 │   Port: 3001     │
└─────────────────┘                 └──────────────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │   PostgreSQL    │
                                    │   + Redis       │
                                    └─────────────────┘
```

This setup provides a complete local development environment with fast iteration cycles and easy testing across devices via TailScale.
