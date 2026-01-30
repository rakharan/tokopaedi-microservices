# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# 1. Copy Shared Library & Build it
COPY shared ./shared
WORKDIR /app/shared
RUN npm install
RUN npm run build

# 2. Copy Service Source
# We use the generic parent structure so we can copy specific folders based on build args if needed, 
# but for simplicity, we assume the dockerfile is run from root.
WORKDIR /app
COPY services/order-service ./services/order-service

# 3. Install & Build Service
WORKDIR /app/services/order-service
RUN npm install
RUN npm run build

# Stage 2: Run
FROM node:20-alpine
WORKDIR /app

# Copy Shared
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/package.json

# Copy Service
COPY --from=builder /app/services/order-service/dist ./services/order-service/dist
COPY --from=builder /app/services/order-service/package.json ./services/order-service/package.json
COPY --from=builder /app/services/order-service/node_modules ./services/order-service/node_modules

WORKDIR /app/services/order-service
ENV NODE_ENV=production
# ENV PORT is set by Docker Compose

CMD ["node", "dist/index.js"]