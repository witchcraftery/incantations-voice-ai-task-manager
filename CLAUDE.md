# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (voice-ai-task-manager/)
```bash
cd voice-ai-task-manager
npm run dev          # Development server (HTTPS with SSL)
npm run dev:ssl       # Development server with network access
npm run dev:http      # HTTP development server (fallback)
npm run build         # Production build
npm run lint          # ESLint checking
npm run preview       # Preview production build
```

### Backend (backend/)
```bash
cd backend
npm run dev           # Development server with hot reload
npm run build         # TypeScript compilation
npm run start         # Production server
npm run migrate       # Database migrations
```

### Docker Development
```bash
docker-compose up                    # Full stack development
docker-compose up --profile http     # HTTP-only frontend (fallback)
docker-compose down                  # Stop all services
```

## Architecture Overview

### Monorepo Structure
- `/voice-ai-task-manager/` - React frontend with TypeScript
- `/backend/` - Express.js API server with TypeScript
- `/docs/` - Documentation and deployment guides
- `docker-compose.yml` - Full stack development environment

### Frontend Architecture
Built with React 18 + TypeScript, voice-first design pattern:

**Core Components:**
- `VoiceTaskManager` - Main app orchestrator (src/components/VoiceTaskManager.tsx:21)
- `ChatInterface` - Primary conversation interface
- `TaskDashboard` - Task management and visualization
- `VoiceControls` - Speech recognition and synthesis

**Services Layer:**
- `aiService.ts` - AI processing and task extraction (src/services/aiService.ts:4)
- `voiceService.ts` - Web Speech API integration
- `storageService.ts` - Local data persistence
- `enhancedAIService.ts` - OpenRouter API integration

**State Management:**
- Custom hooks pattern: `useChat`, `useTasks`, `useVoice`, `useNotifications`
- Local storage with automatic persistence
- React Context for theme and global state

### Backend Architecture
Express.js with TypeScript, designed for voice AI task management:

**API Structure:**
- `/api/auth` - Authentication endpoints
- `/api/tasks` - Task CRUD operations
- `/api/tts` - Text-to-speech services
- `/api/sync` - Data synchronization

**Database & Cache:**
- PostgreSQL for persistent data (docker-compose.yml:5)
- Redis for session management and caching (docker-compose.yml:25)
- Google OAuth integration for authentication

## Technology Stack

### Frontend Technologies
- **Framework:** React 18 with TypeScript
- **Styling:** TailwindCSS + Radix UI components
- **Voice:** Web Speech API (recognition + synthesis)
- **Build:** Vite with hot module replacement
- **Package Manager:** npm (with lock files)

### Backend Technologies
- **Runtime:** Node.js 18+ with Express.js
- **Database:** PostgreSQL 15 with connection pooling
- **Cache:** Redis 7 for performance
- **Security:** Helmet, CORS, JWT authentication
- **Logging:** Winston for structured logging

## Voice-First Design Patterns

### Primary Interaction Flow
1. User speaks naturally to the application
2. Web Speech API transcribes to text
3. AI service processes conversation and extracts tasks
4. System responds with voice synthesis and visual feedback
5. Tasks are automatically categorized and stored

### Voice Service Integration
- Real-time speech recognition with activity detection
- Text-to-speech responses for accessibility
- Fallback to text input when voice unavailable
- Error handling for browser compatibility

## Development Workflow

### Local Development Setup
1. Install dependencies in both frontend and backend
2. Copy environment files for configuration
3. Run with `docker-compose up` for full stack
4. Frontend available at https://localhost:5174 (SSL) or http://localhost:5175 (HTTP)
5. Backend API at http://localhost:3001

### Code Quality
- ESLint configured for TypeScript and React (voice-ai-task-manager/eslint.config.js:7)
- Automatic linting with `npm run lint`
- TypeScript strict mode enabled
- Radix UI for accessible components

### SSL Configuration
- Development SSL certificates in `/ssl/` or `/docker/ssl/`
- Vite configured for HTTPS by default (voice-ai-task-manager/vite.config.ts:15)
- HTTP fallback available via environment variables

## Data Flow Architecture

### Task Extraction Pipeline
1. Voice input → Speech recognition
2. Text processing → AI service (aiService.ts:11)
3. Task extraction with 85-92% accuracy
4. Automatic categorization and priority inference
5. Storage in local state + backend synchronization

### Conversation Management
- Message history with context preservation
- Conversation threading and organization
- Real-time AI processing with visual feedback
- Automatic memory and preference learning

## Production Deployment

### Docker Deployment
- Multi-stage Dockerfiles for frontend and backend
- Production-ready with security hardening
- PostgreSQL and Redis in containers
- SSL termination and reverse proxy support

### Environment Variables
- Development: `.env.docker` for Docker Compose
- Production: Environment-specific configuration
- Google OAuth credentials for authentication
- OpenRouter API keys for enhanced AI features

## Troubleshooting

### Voice Recognition Issues
- Browser compatibility: Chrome/Edge recommended
- HTTPS requirement for Web Speech API
- Microphone permissions must be granted
- Fallback to text input always available

### SSL Certificate Issues
- Use HTTP fallback: `npm run dev:http`
- Check certificate files in `/ssl/` directory
- Docker profile for HTTP-only: `--profile http`

### Database Connection
- Ensure PostgreSQL is running (Docker or local)
- Check connection string in environment variables
- Run migrations: `npm run migrate`