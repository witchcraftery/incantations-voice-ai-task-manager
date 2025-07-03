# Multi-stage Dockerfile for Node.js Backend
FROM node:18-alpine AS base

# Install security updates and common dependencies
RUN apk update && apk upgrade && apk add --no-cache \
    curl \
    postgresql-client \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Development stage
FROM base AS development
ENV NODE_ENV=development

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Default command for development (can be overridden)
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production
ENV NODE_ENV=production

# Install dependencies (including devDependencies for TypeScript build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Production command
CMD ["node", "dist/index.js"]
