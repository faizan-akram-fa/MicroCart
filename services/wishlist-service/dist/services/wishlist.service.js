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
exports.WishlistService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const wishlist_entity_1 = require("../entities/wishlist.entity");
let WishlistService = class WishlistService {
    constructor(wishlistRepository, httpService) {
        this.wishlistRepository = wishlistRepository;
        this.httpService = httpService;
    }
    async getWishlist(userId) {
        const wishlistItems = await this.wishlistRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
        const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
        const productsWithDetails = await Promise.all(wishlistItems.map(async (item) => {
            try {
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${productServiceUrl}/products/${item.productId}`));
                return { ...item, product: response.data };
            }
            catch (error) {
                return { ...item, product: null };
            }
        }));
        return productsWithDetails;
    }
    async addToWishlist(userId, productId) {
        const existing = await this.wishlistRepository.findOne({
            where: { userId, productId },
        });
        if (existing) {
            throw new common_1.ConflictException('Product already in wishlist');
        }
        const wishlistItem = this.wishlistRepository.create({
            userId,
            productId,
        });
        return this.wishlistRepository.save(wishlistItem);
    }
    async removeFromWishlist(userId, productId) {
        const item = await this.wishlistRepository.findOne({
            where: { userId, productId },
        });
        if (!item) {
            throw new common_1.NotFoundException('Item not found in wishlist');
        }
        await this.wishlistRepository.remove(item);
        return { message: 'Item removed from wishlist' };
    }
};
exports.WishlistService = WishlistService;
exports.WishlistService = WishlistService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(wishlist_entity_1.Wishlist)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        axios_1.HttpService])
], WishlistService);
//# sourceMappingURL=wishlist.service.js.map