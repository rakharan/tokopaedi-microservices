# ---------------------------------------
# Stage 1: Build Shared Library & Service
# ---------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Copy Root Files (if any config is needed at root)
# (Skip for now)

# 2. Copy Shared Library
COPY shared ./shared
WORKDIR /app/shared
RUN npm install
RUN npm run build

# 3. Copy Product Service
WORKDIR /app/services/product-service
COPY services/product-service/package*.json ./
# We need to adjust the dependency path in package.json for Docker
# But for now, let's copy the source code first.
COPY services/product-service .

# 4. Install & Build Service
# We use 'npm ci' for clean install, but we need to link shared first
WORKDIR /app/services/product-service
RUN npm install
RUN npm run build

# ---------------------------------------
# Stage 2: Production Runner
# ---------------------------------------
FROM node:20-alpine

WORKDIR /app

# Copy built artifacts from Builder Stage
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/package.json

COPY --from=builder /app/services/product-service/dist ./services/product-service/dist
COPY --from=builder /app/services/product-service/package.json ./services/product-service/package.json
COPY --from=builder /app/services/product-service/node_modules ./services/product-service/node_modules

# Environment Variables (Defaults)
ENV NODE_ENV=production
ENV PORT=3002

WORKDIR /app/services/product-service

EXPOSE 3002

CMD ["node", "dist/index.js"]