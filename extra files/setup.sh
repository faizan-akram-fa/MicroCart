#!/bin/bash

# E-Commerce Microservices Setup Script
# This script creates all remaining services with proper structure

set -e

BASE_DIR="/home/claude/ecommerce-microservices"
cd $BASE_DIR

echo "Creating remaining microservices structure..."

# Copy common files for remaining services
create_common_files() {
    SERVICE_NAME=$1
    PORT=$2
    DB_NAME=$3
    
    mkdir -p "services/$SERVICE_NAME/src/{entities,dto,services,controllers,guards,decorators}"
    
    # Create tsconfig.json
    cat > "services/$SERVICE_NAME/tsconfig.json" << 'TSEOF'
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true
  }
}
TSEOF

    # Create nest-cli.json
    cat > "services/$SERVICE_NAME/nest-cli.json" << 'NESTEOF'
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
NESTEOF

    # Create .env
    cat > "services/$SERVICE_NAME/.env" << ENVEOF
PORT=$PORT
DB_HOST=${SERVICE_NAME}-db
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=$DB_NAME

USER_SERVICE_URL=http://user-service:3001
PRODUCT_SERVICE_URL=http://product-service:3002

FRONTEND_URL=http://localhost:3000
ENVEOF

    # Create Dockerfile
    cat > "services/$SERVICE_NAME/Dockerfile" << 'DOCKEREOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE ${PORT}

CMD ["npm", "run", "start:prod"]
DOCKEREOF

    # Create JWT Auth Guard
    cat > "services/$SERVICE_NAME/src/guards/jwt-auth.guard.ts" << 'GUARDEOF'
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private httpService: HttpService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';
      const response = await firstValueFrom(
        this.httpService.get(`${userServiceUrl}/auth/validate`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      request.user = response.data.user;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
GUARDEOF

    echo "Created common files for $SERVICE_NAME"
}

# Create Order Service
create_common_files "order-service" 3004 "order_db"

# Create Wishlist Service
create_common_files "wishlist-service" 3005 "wishlist_db"

echo "All microservices structure created successfully!"
