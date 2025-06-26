# 🐳 Docker Development Guide

## 🚀 **Quick Start**

### **Option 1: Full Docker Stack (Recommended)**
```bash
# Start all services (database, backend, frontend)
docker-compose up

# Or run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### **Option 2: Hybrid Development (Database in Docker, Code Local)**
```bash
# Start only database services
docker-compose up postgres redis -d

# Run backend locally (in separate terminal)
cd backend
npm run dev

# Run frontend locally (in separate terminal)  
cd voice-ai-task-manager
npm run dev:ssl
```

## 🔗 **Service URLs**

- **Frontend**: https://localhost:5174 (HTTPS enabled!)
- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 🔧 **Development Commands**

### **Database Management**
```bash
# Reset database (removes all data!)
docker-compose down -v
docker-compose up postgres -d

# Run database migrations
docker-compose exec backend npm run migrate

# Access PostgreSQL directly
docker-compose exec postgres psql -U incantations_user -d incantations_dev
```

### **Service Management**
```bash
# Restart a specific service
docker-compose restart backend

# Rebuild a service after code changes
docker-compose up --build backend

# View service logs
docker-compose logs -f frontend
docker-compose logs -f backend
```

### **Development Workflow**
```bash
# Install dependencies (if package.json changes)
docker-compose exec backend npm install
docker-compose exec frontend npm install

# Run tests
docker-compose exec backend npm test
docker-compose exec frontend npm test
```

## 🔐 **SSL Certificate Setup**

SSL certificates are automatically generated and configured for HTTPS development.

### **Trust Certificate (Optional)**
To avoid browser warnings, add the certificate to your system:

**macOS:**
```bash
# Add to Keychain and trust
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain docker/ssl/localhost-cert.pem
```

**Or simply accept the browser warning for localhost development.**

## 📁 **File Editing**

**Important**: Edit files in their normal locations:
- Backend code: `backend/src/`
- Frontend code: `voice-ai-task-manager/src/`

Hot reload works automatically! Changes are reflected immediately.

## 🔧 **Environment Variables**

### **Development (Docker)**
- Database URL: `postgresql://incantations_user:dev_password@postgres:5432/incantations_dev`
- Redis URL: `redis://redis:6379`
- Frontend URL: `https://localhost:5174`

### **Local Development (Non-Docker)**
- Database URL: `postgresql://postgres:password@localhost:5432/incantations_dev`
- Redis URL: `redis://localhost:6379`
- Frontend URL: `http://localhost:5174`

## 🐛 **Troubleshooting**

### **Port Already in Use**
```bash
# Find and kill process using port
lsof -ti:5174 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### **Database Connection Issues**
```bash
# Reset database container
docker-compose down postgres
docker-compose up postgres -d

# Check database logs
docker-compose logs postgres
```

### **SSL Certificate Issues**
```bash
# Regenerate certificates
./docker/generate-ssl.sh

# Restart frontend
docker-compose restart frontend
```

### **Clean Start**
```bash
# Remove all containers and volumes (DANGER: deletes data!)
docker-compose down -v --remove-orphans
docker system prune -a

# Rebuild everything
docker-compose up --build
```

## 🚀 **Production Deployment**

The same Docker configuration works for production:

```bash
# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Deploy to DigitalOcean
# (will be covered in deployment documentation)
```

## 📊 **Benefits Achieved**

✅ **HTTPS Development** - Chrome permissions fixed!  
✅ **Database Consistency** - Same PostgreSQL version everywhere  
✅ **Easy Onboarding** - One command setup  
✅ **Production Parity** - Same environment dev → production  
✅ **Hot Reload** - Code changes reflected immediately  
✅ **Isolated Services** - Clean separation of concerns

**Happy Docker Development!** 🎉
