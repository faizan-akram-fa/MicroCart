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
exports.ReviewService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const review_entity_1 = require("../entities/review.entity");
const product_entity_1 = require("../entities/product.entity");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
let ReviewService = class ReviewService {
    constructor(reviewRepository, productRepository, httpService, configService) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.httpService = httpService;
        this.configService = configService;
    }
    async create(createReviewDto, userId, userName) {
        const { productId, rating, comment, images } = createReviewDto;
        const product = await this.productRepository.findOne({ where: { id: productId } });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        let status = review_entity_1.ReviewStatus.APPROVED;
        if (!userId) {
            status = review_entity_1.ReviewStatus.PENDING;
        }
        else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const reviewsToday = await this.reviewRepository.count({
                where: {
                    productId,
                    userId,
                    createdAt: (0, typeorm_2.MoreThanOrEqual)(today)
                }
            });
            if (reviewsToday >= 3) {
                throw new common_1.BadRequestException('You cannot post more than 3 reviews per day for this product');
            }
            const orderServiceUrl = this.configService.get('ORDER_SERVICE_URL', 'http://localhost:3004');
            const internalSecret = this.configService.get('INTERNAL_SERVICE_SECRET', 'microservices-secret-123');
            try {
                const res = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${orderServiceUrl}/orders/internal/verify-purchase/${userId}/${productId}`, { headers: { 'x-internal-secret': internalSecret } }));
                if (!res.data?.purchased) {
                    throw new common_1.BadRequestException('You can only review products you have purchased and received');
                }
            }
            catch (err) {
                if (err instanceof common_1.BadRequestException)
                    throw err;
                console.error('Could not verify purchase with order-service:', err.message);
            }
        }
        const review = this.reviewRepository.create({
            productId,
            userId,
            userName,
            rating,
            comment,
            images,
            status,
        });
        const saved = await this.reviewRepository.save(review);
        if (status === review_entity_1.ReviewStatus.APPROVED) {
            await this.recalculateProductRating(productId);
        }
        return saved;
    }
    async findAllForProduct(productId) {
        return this.reviewRepository.find({
            where: { productId, status: review_entity_1.ReviewStatus.APPROVED },
            order: { createdAt: 'DESC' },
        });
    }
    async findAllForAdmin() {
        return this.reviewRepository.find({
            relations: ['product'],
            order: { createdAt: 'DESC' },
        });
    }
    async findAllForSeller(sellerId) {
        return this.reviewRepository
            .createQueryBuilder('review')
            .innerJoinAndSelect('review.product', 'product')
            .where('product.sellerId = :sellerId', { sellerId })
            .orderBy('review.createdAt', 'DESC')
            .getMany();
    }
    async updateComment(id, comment, rating, userId) {
        const review = await this.reviewRepository.findOne({ where: { id } });
        if (!review) {
            throw new common_1.NotFoundException('Review not found');
        }
        if (review.userId !== userId) {
            throw new common_1.ForbiddenException('You can only edit your own reviews');
        }
        if (review.status === review_entity_1.ReviewStatus.DEACTIVATED) {
            throw new common_1.BadRequestException('Cannot edit a deactivated review');
        }
        review.comment = comment;
        review.rating = rating;
        review.isEdited = true;
        const saved = await this.reviewRepository.save(review);
        if (review.status === review_entity_1.ReviewStatus.APPROVED) {
            await this.recalculateProductRating(review.productId);
        }
        return saved;
    }
    async updateStatus(id, dto, userId, role) {
        const review = await this.reviewRepository.findOne({
            where: { id },
            relations: ['product']
        });
        if (!review) {
            throw new common_1.NotFoundException('Review not found');
        }
        if (role === 'seller') {
            if (review.product.sellerId !== userId) {
                throw new common_1.ForbiddenException('You can only moderate reviews for your own products');
            }
        }
        const oldStatus = review.status;
        review.status = dto.status;
        const saved = await this.reviewRepository.save(review);
        if (dto.status === review_entity_1.ReviewStatus.APPROVED ||
            oldStatus === review_entity_1.ReviewStatus.APPROVED) {
            await this.recalculateProductRating(review.productId);
        }
        return saved;
    }
    async remove(id, userId, role) {
        const review = await this.reviewRepository.findOne({
            where: { id },
            relations: ['product'],
        });
        if (!review) {
            throw new common_1.NotFoundException('Review not found');
        }
        if (role === 'seller') {
            if (review.product.sellerId !== userId) {
                throw new common_1.ForbiddenException('You can only delete reviews for your own products');
            }
        }
        const productId = review.productId;
        const oldStatus = review.status;
        await this.reviewRepository.remove(review);
        if (oldStatus === review_entity_1.ReviewStatus.APPROVED) {
            await this.recalculateProductRating(productId);
        }
        return { message: 'Review permanently removed' };
    }
    async recalculateProductRating(productId) {
        const approved = await this.reviewRepository.find({
            where: { productId, status: review_entity_1.ReviewStatus.APPROVED },
        });
        const product = await this.productRepository.findOne({ where: { id: productId } });
        if (!product)
            return;
        const count = approved.length;
        const avg = count > 0
            ? approved.reduce((sum, r) => sum + r.rating, 0) / count
            : 0;
        product.rating = Math.round(avg * 10) / 10;
        product.reviewCount = count;
        await this.productRepository.save(product);
    }
};
exports.ReviewService = ReviewService;
exports.ReviewService = ReviewService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(review_entity_1.Review)),
    __param(1, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        axios_1.HttpService,
        config_1.ConfigService])
], ReviewService);
//# sourceMappingURL=review.service.js.map