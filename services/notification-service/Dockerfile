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
COPY services/notification-service ./services/notification-service

# 3. Install & Build Service
WORKDIR /app/services/notification-service
RUN npm install
RUN npm run build

# Stage 2: Run
FROM node:20-alpine
WORKDIR /app

# Copy Shared
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/package.json

# Copy Service
COPY --from=builder /app/services/notification-service/dist ./services/notification-service/dist
COPY --from=builder /app/services/notification-service/package.json ./services/notification-service/package.json
COPY --from=builder /app/services/notification-service/node_modules ./services/notification-service/node_modules

WORKDIR /app/services/notification-service
ENV NODE_ENV=production
# ENV PORT is set by Docker Compose

CMD ["node", "dist/index.js"]