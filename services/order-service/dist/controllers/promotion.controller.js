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
exports.PromotionController = void 0;
const common_1 = require("@nestjs/common");
const promotion_service_1 = require("../services/promotion.service");
const promotion_dto_1 = require("../dto/promotion.dto");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
let PromotionController = class PromotionController {
    constructor(promotionService) {
        this.promotionService = promotionService;
    }
    async create(createDto, req) {
        const user = req.user;
        const role = user.role;
        if (role === 'sub_admin' && !user.permissions?.includes('MANAGE_PROMOTIONS')) {
            throw new common_1.ForbiddenException('You do not have permission to create promotions');
        }
        const isAdmin = role === 'admin' || role === 'sub_admin';
        return this.promotionService.create(createDto, user.userId, isAdmin);
    }
    async findAll(req) {
        const user = req.user;
        const role = user.role;
        if (role === 'sub_admin' && !user.permissions?.includes('MANAGE_PROMOTIONS')) {
            throw new common_1.ForbiddenException('You do not have permission to view promotions');
        }
        const isAdmin = role === 'admin' || role === 'sub_admin';
        return this.promotionService.findAll(user.userId, isAdmin);
    }
    async toggleStatus(id, req) {
        const user = req.user;
        const role = user.role;
        if (role === 'sub_admin' && !user.permissions?.includes('MANAGE_PROMOTIONS')) {
            throw new common_1.ForbiddenException('You do not have permission to toggle promotions');
        }
        const isAdmin = role === 'admin' || role === 'sub_admin';
        return this.promotionService.toggleStatus(id, user.userId, isAdmin);
    }
    async update(id, updateDto, req) {
        const user = req.user;
        const role = user.role;
        if (role === 'sub_admin' && !user.permissions?.includes('MANAGE_PROMOTIONS')) {
            throw new common_1.ForbiddenException('You do not have permission to edit promotions');
        }
        const isAdmin = role === 'admin' || role === 'sub_admin';
        return this.promotionService.update(id, updateDto, user.userId, isAdmin);
    }
    async validate(validateDto) {
        return this.promotionService.validate(validateDto);
    }
};
exports.PromotionController = PromotionController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [promotion_dto_1.CreatePromotionDto, Object]),
    __metadata("design:returntype", Promise)
], PromotionController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PromotionController.prototype, "findAll", null);
__decorate([
    (0, common_1.Put)(':id/toggle'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PromotionController.prototype, "toggleStatus", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], PromotionController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('validate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [promotion_dto_1.ValidatePromotionDto]),
    __metadata("design:returntype", Promise)
], PromotionController.prototype, "validate", null);
exports.PromotionController = PromotionController = __decorate([
    (0, common_1.Controller)('promotions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [promotion_service_1.PromotionService])
], PromotionController);
//# sourceMappingURL=promotion.controller.js.map