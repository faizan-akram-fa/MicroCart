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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcryptjs");
const user_entity_1 = require("../entities/user.entity");
let UserService = class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async getProfile(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async updateProfile(userId, updateProfileDto) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (updateProfileDto.phone) {
            const existingPhone = await this.userRepository.findOne({
                where: { phone: updateProfileDto.phone },
            });
            if (existingPhone && existingPhone.id !== userId) {
                throw new common_1.ConflictException('Phone number already in use');
            }
        }
        if (updateProfileDto.cnicNumber) {
            const existingCnic = await this.userRepository.findOne({
                where: { cnicNumber: updateProfileDto.cnicNumber },
            });
            if (existingCnic && existingCnic.id !== userId) {
                throw new common_1.ConflictException('CNIC already registered with another user');
            }
        }
        Object.assign(user, updateProfileDto);
        await this.userRepository.save(user);
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async getUserById(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async changePassword(userId, changePasswordDto) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const isValid = await bcrypt.compare(changePasswordDto.oldPassword, user.password);
        if (!isValid) {
            throw new common_1.BadRequestException('Invalid old password');
        }
        const isSamePassword = await bcrypt.compare(changePasswordDto.newPassword, user.password);
        if (isSamePassword) {
            throw new common_1.BadRequestException('New password cannot be the same as the old password');
        }
        user.password = await bcrypt.hash(changePasswordDto.newPassword, 10);
        user.mustChangePassword = false;
        await this.userRepository.save(user);
        return { message: 'Password updated successfully' };
    }
    async updateProfileImage(userId, imageUrl) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        user.profileImage = imageUrl;
        await this.userRepository.save(user);
        return {
            message: 'Profile image updated successfully',
            imageUrl
        };
    }
    async updateCnicImage(userId, imageUrl) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        user.cnicImage = imageUrl;
        await this.userRepository.save(user);
        return {
            message: 'CNIC image updated successfully',
            imageUrl
        };
    }
    async resubmitSeller(userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.role !== 'seller') {
            throw new common_1.BadRequestException('User is not a seller');
        }
        user.sellerStatus = 'pending';
        user.rejectionReason = null;
        await this.userRepository.save(user);
        const { password, ...userWithoutPassword } = user;
        return {
            message: 'Seller application resubmitted successfully',
            user: userWithoutPassword
        };
    }
    async deleteAccount(userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        user.isActive = false;
        await this.userRepository.save(user);
        return { message: 'Account deleted successfully' };
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UserService);
//# sourceMappingURL=user.service.js.map