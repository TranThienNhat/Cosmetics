# ==========================================
# Production Dockerfile for Frontend (Vite + Nginx)
# ==========================================

# Step 1: Build React/Vite app
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig*.json ./
RUN npm ci

COPY . .

# Pass build-time environment variables
ARG VITE_API_URL
ARG VITE_API_BASE_URL
ARG VITE_UPLOAD_URL

ENV VITE_API_URL=${VITE_API_URL} \
    VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_UPLOAD_URL=${VITE_UPLOAD_URL}

RUN npm run build

# Step 2: Serve with high-performance Nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
