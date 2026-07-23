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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("../services/admin.service");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const roles_guard_1 = require("../guards/roles.guard");
const roles_decorator_1 = require("../decorators/roles.decorator");
const user_entity_1 = require("../entities/user.entity");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    async getAllUsers(req) {
        return this.adminService.getAllUsers();
    }
    async getPendingSellers(req) {
        return this.adminService.getPendingSellers();
    }
    async approveSeller(id, req) {
        console.log(`[AdminController] Attempting to approve seller ID: ${id}`);
        console.log(`[AdminController] Admin requesting approval: ID=${req?.user?.userId}, Email=${req?.user?.email}`);
        if (req.user.role === user_entity_1.UserRole.SUB_ADMIN && !req.user.permissions?.includes('MANAGE_SELLERS')) {
            throw new common_1.ForbiddenException('You do not have permission to modify sellers');
        }
        try {
            return await this.adminService.approveSeller(id, req.user.userId, req.user.email);
        }
        catch (e) {
            console.error(`[AdminController] Error inside approveSeller:`, e);
            throw new common_1.BadRequestException(e.message || 'Unknown error');
        }
    }
    async rejectSeller(id, reason, req) {
        if (req.user.role === user_entity_1.UserRole.SUB_ADMIN && !req.user.permissions?.includes('MANAGE_SELLERS')) {
            throw new common_1.ForbiddenException('You do not have permission to modify sellers');
        }
        return this.adminService.rejectSeller(id, reason, req.user.userId, req.user.email);
    }
    async updateUserStatus(id, isActive, req) {
        if (req.user.role === user_entity_1.UserRole.SUB_ADMIN && !req.user.permissions?.includes('MANAGE_USERS')) {
            throw new common_1.ForbiddenException('You do not have permission to modify users');
        }
        return this.adminService.updateUserStatus(id, isActive, req.user.userId, req.user.email);
    }
    async deleteUser(id, req) {
        if (req.user.role !== user_entity_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only primary super admin can delete user accounts');
        }
        return this.adminService.deleteUser(id, req.user.userId, req.user.email);
    }
    async createSubAdmin(data, req) {
        return this.adminService.createSubAdmin(data, req.user.userId, req.user.email);
    }
    async updateSubAdmin(id, data, req) {
        return this.adminService.updateSubAdmin(id, data, req.user.userId, req.user.email);
    }
    async deleteSubAdmin(id, req) {
        return this.adminService.deleteSubAdmin(id, req.user.userId, req.user.email);
    }
    async getActivityLogs(req) {
        return this.adminService.getRecentActivity();
    }
    async sendPromotionalEmail(data, req) {
        if (req.user.role === user_entity_1.UserRole.SUB_ADMIN && !req.user.permissions?.includes('SEND_COMMUNICATIONS')) {
            throw new common_1.ForbiddenException('You do not have permission to send communications');
        }
        return this.adminService.sendPromotionalEmail(data, req.user.userId, req.user.email);
    }
    async sendSellerPromotionalEmail(data, req) {
        const token = req.headers.authorization;
        return this.adminService.sendSellerPromotionalEmail(data, req.user.userId, req.user.email, token);
    }
    async getSellerBuyers(req) {
        const token = req.headers.authorization;
        return this.adminService.getSellerBuyersDetails(req.user.userId, token);
    }
    async resetUserPassword(id, password, req) {
        if (req.user.role === user_entity_1.UserRole.SUB_ADMIN && !req.user.permissions?.includes('MANAGE_USERS')) {
            throw new common_1.ForbiddenException('You do not have permission to modify users');
        }
        return this.adminService.resetUserPassword(id, password, req.user.userId, req.user.email);
    }
    async getTechnicalLogs() {
        return this.adminService.getTechnicalLogs();
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('users'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.SUB_ADMIN),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Get)('sellers/pending'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.SUB_ADMIN),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPendingSellers", null);
__decorate([
    (0, common_1.Put)('sellers/:id/approve'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.SUB_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveSeller", null);
__decorate([
    (0, common_1.Put)('sellers/:id/reject'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.SUB_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectSeller", null);
__decorate([
    (0, common_1.Put)('users/:id/status'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.SUB_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('isActive')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUserStatus", null);
__decorate([
    (0, common_1.Delete)('users/:id'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Post)('sub-admins'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createSubAdmin", null);
__decorate([
    (0, common_1.Put)('sub-admins/:id'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateSubAdmin", null);
__decorate([
    (0, common_1.Delete)('sub-admins/:id'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteSubAdmin", null);
__decorate([
    (0, common_1.Get)('logs/activity'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.SUB_ADMIN),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getActivityLogs", null);
__decorate([
    (0, common_1.Post)('communications/send'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.SUB_ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "sendPromotionalEmail", null);
__decorate([
    (0, common_1.Post)('seller/communications/send'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SELLER),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "sendSellerPromotionalEmail", null);
__decorate([
    (0, common_1.Get)('seller/buyers'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SELLER),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSellerBuyers", null);
__decorate([
    (0, common_1.Post)('users/:id/reset-password'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.SUB_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('password')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "resetUserPassword", null);
__decorate([
    (0, common_1.Get)('logs/technical'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.SUB_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTechnicalLogs", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map