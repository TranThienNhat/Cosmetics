# ==========================================
# Production Dockerfile for Backend & ML Engine
# Compatible with Render, Fly.io, Railway, and VPS
# ==========================================

FROM node:20-bookworm-slim

# Install Python 3, pip, and essential build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    PYTHONIOENCODING=utf-8 \
    PYTHONUNBUFFERED=1

# 1. Install Python ML dependencies
COPY requirements.txt ./
RUN python3 -m pip install --no-cache-dir --break-system-packages -r requirements.txt

# 2. Install Node dependencies
COPY package*.json tsconfig.json ./
RUN npm ci --omit=dev=false

# 3. Copy source code, ML engine & assets
COPY src ./src
COPY ml_engine ./ml_engine
COPY uploads ./uploads

# 4. Build TypeScript to JavaScript
RUN npm run build && npm prune --production

# 5. Create non-root user for security
RUN useradd -m -u 1001 appuser && \
    mkdir -p /app/uploads && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 3000

# 6. Start production server
CMD ["node", "dist/server.js"]
