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
exports.PromotionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const promotion_entity_1 = require("../entities/promotion.entity");
let PromotionService = class PromotionService {
    constructor(promotionRepository) {
        this.promotionRepository = promotionRepository;
    }
    async create(createDto, sellerId, isAdmin = false) {
        if (!isAdmin && createDto.scope === promotion_entity_1.PromotionScope.PLATFORM) {
            throw new common_1.ForbiddenException('Only admins can create platform-wide promotions');
        }
        if (!isAdmin) {
            createDto.sellerId = sellerId;
        }
        const exists = await this.promotionRepository.findOne({ where: { code: createDto.code.toUpperCase() } });
        if (exists) {
            throw new common_1.BadRequestException('Promotion code already exists');
        }
        try {
            const promotion = this.promotionRepository.create({
                ...createDto,
                code: createDto.code.toUpperCase(),
                sellerId: !isAdmin ? sellerId : createDto.sellerId,
            });
            return await this.promotionRepository.save(promotion);
        }
        catch (error) {
            throw new common_1.BadRequestException('DB Error: ' + error.message);
        }
    }
    async findAll(sellerId, isAdmin = false) {
        if (isAdmin) {
            return this.promotionRepository.find({ order: { createdAt: 'DESC' } });
        }
        return this.promotionRepository.find({ where: { sellerId }, order: { createdAt: 'DESC' } });
    }
    async toggleStatus(id, sellerId, isAdmin = false) {
        const promotion = await this.promotionRepository.findOne({ where: { id } });
        if (!promotion)
            throw new common_1.NotFoundException('Promotion not found');
        if (!isAdmin && promotion.sellerId !== sellerId) {
            throw new common_1.ForbiddenException('You cannot modify this promotion');
        }
        promotion.isActive = !promotion.isActive;
        return this.promotionRepository.save(promotion);
    }
    async update(id, updateDto, sellerId, isAdmin = false) {
        const promotion = await this.promotionRepository.findOne({ where: { id } });
        if (!promotion)
            throw new common_1.NotFoundException('Promotion not found');
        if (!isAdmin && promotion.sellerId !== sellerId) {
            throw new common_1.ForbiddenException('You cannot modify this promotion');
        }
        Object.assign(promotion, updateDto);
        return this.promotionRepository.save(promotion);
    }
    async validate(validateDto) {
        try {
            const { code, cartItems } = validateDto;
            const promotion = await this.promotionRepository.findOne({ where: { code: code.toUpperCase() } });
            if (!promotion) {
                throw new common_1.NotFoundException('Invalid promo code');
            }
            if (!promotion.isActive) {
                throw new common_1.BadRequestException('This promo code is inactive');
            }
            if (promotion.expiryDate && new Date(promotion.expiryDate) < new Date()) {
                throw new common_1.BadRequestException('This promo code has expired');
            }
            if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
                throw new common_1.BadRequestException('This promo code usage limit has been reached');
            }
            let eligibleTotal = 0;
            for (const item of cartItems) {
                const itemTotal = Number(item.price) * Number(item.quantity);
                if (promotion.scope === promotion_entity_1.PromotionScope.PLATFORM) {
                    eligibleTotal += itemTotal;
                }
                else if (promotion.scope === promotion_entity_1.PromotionScope.STORE && promotion.sellerId === item.sellerId) {
                    eligibleTotal += itemTotal;
                }
                else if (promotion.scope === promotion_entity_1.PromotionScope.PRODUCT && promotion.applicableProductIds?.includes(item.productId)) {
                    eligibleTotal += itemTotal;
                }
            }
            if (eligibleTotal === 0) {
                throw new common_1.BadRequestException('This promo code does not apply to any items in your cart');
            }
            if (promotion.minOrderValue && eligibleTotal < Number(promotion.minOrderValue)) {
                throw new common_1.BadRequestException(`Minimum eligible order value of Rs. ${promotion.minOrderValue} required for this promo code`);
            }
            let discountAmount = 0;
            const value = Number(promotion.value);
            if (promotion.type === promotion_entity_1.PromotionType.PERCENTAGE) {
                discountAmount = (eligibleTotal * value) / 100;
            }
            else if (promotion.type === promotion_entity_1.PromotionType.FIXED) {
                discountAmount = Math.min(value, eligibleTotal);
            }
            return {
                promotionId: promotion.id,
                code: promotion.code,
                type: promotion.type,
                value: promotion.value,
                eligibleTotal,
                discountAmount: Number(discountAmount.toFixed(2)),
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException('Validation crashed: ' + error.message);
        }
    }
    async incrementUsage(code) {
        const promotion = await this.promotionRepository.findOne({ where: { code: code.toUpperCase() } });
        if (promotion) {
            promotion.usedCount += 1;
            await this.promotionRepository.save(promotion);
        }
    }
};
exports.PromotionService = PromotionService;
exports.PromotionService = PromotionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(promotion_entity_1.Promotion)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PromotionService);
//# sourceMappingURL=promotion.service.js.map