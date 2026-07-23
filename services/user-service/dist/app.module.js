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
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const user_entity_1 = require("./entities/user.entity");
const activity_log_entity_1 = require("./entities/activity-log.entity");
const auth_service_1 = require("./services/auth.service");
const user_service_1 = require("./services/user.service");
const admin_service_1 = require("./services/admin.service");
const auth_controller_1 = require("./controllers/auth.controller");
const user_controller_1 = require("./controllers/user.controller");
const admin_controller_1 = require("./controllers/admin.controller");
const internal_email_controller_1 = require("./controllers/internal-email.controller");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const google_strategy_1 = require("./strategies/google.strategy");
const email_module_1 = require("./modules/email/email.module");
const axios_1 = require("@nestjs/axios");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            email_module_1.EmailModule,
            axios_1.HttpModule,
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    type: 'postgres',
                    host: configService.get('DB_HOST', 'localhost'),
                    port: configService.get('DB_PORT', 5432),
                    username: configService.get('DB_USERNAME', 'postgres'),
                    password: configService.get('DB_PASSWORD', 'postgres'),
                    database: configService.get('DB_NAME', 'user_db'),
                    entities: [user_entity_1.User, activity_log_entity_1.ActivityLog],
                    synchronize: true,
                }),
                inject: [config_1.ConfigService],
            }),
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, activity_log_entity_1.ActivityLog]),
            passport_1.PassportModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    secret: configService.get('JWT_SECRET', 'your-secret-key-change-in-production'),
                    signOptions: { expiresIn: '24h' },
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        controllers: [auth_controller_1.AuthController, user_controller_1.UserController, admin_controller_1.AdminController, internal_email_controller_1.InternalEmailController],
        providers: [auth_service_1.AuthService, user_service_1.UserService, admin_service_1.AdminService, jwt_strategy_1.JwtStrategy, google_strategy_1.GoogleStrategy],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map