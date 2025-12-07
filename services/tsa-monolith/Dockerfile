# ================================
# Multi-stage Docker build for TSA Monolith (AdonisJS)
# ================================

# =====================================
# Stage 1: Base dependencies
# =====================================
FROM node:22-alpine AS base

# Install system dependencies once
RUN apk add --no-cache \
    postgresql-client \
    python3 \
    make \
    g++ \
    curl \
    dumb-init

# Set working directory
WORKDIR /app

# Copy package files for better caching
COPY package*.json ./

# =====================================
# Stage 2: Development dependencies & build
# =====================================
FROM base AS builder

# Install ALL dependencies (including dev dependencies)
RUN npm ci --include=dev --frozen-lockfile

# Copy source code (leveraging .dockerignore)
COPY . .

# Build the application
RUN npm run build

# =====================================
# Stage 3: Development runtime (optional)
# =====================================
FROM base AS development

# Set development environment
ENV NODE_ENV=development
ENV HOST=0.0.0.0
ENV PORT=3333

# Install all dependencies including dev dependencies
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S adonisjs -u 1001 -G nodejs && \
    chown -R adonisjs:nodejs /app

USER adonisjs

# Expose port
EXPOSE 3333

# Development command
CMD ["npm", "run", "dev"]
# =====================================
# Stage 4: Production runtime (DEFAULT)
# =====================================
FROM base AS production

# Set production environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3333
ENV TZ=UTC

# Install only production dependencies
RUN npm ci --omit=dev --frozen-lockfile && \
    npm cache clean --force --loglevel=error

# Copy built application from builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./
COPY --from=builder /app/ace.js ./
COPY --from=builder /app/bin ./bin
COPY --from=builder /app/database ./database
COPY --from=builder /app/commands ./commands

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S adonisjs -u 1001 -G nodejs

# Create necessary directories and set permissions
RUN mkdir -p /app/tmp /app/logs && \
    chown -R adonisjs:nodejs /app && \
    chmod 755 /app

USER adonisjs

# Expose port
EXPOSE 3333

# Add health check with better configuration
HEALTHCHECK --interval=30s --timeout=15s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3333/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start with migrations, seeds, email worker and main app
CMD ["sh", "-c", "echo 'Running migrations...' && node build/bin/console.js migration:run --force && echo 'Running seeds...' && node build/bin/console.js db:seed && echo 'Starting email worker...' && node build/bin/console.js email:worker-resend & echo 'Starting main application...' && node build/bin/server.js"]


