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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const auth_service_1 = require("../services/auth.service");
const user_dto_1 = require("../dto/user.dto");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const google_auth_guard_1 = require("../guards/google-auth.guard");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async register(registerDto, file) {
        if (registerDto.role === 'seller' && !file) {
            throw new common_1.BadRequestException('CNIC Image/PDF is required for sellers');
        }
        if (file) {
            registerDto.cnicImage = file.path;
        }
        return this.authService.register(registerDto);
    }
    async login(loginDto) {
        return this.authService.login(loginDto);
    }
    async testError() {
        console.error('🚨 TEST ERROR: Grafana & Loki log verification test triggered successfully!');
        throw new common_1.BadRequestException('🚨 Test error triggered for Grafana log verification');
    }
    async googleAuth() {
    }
    async googleAuthRedirect(req, res) {
        try {
            console.log('Google callback received, user in request:', req.user ? 'Yes' : 'No');
            if (!req.user) {
                throw new common_1.BadRequestException('Google authentication failed: No user profile received');
            }
            const result = await this.authService.googleLogin(req.user);
            console.log(`Redirecting to frontend with role: ${result.user.role}`);
            return res.redirect(`http://localhost:3000/auth/callback?token=${result.access_token}&role=${result.user.role}`);
        }
        catch (error) {
            console.error('❌ Google Auth Redirect Error:', error.message);
            return res.redirect(`http://localhost:3000/login?error=${encodeURIComponent(error.message)}`);
        }
    }
    async validateToken(req) {
        return {
            valid: true,
            user: req.user,
        };
    }
    async forgotPassword(forgotPasswordDto) {
        return this.authService.forgotPassword(forgotPasswordDto);
    }
    async verifyOtp(body) {
        return this.authService.verifyOtp(body.email, body.otp);
    }
    async resetPassword(resetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto);
    }
    async setRole(req, role) {
        return this.authService.setRole(req.user.userId, role);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('cnicImage', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads/cnic',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                cb(null, `${randomName}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
        fileFilter: (req, file, cb) => {
            if (file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
                cb(null, true);
            }
            else {
                cb(new common_1.BadRequestException('Unsupported file type'), false);
            }
        },
    })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_dto_1.RegisterDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('test-error'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "testError", null);
__decorate([
    (0, common_1.Get)('google'),
    (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuth", null);
__decorate([
    (0, common_1.Get)('google/callback'),
    (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuthRedirect", null);
__decorate([
    (0, common_1.Get)('validate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "validateToken", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('verify-otp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyOtp", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Post)('role'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "setRole", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map