#!/bin/bash

cd /home/claude/ecommerce-microservices/services/order-service

# package.json
cat > package.json << 'EOF'
{
  "name": "order-service",
  "version": "1.0.0",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/axios": "^3.0.0",
    "typeorm": "^0.3.17",
    "pg": "^8.11.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1",
    "axios": "^1.4.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "typescript": "^5.1.3"
  }
}
EOF

echo "Order service package.json created"
