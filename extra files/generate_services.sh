#!/bin/bash

# Script to generate all remaining microservice files

BASE_DIR="/home/claude/ecommerce-microservices"
cd $BASE_DIR

echo "🚀 Generating remaining microservice files..."

# ===== ORDER SERVICE =====
echo "📦 Creating Order Service..."

mkdir -p services/order-service/src/{dto,services,controllers}

# Order DTOs
cat > services/order-service/src/dto/order.dto.ts << 'EOF'
import { IsArray, IsString, IsNumber } from 'class-validator';

export interface OrderItemDto {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export class CreateOrderDto {
  @IsArray()
  items: OrderItemDto[];

  @IsNumber()
  totalAmount: number;

  @IsString()
  shippingAddress: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  zipCode: string;

  @IsString()
  phone: string;
}

export class UpdateOrderStatusDto {
  @IsString()
  status: string;
}
EOF

# Order Service
cat > services/order-service/src/services/order.service.ts << 'EOF'
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { CreateOrderDto, UpdateOrderStatusDto } from '../dto/order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async create(createOrderDto: CreateOrderDto, userId: string) {
    const order = this.orderRepository.create({
      ...createOrderDto,
      userId,
    });

    return this.orderRepository.save(order);
  }

  async findByUser(userId: string) {
    return this.orderRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findBySeller(sellerId: string) {
    return this.orderRepository
      .createQueryBuilder('order')
      .where('order.sellerId = :sellerId', { sellerId })
      .orderBy('order.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string) {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async updateStatus(id: string, updateStatusDto: UpdateOrderStatusDto, sellerId: string) {
    const order = await this.findOne(id);
    
    if (order.sellerId !== sellerId) {
      throw new Error('Unauthorized');
    }

    order.status = updateStatusDto.status as any;
    return this.orderRepository.save(order);
  }
}
EOF

# Order Controller
cat > services/order-service/src/controllers/order.controller.ts << 'EOF'
import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { OrderService } from '../services/order.service';
import { CreateOrderDto, UpdateOrderStatusDto } from '../dto/order.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto, @Req() req) {
    return this.orderService.create(createOrderDto, req.user.userId);
  }

  @Get()
  async findByUser(@Req() req) {
    return this.orderService.findByUser(req.user.userId);
  }

  @Get('seller')
  async findBySeller(@Req() req) {
    return this.orderService.findBySeller(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
    @Req() req,
  ) {
    return this.orderService.updateStatus(id, updateStatusDto, req.user.userId);
  }
}
EOF

# Order App Module
cat > services/order-service/src/app.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { Order } from './entities/order.entity';
import { OrderService } from './services/order.service';
import { OrderController } from './controllers/order.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_NAME', 'order_db'),
        entities: [Order],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Order]),
    HttpModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class AppModule {}
EOF

# Order Main
cat > services/order-service/src/main.ts << 'EOF'
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = process.env.PORT || 3004;
  await app.listen(port);
  console.log(`Order Service is running on port ${port}`);
}
bootstrap();
EOF

# Order package.json
cat > services/order-service/package.json << 'EOF'
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

# Copy config files
cp services/product-service/tsconfig.json services/order-service/
cp services/product-service/nest-cli.json services/order-service/
cp services/product-service/Dockerfile services/order-service/
cp services/product-service/src/guards/jwt-auth.guard.ts services/order-service/src/guards/
cp services/order-service/.env.example services/order-service/.env 2>/dev/null || echo "PORT=3004
DB_HOST=order-db
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=order_db
USER_SERVICE_URL=http://user-service:3001
PRODUCT_SERVICE_URL=http://product-service:3002
CART_SERVICE_URL=http://cart-service:3003
FRONTEND_URL=http://localhost:3000" > services/order-service/.env

sed -i 's/3002/3004/g' services/order-service/Dockerfile

echo "✅ Order Service created"

# ===== WISHLIST SERVICE =====
echo "❤️ Creating Wishlist Service..."

mkdir -p services/wishlist-service/src/{entities,dto,services,controllers,guards}

# Wishlist Entity
cat > services/wishlist-service/src/entities/wishlist.entity.ts << 'EOF'
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('wishlists')
export class Wishlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  productId: string;

  @CreateDateColumn()
  createdAt: Date;
}
EOF

