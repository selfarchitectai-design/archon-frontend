# ARCHON Compact Federation - Docker Image
# Version: 2.5.1
# Purpose: Containerized AI orchestration environment

FROM node:20-slim AS base

# Set environment
ENV NODE_ENV=production
ENV ARCHON_VERSION=2.5.1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
RUN pip3 install --break-system-packages \
    requests \
    pyyaml \
    sqlite-utils

# ================================
# Build Stage
# ================================
FROM base AS builder

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# ================================
# Production Stage
# ================================
FROM base AS runner

# Create non-root user
RUN addgroup --system --gid 1001 archon && \
    adduser --system --uid 1001 archon

# Copy built artifacts
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# Copy ARCHON Federation modules
COPY archon_core/ ./archon_core/

# Set ownership
RUN chown -R archon:archon /app

USER archon

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
CMD ["npm", "start"]
