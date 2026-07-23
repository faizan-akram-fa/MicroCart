"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const faq_entity_1 = require("./entities/faq.entity");
const ticket_entity_1 = require("./entities/ticket.entity");
const ticket_message_entity_1 = require("./entities/ticket-message.entity");
const faq_service_1 = require("./services/faq.service");
const ticket_service_1 = require("./services/ticket.service");
const faq_controller_1 = require("./controllers/faq.controller");
const ticket_controller_1 = require("./controllers/ticket.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    type: 'postgres',
                    host: configService.get('DB_HOST', 'localhost'),
                    port: configService.get('DB_PORT', 5432),
                    username: configService.get('DB_USERNAME', 'postgres'),
                    password: configService.get('DB_PASSWORD', 'postgres'),
                    database: configService.get('DB_NAME', 'support_db'),
                    entities: [faq_entity_1.FAQ, ticket_entity_1.Ticket, ticket_message_entity_1.TicketMessage],
                    synchronize: true,
                }),
                inject: [config_1.ConfigService],
            }),
            typeorm_1.TypeOrmModule.forFeature([faq_entity_1.FAQ, ticket_entity_1.Ticket, ticket_message_entity_1.TicketMessage]),
            axios_1.HttpModule,
        ],
        controllers: [faq_controller_1.FaqController, ticket_controller_1.TicketController],
        providers: [faq_service_1.FaqService, ticket_service_1.TicketService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map