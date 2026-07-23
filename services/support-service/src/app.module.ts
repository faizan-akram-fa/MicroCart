import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { FAQ } from './entities/faq.entity';
import { Ticket } from './entities/ticket.entity';
import { TicketMessage } from './entities/ticket-message.entity';
import { FaqService } from './services/faq.service';
import { TicketService } from './services/ticket.service';
import { FaqController } from './controllers/faq.controller';
import { TicketController } from './controllers/ticket.controller';

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
        database: configService.get('DB_NAME', 'support_db'),
        entities: [FAQ, Ticket, TicketMessage],
        synchronize: true, // synchronize schemas in development
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([FAQ, Ticket, TicketMessage]),
    HttpModule,
  ],
  controllers: [FaqController, TicketController],
  providers: [FaqService, TicketService],
})
export class AppModule {}
