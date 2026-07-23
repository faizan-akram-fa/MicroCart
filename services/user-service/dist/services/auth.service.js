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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const user_entity_1 = require("../entities/user.entity");
const activity_log_entity_1 = require("../entities/activity-log.entity");
const email_service_1 = require("../modules/email/email.service");
let AuthService = class AuthService {
    constructor(userRepository, logRepository, jwtService, emailService) {
        this.userRepository = userRepository;
        this.logRepository = logRepository;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }
    async logActivity(userId, userEmail, action, targetId, details) {
        try {
            const log = this.logRepository.create({
                userId,
                userEmail,
                action,
                targetId,
                details,
            });
            await this.logRepository.save(log);
        }
        catch (e) {
            console.error('Failed to save activity log:', e);
        }
    }
    async onModuleInit() {
        await this.seedAdmin();
    }
    async seedAdmin() {
        const adminEmail = 'admin@microcart.com';
        const existingAdmin = await this.userRepository.findOne({ where: { email: adminEmail } });
        if (!existingAdmin) {
            console.log('Seeding primary admin user...');
            const hashedPassword = await bcrypt.hash('Admin123!', 10);
            const admin = this.userRepository.create({
                email: adminEmail,
                password: hashedPassword,
                firstName: 'Primary',
                lastName: 'Admin',
                role: user_entity_1.UserRole.ADMIN,
                isActive: true,
                profileImage: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff',
            });
            await this.userRepository.save(admin);
            console.log('✅ Primary admin seeded successfully.');
        }
    }
    async register(registerDto) {
        const existingUser = await this.userRepository.findOne({
            where: { email: registerDto.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email already exists');
        }
        if (registerDto.phone) {
            const existingPhone = await this.userRepository.findOne({
                where: { phone: registerDto.phone },
            });
            if (existingPhone) {
                throw new common_1.ConflictException('Phone number already exists');
            }
        }
        if (registerDto.cnicNumber) {
            const existingCnic = await this.userRepository.findOne({
                where: { cnicNumber: registerDto.cnicNumber },
            });
            if (existingCnic) {
                throw new common_1.ConflictException('CNIC already registered with another user');
            }
        }
        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        const roleValue = registerDto.role || user_entity_1.UserRole.PENDING;
        const user = this.userRepository.create({
            ...registerDto,
            role: roleValue,
            password: hashedPassword,
            profileImage: `https://ui-avatars.com/api/?name=${registerDto.firstName}+${registerDto.lastName}&background=random&color=fff`,
            ...(roleValue === user_entity_1.UserRole.SELLER && { sellerStatus: user_entity_1.SellerStatus.PENDING }),
        });
        await this.userRepository.save(user);
        await this.logActivity(user.id, user.email, 'USER_REGISTER', user.id, `New ${user.role} account registered: ${user.email}`);
        this.emailService.sendWelcomeEmail(user.email, `${user.firstName} ${user.lastName}`);
        if (user.role === user_entity_1.UserRole.BUYER) {
            this.emailService.sendBuyerWelcomeEmail(user.email, user.firstName);
        }
        else if (user.role === user_entity_1.UserRole.SELLER) {
            this.emailService.sendSellerWelcomeEmail(user.email, user.firstName);
        }
        const payload = { sub: user.id, email: user.email, role: user.role, permissions: user.permissions || [] };
        const token = this.jwtService.sign(payload);
        return {
            access_token: token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                phone: user.phone,
                profileImage: user.profileImage,
                storeName: user.storeName,
                storeAddress: user.storeAddress,
                storeType: user.storeType,
                cnicNumber: user.cnicNumber,
                sellerStatus: user.sellerStatus,
                rejectionReason: user.rejectionReason,
                permissions: user.permissions || [],
                mustChangePassword: user.mustChangePassword,
            },
        };
    }
    async login(loginDto) {
        let user;
        if (loginDto.phone) {
            user = await this.userRepository.findOne({ where: { phone: loginDto.phone } });
        }
        else {
            user = await this.userRepository.findOne({ where: { email: loginDto.email } });
        }
        if (!user) {
            throw new common_1.UnauthorizedException('User does not exist');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Incorrect password');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Account deleted or blocked. Contact support');
        }
        const payload = { sub: user.id, email: user.email, role: user.role, permissions: user.permissions || [] };
        const token = this.jwtService.sign(payload);
        await this.logActivity(user.id, user.email, 'USER_LOGIN', user.id, `User ${user.email} (${user.role}) logged in successfully`);
        return {
            access_token: token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                profileImage: user.profileImage,
                phone: user.phone,
                address: user.address,
                city: user.city,
                state: user.state,
                zipCode: user.zipCode,
                country: user.country,
                storeName: user.storeName,
                storeAddress: user.storeAddress,
                storeType: user.storeType,
                cnicNumber: user.cnicNumber,
                sellerStatus: user.sellerStatus,
                rejectionReason: user.rejectionReason,
                permissions: user.permissions || [],
                mustChangePassword: user.mustChangePassword,
            },
        };
    }
    async validateUser(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Account deleted or blocked. Contact support');
        }
        return user;
    }
    async googleLogin(googleUser) {
        try {
            console.log('Google login attempt for:', googleUser.email);
            let user = await this.userRepository.findOne({
                where: { googleId: googleUser.id },
            });
            if (user) {
                console.log('User found by Google ID:', user.email);
                if (user.profileImage !== googleUser.picture) {
                    user.profileImage = googleUser.picture;
                    await this.userRepository.save(user);
                }
            }
            if (!user) {
                console.log('User not found by Google ID, searching by email...');
                user = await this.userRepository.findOne({
                    where: { email: googleUser.email },
                });
                if (user) {
                    console.log('User found by email, linking Google ID:', user.email);
                    user.googleId = googleUser.id;
                    await this.userRepository.save(user);
                }
                else {
                    console.log('Creating new user from Google profile:', googleUser.email);
                    const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
                    const hashedPassword = await bcrypt.hash(randomPassword, 10);
                    user = this.userRepository.create({
                        email: googleUser.email,
                        firstName: googleUser.firstName,
                        lastName: googleUser.lastName,
                        profileImage: googleUser.picture,
                        googleId: googleUser.id,
                        password: hashedPassword,
                        role: user_entity_1.UserRole.PENDING,
                        isActive: true,
                    });
                    await this.userRepository.save(user);
                    console.log('✅ New user created successfully');
                    this.emailService.sendWelcomeEmail(user.email, `${user.firstName} ${user.lastName}`);
                }
            }
            if (!user.isActive) {
                throw new common_1.UnauthorizedException('Account deleted or blocked. Contact support');
            }
            const payload = { sub: user.id, email: user.email, role: user.role, permissions: user.permissions || [] };
            const token = this.jwtService.sign(payload);
            return {
                access_token: token,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    profileImage: user.profileImage,
                    phone: user.phone,
                    address: user.address,
                    city: user.city,
                    state: user.state,
                    zipCode: user.zipCode,
                    country: user.country,
                    storeName: user.storeName,
                    storeAddress: user.storeAddress,
                    storeType: user.storeType,
                    cnicNumber: user.cnicNumber,
                    sellerStatus: user.sellerStatus,
                    rejectionReason: user.rejectionReason,
                    permissions: user.permissions || [],
                    mustChangePassword: user.mustChangePassword,
                },
            };
        }
        catch (error) {
            console.error('❌ Error in googleLogin:', error);
            throw error;
        }
    }
    async forgotPassword(forgotDto) {
        const user = await this.userRepository.findOne({ where: { email: forgotDto.email } });
        if (!user) {
            throw new common_1.NotFoundException('User with this email does not exist');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Account deleted or blocked. Contact support');
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 2 * 60 * 1000);
        await this.userRepository.save(user);
        await this.emailService.sendOtpEmail(user.email, `${user.firstName} ${user.lastName}`.trim(), otp);
        return { message: 'OTP verification code sent to email' };
    }
    async verifyOtp(email, otp) {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Account deleted or blocked. Contact support');
        }
        if (!user.otp || user.otp !== otp) {
            throw new common_1.BadRequestException('Invalid OTP');
        }
        if (user.otpExpiry && new Date() > user.otpExpiry) {
            throw new common_1.BadRequestException('OTP has expired');
        }
        user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
        await this.userRepository.save(user);
        return { valid: true };
    }
    async resetPassword(resetDto) {
        const user = await this.userRepository.findOne({ where: { email: resetDto.email } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Account deleted or blocked. Contact support');
        }
        if (!user.otp || user.otp !== resetDto.otp) {
            throw new common_1.BadRequestException('Invalid OTP');
        }
        if (user.otpExpiry && new Date() > user.otpExpiry) {
            user.otp = null;
            user.otpExpiry = null;
            await this.userRepository.save(user);
            throw new common_1.BadRequestException('OTP has expired');
        }
        const isSamePassword = await bcrypt.compare(resetDto.newPassword, user.password);
        if (isSamePassword) {
            throw new common_1.ConflictException('Old password cannot be used as new');
        }
        user.password = await bcrypt.hash(resetDto.newPassword, 10);
        user.otp = null;
        user.otpExpiry = null;
        await this.userRepository.save(user);
        return { message: 'Password reset successfully' };
    }
    async setRole(userId, role) {
        if (role !== user_entity_1.UserRole.BUYER && role !== user_entity_1.UserRole.SELLER) {
            throw new common_1.BadRequestException('Invalid role. Normal users can only choose Buyer or Seller.');
        }
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        user.role = role;
        if (user.role === user_entity_1.UserRole.SELLER) {
            user.sellerStatus = user_entity_1.SellerStatus.PENDING;
        }
        await this.userRepository.save(user);
        if (user.role === user_entity_1.UserRole.BUYER) {
            this.emailService.sendBuyerWelcomeEmail(user.email, user.firstName);
        }
        else if (user.role === user_entity_1.UserRole.SELLER) {
            this.emailService.sendSellerWelcomeEmail(user.email, user.firstName);
        }
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            permissions: user.permissions || []
        };
        const token = this.jwtService.sign(payload);
        return {
            message: 'Role updated successfully',
            user: {
                ...user,
                cnicNumber: user.cnicNumber
            },
            access_token: token
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(activity_log_entity_1.ActivityLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map