# Wishlist DTOs
cat > services/wishlist-service/src/dto/wishlist.dto.ts << 'EOF'
import { IsString } from 'class-validator';

export class AddToWishlistDto {
  @IsString()
  productId: string;
}
EOF

# Wishlist Service
cat > services/wishlist-service/src/services/wishlist.service.ts << 'EOF'
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Wishlist } from '../entities/wishlist.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private wishlistRepository: Repository<Wishlist>,
    private httpService: HttpService,
  ) {}

  async getWishlist(userId: string) {
    const wishlistItems = await this.wishlistRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
    const productsWithDetails = await Promise.all(
      wishlistItems.map(async (item) => {
        try {
          const response = await firstValueFrom(
            this.httpService.get(`${productServiceUrl}/products/${item.productId}`),
          );
          return { ...item, product: response.data };
        } catch (error) {
          return { ...item, product: null };
        }
      }),
    );

    return productsWithDetails;
  }

  async addToWishlist(userId: string, productId: string) {
    const existing = await this.wishlistRepository.findOne({
      where: { userId, productId },
    });

    if (existing) {
      throw new ConflictException('Product already in wishlist');
    }

    const wishlistItem = this.wishlistRepository.create({
      userId,
      productId,
    });

    return this.wishlistRepository.save(wishlistItem);
  }

  async removeFromWishlist(userId: string, productId: string) {
    const item = await this.wishlistRepository.findOne({
      where: { userId, productId },
    });

    if (!item) {
      throw new NotFoundException('Item not found in wishlist');
    }

    await this.wishlistRepository.remove(item);
    return { message: 'Item removed from wishlist' };
  }
}
EOF

# Wishlist Controller
cat > services/wishlist-service/src/controllers/wishlist.controller.ts << 'EOF'
import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { WishlistService } from '../services/wishlist.service';
import { AddToWishlistDto } from '../dto/wishlist.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private wishlistService: WishlistService) {}

  @Get()
  async getWishlist(@Req() req) {
    return this.wishlistService.getWishlist(req.user.userId);
  }

  @Post('add')
  async addToWishlist(@Body() addToWishlistDto: AddToWishlistDto, @Req() req) {
    return this.wishlistService.addToWishlist(req.user.userId, addToWishlistDto.productId);
  }

  @Delete('remove/:productId')
  async removeFromWishlist(@Param('productId') productId: string, @Req() req) {
    return this.wishlistService.removeFromWishlist(req.user.userId, productId);
  }
}
EOF

# Wishlist App Module
cat > services/wishlist-service/src/app.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { Wishlist } from './entities/wishlist.entity';
import { WishlistService } from './services/wishlist.service';
import { WishlistController } from './controllers/wishlist.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_NAME', 'wishlist_db'),
        entities: [Wishlist],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Wishlist]),
    HttpModule,
  ],
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class AppModule {}
EOF

# Wishlist Main
cat > services/wishlist-service/src/main.ts << 'EOF'
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = process.env.PORT || 3005;
  await app.listen(port);
  console.log(`Wishlist Service is running on port ${port}`);
}
bootstrap();
EOF

# Wishlist package.json
cat > services/wishlist-service/package.json << 'EOF'
{
  "name": "wishlist-service",
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

cp services/product-service/tsconfig.json services/wishlist-service/
cp services/product-service/nest-cli.json services/wishlist-service/
cp services/product-service/Dockerfile services/wishlist-service/
cp services/product-service/src/guards/jwt-auth.guard.ts services/wishlist-service/src/guards/
echo "PORT=3005
DB_HOST=wishlist-db
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=wishlist_db
USER_SERVICE_URL=http://user-service:3001
PRODUCT_SERVICE_URL=http://product-service:3002
FRONTEND_URL=http://localhost:3000" > services/wishlist-service/.env

sed -i 's/3002/3005/g' services/wishlist-service/Dockerfile

echo "✅ Wishlist Service created"

echo "🎉 All microservices generated successfully!"
echo ""
echo "Next steps:"
echo "1. Run: chmod +x generate_services.sh"
echo "2. Review the generated services"
echo "3. Install dependencies: cd services/<service-name> && npm install"
echo "4. Start with Docker: docker-compose up --build"
