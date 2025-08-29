# Use Node.js 22 LTS (Alpine for smaller size)
FROM node:22-alpine

# Set environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3333

# Create app directory
WORKDIR /app

# Install system dependencies for PostgreSQL and other native modules
RUN apk add --no-cache \
    postgresql-client \
    python3 \
    make \
    g++ \
    curl

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci --include=dev

# Copy application source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production && \
    npm cache clean --force

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S adonisjs -u 1001 -G nodejs && \
    chown -R adonisjs:nodejs /app

USER adonisjs

# Expose port
EXPOSE 3333

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3333/health || exit 1

# Start the application
CMD ["node", "bin/server.js"]