# ================================
# Multi-stage Docker build for TSA Frontend (React + Vite)
# ================================

# =====================================
# Stage 1: Base dependencies
# =====================================
FROM node:22-alpine AS base

# Install system dependencies
RUN apk add --no-cache curl dumb-init

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# =====================================
# Stage 2: Build application
# =====================================
FROM base AS builder

# Install all dependencies (including dev)
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Build the application
RUN yarn build

# =====================================
# Stage 3: Development runtime (optional)
# =====================================
FROM base AS development

# Set development environment
ENV NODE_ENV=development

# Install all dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S reactapp -u 1001 -G nodejs && \
    chown -R reactapp:nodejs /app

USER reactapp

# Expose Vite dev server port
EXPOSE 5173

# Development command
CMD ["yarn", "dev", "--host", "0.0.0.0"]

# =====================================
# Stage 4: Production runtime with nginx (DEFAULT)
# =====================================
FROM nginx:alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint script and convert line endings (Windows CRLF -> Unix LF)
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

# Create non-root user for nginx
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S nginx-user -u 1001 -G nginx-user && \
    chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-user /var/run/nginx.pid

USER nginx-user

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

# Use custom entrypoint for runtime env injection
ENTRYPOINT ["/docker-entrypoint.sh"]
