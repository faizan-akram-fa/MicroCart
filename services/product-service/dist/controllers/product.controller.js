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
exports.ProductController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const product_service_1 = require("../services/product.service");
const product_dto_1 = require("../dto/product.dto");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const roles_guard_1 = require("../guards/roles.guard");
const roles_decorator_1 = require("../decorators/roles.decorator");
let ProductController = class ProductController {
    constructor(productService) {
        this.productService = productService;
    }
    async create(body, files, req) {
        console.log('Create Product Body:', body);
        console.log('User:', req.user);
        if (files && files.length > 0) {
            const serverUrl = process.env.API_URL || 'http://localhost:3002';
            const imageUrls = files.map(file => `${serverUrl}/uploads/${file.filename}`);
            body.images = imageUrls;
        }
        const productDto = {
            ...body,
            price: Number(body.price),
            stock: Number(body.stock),
            salePrice: body.salePrice ? Number(body.salePrice) : undefined,
            isOnSale: body.isOnSale === 'true' || body.isOnSale === true,
            images: body.images || [],
        };
        return this.productService.create(productDto, req.user.userId);
    }
    async createBulk(products, req) {
        if (!Array.isArray(products)) {
            throw new common_1.BadRequestException('Payload must be an array of products');
        }
        return this.productService.createBulk(products, req.user.userId);
    }
    async findAll(searchDto) {
        return this.productService.findAll(searchDto);
    }
    async findBySeller(req) {
        return this.productService.findBySeller(req.user.userId);
    }
    async findOne(id) {
        return this.productService.findOne(id);
    }
    async update(id, body, files, req) {
        if (files && files.length > 0) {
            const serverUrl = process.env.API_URL || 'http://localhost:3002';
            const newImageUrls = files.map(file => `${serverUrl}/uploads/${file.filename}`);
            let existingImages = [];
            if (body.existingImages) {
                existingImages = Array.isArray(body.existingImages) ? body.existingImages : [body.existingImages];
            }
            body.images = [...existingImages, ...newImageUrls];
        }
        const productDto = {
            ...body,
            price: body.price ? Number(body.price) : undefined,
            stock: body.stock ? Number(body.stock) : undefined,
            salePrice: body.salePrice ? Number(body.salePrice) : undefined,
            isOnSale: body.isOnSale !== undefined ? (body.isOnSale === 'true' || body.isOnSale === true) : undefined,
        };
        return this.productService.update(id, productDto, req.user.userId);
    }
    async remove(id, req) {
        return this.productService.remove(id, req.user.userId);
    }
    async updateStock(id, quantity, isSet) {
        if (isSet) {
            return this.productService.setStock(id, quantity);
        }
        return this.productService.updateStock(id, quantity);
    }
    async getAdminInventory(req) {
        if (req.user.role !== 'admin' && req.user.role !== 'sub_admin') {
            throw new common_1.BadRequestException('Forbidden: Admin access only');
        }
        return this.productService.getAdminInventory();
    }
    async uploadBulkImages(files) {
        const serverUrl = process.env.API_URL || 'http://localhost:3002';
        return files.map(file => ({
            originalName: file.originalname,
            url: `${serverUrl}/uploads/${file.filename}`
        }));
    }
};
exports.ProductController = ProductController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('seller'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('images', 5, {
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
], ProductController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('bulk'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('seller'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "createBulk", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [product_dto_1.SearchProductDto]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('seller'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('seller'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "findBySeller", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('seller'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('images', 5, {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFiles)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Array, Object]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('seller'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "remove", null);
__decorate([
    (0, common_1.Put)(':id/stock'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('quantity')),
    __param(2, (0, common_1.Body)('isSet')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Boolean]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "updateStock", null);
__decorate([
    (0, common_1.Get)('admin/inventory'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "getAdminInventory", null);
__decorate([
    (0, common_1.Post)('bulk/images'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('seller'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('images', 50, {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
    })),
    __param(0, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "uploadBulkImages", null);
exports.ProductController = ProductController = __decorate([
    (0, common_1.Controller)('products'),
    __metadata("design:paramtypes", [product_service_1.ProductService])
], ProductController);
//# sourceMappingURL=product.controller.js.map