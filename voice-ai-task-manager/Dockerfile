# Multi-stage Dockerfile for React Frontend
FROM node:18-alpine AS base

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache \
    curl \
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

# Copy SSL certificates for HTTPS development
RUN mkdir -p /app/ssl

# Expose port
EXPOSE 5174

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -k -f https://localhost:5174/ || exit 1

# Default command for development
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS build
ENV NODE_ENV=production

# Install dependencies (including devDependencies for TypeScript)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine AS production

# Install security updates
RUN apk update && apk upgrade && rm -rf /var/cache/apk/*

# Copy built application
COPY --from=build /app/dist /usr/share/nginx/html

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy SSL certificates for production
RUN mkdir -p /etc/nginx/ssl

# Expose ports
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
