# ---------------------------------------------------
# Service Name: api-gateway
# ---------------------------------------------------

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# 1. Copy Shared (Optional for Gateway, but keeps build consistent)
COPY shared ./shared
WORKDIR /app/shared
# If shared has no dependencies, this is fast
RUN npm install 
RUN npm run build

# 2. Copy Gateway Source
WORKDIR /app
COPY services/api-gateway ./services/api-gateway

# 3. Install & Build Gateway
WORKDIR /app/services/api-gateway
RUN npm install
RUN npm run build

# Stage 2: Run
FROM node:20-alpine
WORKDIR /app

# Copy Shared (Just in case)
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/package.json

# Copy Gateway Artifacts
COPY --from=builder /app/services/api-gateway/dist ./services/api-gateway/dist
COPY --from=builder /app/services/api-gateway/package.json ./services/api-gateway/package.json
COPY --from=builder /app/services/api-gateway/node_modules ./services/api-gateway/node_modules

WORKDIR /app/services/api-gateway
ENV NODE_ENV=production
ENV PORT=3000

# Expose the Gateway Port
EXPOSE 3000

CMD ["node", "dist/index.js"]