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
exports.FaqController = void 0;
const common_1 = require("@nestjs/common");
const faq_service_1 = require("../services/faq.service");
const faq_dto_1 = require("../dto/faq.dto");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const roles_guard_1 = require("../guards/roles.guard");
const roles_decorator_1 = require("../decorators/roles.decorator");
let FaqController = class FaqController {
    constructor(faqService) {
        this.faqService = faqService;
    }
    async getActiveFaqs(category) {
        return this.faqService.findAllActive(category);
    }
    async getAllFaqs(req) {
        if (req.user.role === 'sub_admin' && !req.user.permissions?.includes('MANAGE_SUPPORT')) {
            throw new common_1.ForbiddenException('You do not have permission to manage FAQs');
        }
        return this.faqService.findAll();
    }
    async createFaq(createFaqDto, req) {
        if (req.user.role === 'sub_admin' && !req.user.permissions?.includes('MANAGE_SUPPORT')) {
            throw new common_1.ForbiddenException('You do not have permission to manage FAQs');
        }
        return this.faqService.create(createFaqDto);
    }
    async updateFaq(id, updateFaqDto, req) {
        if (req.user.role === 'sub_admin' && !req.user.permissions?.includes('MANAGE_SUPPORT')) {
            throw new common_1.ForbiddenException('You do not have permission to manage FAQs');
        }
        return this.faqService.update(id, updateFaqDto);
    }
    async deleteFaq(id, req) {
        if (req.user.role === 'sub_admin' && !req.user.permissions?.includes('MANAGE_SUPPORT')) {
            throw new common_1.ForbiddenException('You do not have permission to manage FAQs');
        }
        await this.faqService.remove(id);
        return { message: 'FAQ deleted successfully' };
    }
};
exports.FaqController = FaqController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FaqController.prototype, "getActiveFaqs", null);
__decorate([
    (0, common_1.Get)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'sub_admin'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FaqController.prototype, "getAllFaqs", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'sub_admin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [faq_dto_1.CreateFaqDto, Object]),
    __metadata("design:returntype", Promise)
], FaqController.prototype, "createFaq", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'sub_admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, faq_dto_1.UpdateFaqDto, Object]),
    __metadata("design:returntype", Promise)
], FaqController.prototype, "updateFaq", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'sub_admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FaqController.prototype, "deleteFaq", null);
exports.FaqController = FaqController = __decorate([
    (0, common_1.Controller)('support/faqs'),
    __metadata("design:paramtypes", [faq_service_1.FaqService])
], FaqController);
//# sourceMappingURL=faq.controller.js.map