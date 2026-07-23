"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalEmailController = void 0;
const common_1 = require("@nestjs/common");
const email_service_1 = require("../modules/email/email.service");
const config_1 = require("@nestjs/config");
let InternalEmailController = class InternalEmailController {
    constructor(emailService, configService) {
        this.emailService = emailService;
        this.configService = configService;
    }
    validateSecret(secret) {
        const internalSecret = this.configService.get('INTERNAL_SERVICE_SECRET', 'microservices-secret-123');
        if (secret !== internalSecret) {
            throw new common_1.UnauthorizedException('Invalid internal service secret');
        }
    }
    async sendOrderConfirmation(secret, data) {
        this.validateSecret(secret);
        if (!data.email || !data.orderData)
            throw new common_1.BadRequestException('Missing required fields');
        return this.emailService.sendOrderConfirmation(data.email, data.name, data.orderData);
    }
    async sendOrderStatusUpdate(secret, data) {
        this.validateSecret(secret);
        if (!data.email || !data.orderId || !data.status)
            throw new common_1.BadRequestException('Missing required fields');
        return this.emailService.sendOrderStatusUpdate(data.email, data.name, data.orderId, data.status);
    }
    async sendLowStockAlert(secret, data) {
        this.validateSecret(secret);
        if (!data.email || !data.productData)
            throw new common_1.BadRequestException('Missing required fields');
        return this.emailService.sendLowStockAlert(data.email, data.name, data.productData);
    }
    async sendOutOfStockAlert(secret, data) {
        this.validateSecret(secret);
        if (!data.email || !data.productData)
            throw new common_1.BadRequestException('Missing required fields');
        return this.emailService.sendOutOfStockAlert(data.email, data.name, data.productData);
    }
};
exports.InternalEmailController = InternalEmailController;
__decorate([
    (0, common_1.Post)('order-confirmation'),
    __param(0, (0, common_1.Headers)('x-internal-secret')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InternalEmailController.prototype, "sendOrderConfirmation", null);
__decorate([
    (0, common_1.Post)('order-status-update'),
    __param(0, (0, common_1.Headers)('x-internal-secret')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InternalEmailController.prototype, "sendOrderStatusUpdate", null);
__decorate([
    (0, common_1.Post)('low-stock-alert'),
    __param(0, (0, common_1.Headers)('x-internal-secret')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InternalEmailController.prototype, "sendLowStockAlert", null);
__decorate([
    (0, common_1.Post)('out-of-stock-alert'),
    __param(0, (0, common_1.Headers)('x-internal-secret')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InternalEmailController.prototype, "sendOutOfStockAlert", null);
exports.InternalEmailController = InternalEmailController = __decorate([
    (0, common_1.Controller)('internal/email'),
    __metadata("design:paramtypes", [email_service_1.EmailService,
        config_1.ConfigService])
], InternalEmailController);
//# sourceMappingURL=internal-email.controller.js.map