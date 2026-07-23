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
exports.OrderInternalController = exports.OrderController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const order_service_1 = require("../services/order.service");
const order_dto_1 = require("../dto/order.dto");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
let OrderController = class OrderController {
    constructor(orderService, configService) {
        this.orderService = orderService;
        this.configService = configService;
    }
    async handleStripeWebhook(req, signature) {
        return this.orderService.handleStripeWebhook(req.rawBody, signature);
    }
    async create(createOrderDto, req) {
        return this.orderService.create(createOrderDto, req.user.userId);
    }
    async findByUser(req) {
        return this.orderService.findByUser(req.user.userId);
    }
    async findBySeller(req) {
        return this.orderService.findBySeller(req.user.userId);
    }
    async getSellerBuyers(req) {
        return this.orderService.getSellerBuyers(req.user.userId);
    }
    async findOneInternal(id, internalSecret) {
        const secret = this.configService.get('INTERNAL_SERVICE_SECRET', 'microservices-secret-123');
        if (internalSecret !== secret) {
            throw new common_1.ForbiddenException('Invalid internal secret');
        }
        return this.orderService.findOne(id);
    }
    async findOne(id) {
        return this.orderService.findOne(id);
    }
    async updateStatus(id, updateStatusDto, req) {
        return this.orderService.updateStatus(id, updateStatusDto, req.user.userId);
    }
    async cancelPayment(id, req) {
        return this.orderService.cancelPayment(id, req.user.userId);
    }
    async confirmWalletPayment(id, transactionReference, req) {
        return this.orderService.confirmWalletPayment(id, req.user.userId, transactionReference);
    }
    async getAdminStats(req, period) {
        if (req.user.role !== 'admin' && req.user.role !== 'sub_admin') {
            throw new common_1.ForbiddenException('Forbidden: Admin access only');
        }
        return this.orderService.getAdminStats(period);
    }
    async findAllAdmin(req) {
        if (req.user.role !== 'admin' && req.user.role !== 'sub_admin') {
            throw new common_1.ForbiddenException('Forbidden: Admin access only');
        }
        return this.orderService.findAll();
    }
    async getAllTransactions(req) {
        if (req.user.role !== 'admin' && req.user.role !== 'sub_admin') {
            throw new common_1.ForbiddenException('Forbidden: Admin access only');
        }
        return this.orderService.getAllTransactions();
    }
};
exports.OrderController = OrderController;
__decorate([
    (0, common_1.Post)('stripe-webhook'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('stripe-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "handleStripeWebhook", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [order_dto_1.CreateOrderDto, Object]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "findByUser", null);
__decorate([
    (0, common_1.Get)('seller'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "findBySeller", null);
__decorate([
    (0, common_1.Get)('seller/buyers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "getSellerBuyers", null);
__decorate([
    (0, common_1.Get)('internal/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('x-internal-secret')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "findOneInternal", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, order_dto_1.UpdateOrderStatusDto, Object]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Put)(':id/cancel-payment'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "cancelPayment", null);
__decorate([
    (0, common_1.Post)(':id/confirm-payment'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('transactionReference')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "confirmWalletPayment", null);
__decorate([
    (0, common_1.Get)('admin/stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "getAdminStats", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "findAllAdmin", null);
__decorate([
    (0, common_1.Get)('admin/transactions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "getAllTransactions", null);
exports.OrderController = OrderController = __decorate([
    (0, common_1.Controller)('orders'),
    __metadata("design:paramtypes", [order_service_1.OrderService,
        config_1.ConfigService])
], OrderController);
let OrderInternalController = class OrderInternalController {
    constructor(orderService, configService) {
        this.orderService = orderService;
        this.configService = configService;
    }
    async verifyPurchase(userId, productId, req) {
        const secret = req.headers['x-internal-secret'];
        const expected = this.configService.get('INTERNAL_SERVICE_SECRET', 'microservices-secret-123');
        if (secret !== expected) {
            throw new common_1.ForbiddenException('Unauthorized internal access');
        }
        const purchased = await this.orderService.verifyPurchase(userId, productId);
        return { purchased };
    }
};
exports.OrderInternalController = OrderInternalController;
__decorate([
    (0, common_1.Get)('verify-purchase/:userId/:productId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Param)('productId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], OrderInternalController.prototype, "verifyPurchase", null);
exports.OrderInternalController = OrderInternalController = __decorate([
    (0, common_1.Controller)('orders/internal'),
    __metadata("design:paramtypes", [order_service_1.OrderService,
        config_1.ConfigService])
], OrderInternalController);
//# sourceMappingURL=order.controller.js.map