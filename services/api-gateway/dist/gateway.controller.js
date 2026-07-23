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
exports.GatewayController = void 0;
const common_1 = require("@nestjs/common");
const proxy_service_1 = require("./proxy.service");
let GatewayController = class GatewayController {
    constructor(proxyService) {
        this.proxyService = proxyService;
    }
    async proxyAuth(req, res) {
        return this.proxy('user', req, res);
    }
    async proxyUsers(req, res) {
        return this.proxy('user', req, res);
    }
    async proxyProducts(req, res) {
        return this.proxy('product', req, res);
    }
    async proxyReviews(req, res) {
        return this.proxy('product', req, res);
    }
    async proxyCart(req, res) {
        return this.proxy('cart', req, res);
    }
    async proxyOrders(req, res) {
        return this.proxy('order', req, res);
    }
    async proxyWishlist(req, res) {
        return this.proxy('wishlist', req, res);
    }
    async proxySupport(req, res) {
        return this.proxy('support', req, res);
    }
    async proxyAdmin(req, res) {
        return this.proxy('user', req, res);
    }
    async proxyPromotions(req, res) {
        return this.proxy('order', req, res);
    }
    async proxy(service, req, res) {
        try {
            const rawUrl = req.originalUrl || req.url;
            const path = rawUrl.replace(/^\/api\//, '').replace(/^\//, '');
            console.log(`[GatewayController] Proxying ${req.method} ${rawUrl} -> service: ${service}, path: ${path}`);
            const result = await this.proxyService.proxyRequest(service, path, req.method, req.body, req.headers);
            if (result.status === 302 && result.headers.location) {
                return res.redirect(result.status, result.headers.location);
            }
            return res.status(result.status).json(result.data);
        }
        catch (error) {
            const status = error.statusCode || common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            return res.status(status).json({
                statusCode: status,
                message: error.message || 'Internal server error',
                error: error.error || 'Error',
            });
        }
    }
};
exports.GatewayController = GatewayController;
__decorate([
    (0, common_1.All)('auth*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GatewayController.prototype, "proxyAuth", null);
__decorate([
    (0, common_1.All)('users*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GatewayController.prototype, "proxyUsers", null);
__decorate([
    (0, common_1.All)('products*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GatewayController.prototype, "proxyProducts", null);
__decorate([
    (0, common_1.All)('reviews*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GatewayController.prototype, "proxyReviews", null);
__decorate([
    (0, common_1.All)('cart*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GatewayController.prototype, "proxyCart", null);
__decorate([
    (0, common_1.All)('orders*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GatewayController.prototype, "proxyOrders", null);
__decorate([
    (0, common_1.All)('wishlist*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GatewayController.prototype, "proxyWishlist", null);
__decorate([
    (0, common_1.All)('support*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GatewayController.prototype, "proxySupport", null);
__decorate([
    (0, common_1.All)('admin*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GatewayController.prototype, "proxyAdmin", null);
__decorate([
    (0, common_1.All)('promotions*'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GatewayController.prototype, "proxyPromotions", null);
exports.GatewayController = GatewayController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [proxy_service_1.ProxyService])
], GatewayController);
//# sourceMappingURL=gateway.controller.js.map