# ---------------------------------------------------
# Service Name: delivery-service
# ---------------------------------------------------

# Stage 1: Build
FROM node:20-alpine AS builder
ARG SERVICE_NAME=delivery-service
WORKDIR /app

# 1. Copy Shared & Build
COPY shared ./shared
WORKDIR /app/shared
RUN npm install
RUN npm run build

# 2. Copy Service Source
WORKDIR /app
COPY services/${SERVICE_NAME} ./services/${SERVICE_NAME}

# 3. Install & Build Service
WORKDIR /app/services/${SERVICE_NAME}
RUN npm install
RUN npm run build

# Stage 2: Run
FROM node:20-alpine
ARG SERVICE_NAME=delivery-service
WORKDIR /app

# Copy Shared
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/package.json

# Copy Service
COPY --from=builder /app/services/${SERVICE_NAME}/dist ./services/${SERVICE_NAME}/dist
COPY --from=builder /app/services/${SERVICE_NAME}/package.json ./services/${SERVICE_NAME}/package.json
COPY --from=builder /app/services/${SERVICE_NAME}/node_modules ./services/${SERVICE_NAME}/node_modules

WORKDIR /app/services/${SERVICE_NAME}
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]