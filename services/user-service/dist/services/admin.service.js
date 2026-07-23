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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../entities/user.entity");
const activity_log_entity_1 = require("../entities/activity-log.entity");
const bcrypt = require("bcryptjs");
const email_service_1 = require("../modules/email/email.service");
const typeorm_3 = require("typeorm");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
let AdminService = class AdminService {
    constructor(userRepository, logRepository, emailService, httpService, configService) {
        this.userRepository = userRepository;
        this.logRepository = logRepository;
        this.emailService = emailService;
        this.httpService = httpService;
        this.configService = configService;
    }
    async getAllUsers() {
        return this.userRepository.find({
            order: { createdAt: 'DESC' },
            select: [
                'id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt',
                'profileImage', 'permissions', 'phone', 'address', 'city', 'state',
                'zipCode', 'country', 'storeName', 'storeAddress', 'storeType',
                'cnicNumber', 'sellerStatus', 'isDeleted', 'deletedBy'
            ],
        });
    }
    async updateUserStatus(userId, isActive, adminId, adminEmail) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.role === user_entity_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Cannot modify status of another primary admin');
        }
        user.isActive = isActive;
        if (isActive && user.isDeleted) {
            user.isDeleted = false;
            user.deletedBy = null;
        }
        await this.userRepository.save(user);
        await this.logActivity(adminId, adminEmail, isActive ? 'ACTIVATE_USER' : 'BLOCK_USER', userId, `User ${user.email} status changed to ${isActive}`);
        return { message: `User ${isActive ? 'activated' : 'blocked'} successfully` };
    }
    async deleteUser(userId, adminId, adminEmail) {
        if (userId === adminId)
            throw new common_1.ForbiddenException('Cannot delete yourself');
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.role === user_entity_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Cannot delete a primary super admin account');
        }
        user.isDeleted = true;
        user.isActive = false;
        user.deletedBy = adminEmail || 'Admin';
        await this.userRepository.save(user);
        await this.logActivity(adminId, adminEmail, 'DELETE_USER', userId, `Soft deleted user account ${user.email} by ${adminEmail}`);
        return { message: `User ${user.email} marked as deleted successfully`, user };
    }
    async getPendingSellers() {
        return this.userRepository.find({
            where: { role: user_entity_1.UserRole.SELLER, sellerStatus: user_entity_1.SellerStatus.PENDING },
            order: { createdAt: 'DESC' },
            select: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt', 'profileImage', 'phone', 'storeName', 'storeAddress', 'storeType', 'cnicNumber', 'cnicImage', 'sellerStatus'],
        });
    }
    async approveSeller(sellerId, adminId, adminEmail) {
        try {
            const user = await this.userRepository.findOne({ where: { id: sellerId, role: user_entity_1.UserRole.SELLER } });
            if (!user)
                throw new common_1.NotFoundException('Seller not found or does not have SELLER role');
            user.sellerStatus = user_entity_1.SellerStatus.APPROVED;
            user.rejectionReason = null;
            await this.userRepository.save(user);
            await this.logActivity(adminId, adminEmail, 'APPROVE_SELLER', sellerId, `Approved seller: ${user.email}`);
            this.emailService.sendSellerDecisionEmail(user.email, `${user.firstName} ${user.lastName}`, 'approved');
            return { message: 'Seller approved successfully', user };
        }
        catch (error) {
            throw new common_1.BadRequestException('Approval failed: ' + error.message);
        }
    }
    async rejectSeller(sellerId, reason, adminId, adminEmail) {
        const user = await this.userRepository.findOne({ where: { id: sellerId, role: user_entity_1.UserRole.SELLER } });
        if (!user)
            throw new common_1.NotFoundException('Seller not found');
        user.sellerStatus = user_entity_1.SellerStatus.REJECTED;
        user.rejectionReason = reason;
        await this.userRepository.save(user);
        await this.logActivity(adminId, adminEmail, 'REJECT_SELLER', sellerId, `Rejected seller: ${user.email}. Reason: ${reason}`);
        this.emailService.sendSellerDecisionEmail(user.email, `${user.firstName} ${user.lastName}`, 'rejected', reason);
        return { message: 'Seller rejected successfully', user };
    }
    async createSubAdmin(data, adminId, adminEmail) {
        const existing = await this.userRepository.findOne({ where: { email: data.email } });
        if (existing)
            throw new common_1.ForbiddenException('Email already in use');
        if (data.phone) {
            const existingPhone = await this.userRepository.findOne({ where: { phone: data.phone } });
            if (existingPhone)
                throw new common_1.BadRequestException('Phone number already in use');
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const subAdmin = this.userRepository.create({
            ...data,
            password: hashedPassword,
            role: user_entity_1.UserRole.SUB_ADMIN,
            isActive: true,
            profileImage: `https://ui-avatars.com/api/?name=${data.firstName}+${data.lastName}&background=6366f1&color=fff`,
        });
        await this.userRepository.save(subAdmin);
        await this.logActivity(adminId, adminEmail, 'CREATE_SUB_ADMIN', subAdmin.id, `Created sub-admin: ${data.email}`);
        this.emailService.sendSubAdminWelcomeEmail(subAdmin.email, `${subAdmin.firstName} ${subAdmin.lastName}`.trim(), data.password, subAdmin.permissions || []);
        return subAdmin;
    }
    async updateSubAdmin(id, data, adminId, adminEmail) {
        const subAdmin = await this.userRepository.findOne({ where: { id, role: user_entity_1.UserRole.SUB_ADMIN } });
        if (!subAdmin)
            throw new common_1.NotFoundException('Sub-Admin not found');
        if (data.email && data.email !== subAdmin.email) {
            const existing = await this.userRepository.findOne({ where: { email: data.email, id: (0, typeorm_2.Not)(id) } });
            if (existing)
                throw new common_1.ForbiddenException('Email already in use');
        }
        if (data.phone && data.phone !== subAdmin.phone) {
            const existingPhone = await this.userRepository.findOne({ where: { phone: data.phone, id: (0, typeorm_2.Not)(id) } });
            if (existingPhone)
                throw new common_1.BadRequestException('Phone number already in use');
        }
        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }
        else {
            delete data.password;
        }
        Object.assign(subAdmin, data);
        await this.userRepository.save(subAdmin);
        await this.logActivity(adminId, adminEmail, 'UPDATE_SUB_ADMIN', id, `Updated sub-admin: ${subAdmin.email}`);
        return subAdmin;
    }
    async deleteSubAdmin(id, adminId, adminEmail) {
        if (id === adminId)
            throw new common_1.ForbiddenException('Cannot delete yourself');
        const subAdmin = await this.userRepository.findOne({ where: { id, role: user_entity_1.UserRole.SUB_ADMIN } });
        if (!subAdmin)
            throw new common_1.NotFoundException('Sub-Admin not found');
        const email = subAdmin.email;
        await this.userRepository.remove(subAdmin);
        await this.logActivity(adminId, adminEmail, 'DELETE_SUB_ADMIN', id, `Deleted sub-admin: ${email}`);
        return { message: 'Sub-Admin deleted successfully' };
    }
    async getRecentActivity() {
        return this.logRepository.find({
            order: { timestamp: 'DESC' },
            take: 50,
        });
    }
    async sendPromotionalEmail(data, adminId, adminEmail) {
        let users = [];
        if (data.target === 'all') {
            users = await this.userRepository.find({ select: ['email'] });
        }
        else if (data.target === 'buyers') {
            users = await this.userRepository.find({ where: { role: user_entity_1.UserRole.BUYER }, select: ['email'] });
        }
        else if (data.target === 'sellers') {
            users = await this.userRepository.find({ where: { role: user_entity_1.UserRole.SELLER }, select: ['email'] });
        }
        else {
            users = [{ email: data.target }];
        }
        const emailList = users.map(u => u.email).filter(e => !!e);
        if (emailList.length === 0) {
            throw new common_1.BadRequestException('No recipients found for the selected target.');
        }
        await this.emailService.sendPromotionalCampaign(emailList, data.subject, data.message);
        await this.logActivity(adminId, adminEmail, 'SEND_PROMOTIONAL_EMAIL', 'MULTIPLE', `Sent campaign "${data.subject}" to ${emailList.length} recipients`);
        return { message: `Campaign sent successfully to ${emailList.length} recipients` };
    }
    async getSellerBuyersDetails(sellerId, token) {
        const orderServiceUrl = this.configService.get('ORDER_SERVICE_URL', 'http://localhost:3004');
        try {
            const buyersRes = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${orderServiceUrl}/orders/seller/buyers`, {
                headers: { Authorization: token }
            }));
            const buyerIds = buyersRes.data;
            if (!buyerIds || buyerIds.length === 0) {
                return [];
            }
            const users = await this.userRepository.find({
                where: { id: (0, typeorm_3.In)(buyerIds) },
                select: ['id', 'firstName', 'lastName', 'email', 'profileImage', 'createdAt']
            });
            return users;
        }
        catch (error) {
            console.error('Failed to get seller buyers details:', error.response?.data || error.message);
            throw new common_1.BadRequestException('Failed to fetch loyal customers.');
        }
    }
    async sendSellerPromotionalEmail(data, sellerId, sellerEmail, token) {
        const orderServiceUrl = this.configService.get('ORDER_SERVICE_URL', 'http://localhost:3004');
        try {
            const buyersRes = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${orderServiceUrl}/orders/seller/buyers`, {
                headers: { Authorization: token }
            }));
            const buyerIds = buyersRes.data;
            if (!buyerIds || buyerIds.length === 0) {
                throw new common_1.BadRequestException('No buyers found who have purchased from your store.');
            }
            const users = await this.userRepository.find({
                where: { id: (0, typeorm_3.In)(buyerIds) },
                select: ['email']
            });
            const emailList = users.map(u => u.email).filter(e => !!e);
            if (emailList.length === 0) {
                throw new common_1.BadRequestException('No valid email addresses found for your customers.');
            }
            await this.emailService.sendPromotionalCampaign(emailList, data.subject, data.message);
            await this.logActivity(sellerId, sellerEmail, 'SEND_SELLER_PROMOTION', 'MULTIPLE', `Seller sent campaign "${data.subject}" to ${emailList.length} customers`);
            return { message: `Campaign sent successfully to ${emailList.length} customers` };
        }
        catch (error) {
            console.error('Failed to send seller promotion:', error.response?.data || error.message);
            throw new common_1.BadRequestException(error.response?.data?.message || 'Failed to send promotional campaign to your customers.');
        }
    }
    async resetUserPassword(userId, customPassword, adminId, adminEmail) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.role === user_entity_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Cannot reset password of another primary admin');
        }
        const passwordToUse = (customPassword && customPassword.trim().length > 0)
            ? customPassword.trim()
            : Math.random().toString(36).slice(-8) + Math.floor(1000 + Math.random() * 9000).toString();
        const hashedPassword = await bcrypt.hash(passwordToUse, 10);
        user.password = hashedPassword;
        user.mustChangePassword = true;
        await this.userRepository.save(user);
        await this.emailService.sendTemporaryPasswordEmail(user.email, `${user.firstName} ${user.lastName}`.trim(), passwordToUse);
        await this.logActivity(adminId, adminEmail, 'RESET_USER_PASSWORD', userId, `Admin reset password for user ${user.email}`);
        return { message: 'Password reset successfully. An email has been sent with the password.' };
    }
    async getTechnicalLogs() {
        try {
            const lokiUrl = 'http://loki:3100/loki/api/v1/query_range';
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(lokiUrl, {
                params: {
                    query: '{service=~".+"}',
                    limit: 100,
                },
            }));
            const logs = [];
            const streams = response.data?.data?.result || [];
            for (const streamObj of streams) {
                const service = streamObj.stream?.service || streamObj.stream?.container || 'microservice';
                const values = streamObj.values || [];
                for (const [nanoTs, message] of values) {
                    const timestampMs = Math.floor(parseInt(nanoTs, 10) / 1000000);
                    const dateObj = new Date(timestampMs);
                    let type = 'info';
                    if (message.match(/error|fail|exception/i)) {
                        type = 'error';
                    }
                    else if (message.match(/warn/i)) {
                        type = 'warn';
                    }
                    logs.push({
                        id: nanoTs,
                        type,
                        service,
                        msg: message.trim(),
                        time: dateObj.toLocaleTimeString(),
                        timestamp: dateObj.toISOString(),
                    });
                }
            }
            logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            return logs.slice(0, 100);
        }
        catch (error) {
            console.error('Failed to fetch technical logs from Loki:', error?.message);
            return [
                { id: '1', type: 'info', service: 'API Gateway', msg: 'System monitoring streaming live', time: new Date().toLocaleTimeString(), timestamp: new Date().toISOString() }
            ];
        }
    }
    async logActivity(userId, userEmail, action, targetId, details) {
        const log = this.logRepository.create({
            userId,
            userEmail,
            action,
            targetId,
            details,
        });
        await this.logRepository.save(log);
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(activity_log_entity_1.ActivityLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        email_service_1.EmailService,
        axios_1.HttpService,
        config_1.ConfigService])
], AdminService);
//# sourceMappingURL=admin.service.js.map