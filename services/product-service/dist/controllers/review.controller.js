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
exports.ReviewController = void 0;
const common_1 = require("@nestjs/common");
const review_service_1 = require("../services/review.service");
const review_dto_1 = require("../dto/review.dto");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
let ReviewController = class ReviewController {
    constructor(reviewService) {
        this.reviewService = reviewService;
    }
    async create(body, files, req) {
        const userName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Verified Customer';
        if (files && files.length > 0) {
            const serverUrl = process.env.API_URL || 'http://localhost:3002';
            const imageUrls = files.map(file => `${serverUrl}/uploads/${file.filename}`);
            body.images = imageUrls;
        }
        const createReviewDto = {
            ...body,
            rating: Number(body.rating),
        };
        return this.reviewService.create(createReviewDto, req.user.userId, userName);
    }
    async createGuest(body, files) {
        const userName = body.userName || 'Guest User';
        if (files && files.length > 0) {
            const serverUrl = process.env.API_URL || 'http://localhost:3002';
            const imageUrls = files.map(file => `${serverUrl}/uploads/${file.filename}`);
            body.images = imageUrls;
        }
        const createReviewDto = {
            ...body,
            rating: Number(body.rating),
        };
        return this.reviewService.create(createReviewDto, null, userName);
    }
    async findAllForProduct(productId) {
        return this.reviewService.findAllForProduct(productId);
    }
    async findAllForAdmin(req) {
        if (req.user.role !== 'admin' && req.user.role !== 'sub_admin') {
            throw new common_1.ForbiddenException('Admin access only');
        }
        if (req.user.role === 'sub_admin' && !req.user.permissions?.includes('MANAGE_REVIEWS')) {
            throw new common_1.ForbiddenException('You do not have permission to view reviews');
        }
        return this.reviewService.findAllForAdmin();
    }
    async findAllForSeller(req) {
        if (req.user.role !== 'seller') {
            throw new common_1.ForbiddenException('Seller access only');
        }
        return this.reviewService.findAllForSeller(req.user.userId);
    }
    async updateComment(id, body, req) {
        return this.reviewService.updateComment(id, body.comment, body.rating, req.user.userId);
    }
    async updateStatus(id, dto, req) {
        const role = req.user.role;
        if (role !== 'admin' && role !== 'sub_admin' && role !== 'seller') {
            throw new common_1.ForbiddenException('Unauthorized');
        }
        if (role === 'sub_admin' && !req.user.permissions?.includes('MANAGE_REVIEWS')) {
            throw new common_1.ForbiddenException('You do not have permission to moderate reviews');
        }
        return this.reviewService.updateStatus(id, dto, req.user.userId, role);
    }
    async remove(id, req) {
        const role = req.user.role;
        if (role !== 'admin' &&
            role !== 'sub_admin' &&
            role !== 'seller') {
            throw new common_1.ForbiddenException('Unauthorized');
        }
        if (role === 'sub_admin' && !req.user.permissions?.includes('MANAGE_REVIEWS')) {
            throw new common_1.ForbiddenException('You do not have permission to delete reviews');
        }
        return this.reviewService.remove(id, req.user.userId, role);
    }
};
exports.ReviewController = ReviewController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('images', 3, {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
        fileFilter: (req, file, cb) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
                return cb(new common_1.BadRequestException('Only image files are allowed!'), false);
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Array, Object]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('guest'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('images', 3, {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
        fileFilter: (req, file, cb) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
                return cb(new common_1.BadRequestException('Only image files are allowed!'), false);
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Array]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "createGuest", null);
__decorate([
    (0, common_1.Get)('product/:productId'),
    __param(0, (0, common_1.Param)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "findAllForProduct", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "findAllForAdmin", null);
__decorate([
    (0, common_1.Get)('seller'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "findAllForSeller", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "updateComment", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, review_dto_1.UpdateReviewStatusDto, Object]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "remove", null);
exports.ReviewController = ReviewController = __decorate([
    (0, common_1.Controller)('reviews'),
    __metadata("design:paramtypes", [review_service_1.ReviewService])
], ReviewController);
//# sourceMappingURL=review.controller.js.map