#!/bin/bash

# Tokopaedi Microservices - Project Structure Setup
echo "Creating Tokopaedi Microservices project structure..."

# Root structure
mkdir -p tokopaedi-microservices
cd tokopaedi-microservices

# Create service directories
mkdir -p services/{user-service,product-service,order-service,payment-service,delivery-service,notification-service}
mkdir -p api-gateway
mkdir -p shared/{types,events,utils,config}
mkdir -p infrastructure/{rabbitmq,mysql,redis,monitoring}
mkdir -p scripts
mkdir -p docs

echo "✓ Root structure created"

# User Service
mkdir -p services/user-service/{src,tests}
mkdir -p services/user-service/src/{controllers,services,repositories,models,middlewares,routes}
touch services/user-service/{Dockerfile,package.json,.env.example,README.md}

echo "✓ User Service structure created"

# Product Service
mkdir -p services/product-service/{src,tests}
mkdir -p services/product-service/src/{controllers,services,repositories,models,middlewares,routes}
touch services/product-service/{Dockerfile,package.json,.env.example,README.md}

echo "✓ Product Service structure created"

# Order Service
mkdir -p services/order-service/{src,tests}
mkdir -p services/order-service/src/{controllers,services,repositories,models,middlewares,routes,sagas}
touch services/order-service/{Dockerfile,package.json,.env.example,README.md}

echo "✓ Order Service structure created"

# Payment Service
mkdir -p services/payment-service/{src,tests}
mkdir -p services/payment-service/src/{controllers,services,repositories,models,middlewares,routes,gateways}
touch services/payment-service/{Dockerfile,package.json,.env.example,README.md}

echo "✓ Payment Service structure created"

# Delivery Service
mkdir -p services/delivery-service/{src,tests}
mkdir -p services/delivery-service/src/{controllers,services,repositories,models,middlewares,routes}
touch services/delivery-service/{Dockerfile,package.json,.env.example,README.md}

echo "✓ Delivery Service structure created"

# Notification Service
mkdir -p services/notification-service/{src,tests}
mkdir -p services/notification-service/src/{controllers,services,repositories,models,templates}
touch services/notification-service/{Dockerfile,package.json,.env.example,README.md}

echo "✓ Notification Service structure created"

# API Gateway
mkdir -p api-gateway/{src,tests}
mkdir -p api-gateway/src/{routes,middlewares,config}
touch api-gateway/{Dockerfile,package.json,.env.example,README.md}

echo "✓ API Gateway structure created"

# Shared package
touch shared/{package.json,tsconfig.json,README.md}

echo "✓ Shared package structure created"

# Root files
touch {docker-compose.yml,docker-compose.prod.yml,.env.example,.gitignore,README.md}
touch {package.json,tsconfig.base.json,pnpm-workspace.yaml}

# Infrastructure configs
touch infrastructure/rabbitmq/rabbitmq.conf
touch infrastructure/mysql/init.sql
touch infrastructure/redis/redis.conf
mkdir -p infrastructure/monitoring/{grafana,prometheus}
touch infrastructure/monitoring/prometheus/prometheus.yml
mkdir -p infrastructure/monitoring/grafana/{dashboards,datasources}

echo "✓ Infrastructure configs created"

# Scripts
touch scripts/{migrate-db.sh,seed-data.sh,start-dev.sh,build-all.sh}
chmod +x scripts/*.sh

echo "✓ Scripts created"

# Documentation
touch docs/{API.md,DEPLOYMENT.md,DEVELOPMENT.md,ARCHITECTURE.md}

echo "✓ Documentation files created"

echo ""
echo "════════════════════════════════════════════════"
echo "  Project structure created successfully! 🚀"
echo "════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. cd tokopaedi-microservices"
echo "  2. Review the ARCHITECTURE.md file"
echo "  3. Start with user-service implementation"
echo ""
