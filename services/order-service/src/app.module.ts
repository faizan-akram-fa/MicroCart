import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { Order } from './entities/order.entity';
import { Promotion } from './entities/promotion.entity';
import { Transaction } from './entities/transaction.entity';
import { OrderService } from './services/order.service';
import { PromotionService } from './services/promotion.service';
import { OrderController } from './controllers/order.controller';
import { PromotionController } from './controllers/promotion.controller';

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
        entities: [Order, Promotion, Transaction],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Order, Promotion, Transaction]),
    HttpModule,
  ],
  controllers: [OrderController, PromotionController],
  providers: [OrderService, PromotionService],
})
export class AppModule {}
