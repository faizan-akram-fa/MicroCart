import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { Product } from './entities/product.entity';
import { Review } from './entities/review.entity';
import { ProductService } from './services/product.service';
import { ReviewService } from './services/review.service';
import { ProductController } from './controllers/product.controller';
import { ReviewController } from './controllers/review.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_NAME', 'product_db'),
        entities: [Product, Review],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Product, Review]),
    HttpModule,
  ],
  controllers: [ProductController, ReviewController],
  providers: [ProductService, ReviewService],
})
export class AppModule {}
