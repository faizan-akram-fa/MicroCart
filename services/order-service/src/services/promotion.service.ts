import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promotion, PromotionScope, PromotionType } from '../entities/promotion.entity';
import { CreatePromotionDto, ValidatePromotionDto, UpdatePromotionDto } from '../dto/promotion.dto';

@Injectable()
export class PromotionService {
  constructor(
    @InjectRepository(Promotion)
    private promotionRepository: Repository<Promotion>,
  ) {}

  async create(createDto: CreatePromotionDto, sellerId?: string, isAdmin: boolean = false) {
    if (!isAdmin && createDto.scope === PromotionScope.PLATFORM) {
      throw new ForbiddenException('Only admins can create platform-wide promotions');
    }

    if (!isAdmin) {
      createDto.sellerId = sellerId;
    }

    const exists = await this.promotionRepository.findOne({ where: { code: createDto.code.toUpperCase() } });
    if (exists) {
      throw new BadRequestException('Promotion code already exists');
    }

    try {
      const promotion = this.promotionRepository.create({
        ...createDto,
        code: createDto.code.toUpperCase(),
        sellerId: !isAdmin ? sellerId : createDto.sellerId,
      });

      return await this.promotionRepository.save(promotion);
    } catch (error) {
      throw new BadRequestException('DB Error: ' + error.message);
    }
  }

  async findAll(sellerId?: string, isAdmin: boolean = false) {
    if (isAdmin) {
      return this.promotionRepository.find({ order: { createdAt: 'DESC' } });
    }
    return this.promotionRepository.find({ where: { sellerId }, order: { createdAt: 'DESC' } });
  }

  async toggleStatus(id: string, sellerId?: string, isAdmin: boolean = false) {
    const promotion = await this.promotionRepository.findOne({ where: { id } });
    if (!promotion) throw new NotFoundException('Promotion not found');

    if (!isAdmin && promotion.sellerId !== sellerId) {
      throw new ForbiddenException('You cannot modify this promotion');
    }

    promotion.isActive = !promotion.isActive;
    return this.promotionRepository.save(promotion);
  }

  async update(id: string, updateDto: UpdatePromotionDto, sellerId?: string, isAdmin: boolean = false) {
    const promotion = await this.promotionRepository.findOne({ where: { id } });
    if (!promotion) throw new NotFoundException('Promotion not found');

    if (!isAdmin && promotion.sellerId !== sellerId) {
      throw new ForbiddenException('You cannot modify this promotion');
    }

    Object.assign(promotion, updateDto);
    return this.promotionRepository.save(promotion);
  }

  async validate(validateDto: ValidatePromotionDto) {
    try {
      const { code, cartItems } = validateDto;

      const promotion = await this.promotionRepository.findOne({ where: { code: code.toUpperCase() } });

      if (!promotion) {
        throw new NotFoundException('Invalid promo code');
      }

      if (!promotion.isActive) {
        throw new BadRequestException('This promo code is inactive');
      }

      if (promotion.expiryDate && new Date(promotion.expiryDate) < new Date()) {
        throw new BadRequestException('This promo code has expired');
      }

      if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
        throw new BadRequestException('This promo code usage limit has been reached');
      }

      let eligibleTotal = 0;

      for (const item of cartItems) {
        const itemTotal = Number(item.price) * Number(item.quantity);

        if (promotion.scope === PromotionScope.PLATFORM) {
          eligibleTotal += itemTotal;
        } else if (promotion.scope === PromotionScope.STORE && promotion.sellerId === item.sellerId) {
          eligibleTotal += itemTotal;
        } else if (promotion.scope === PromotionScope.PRODUCT && promotion.applicableProductIds?.includes(item.productId)) {
          eligibleTotal += itemTotal;
        }
      }

      if (eligibleTotal === 0) {
        throw new BadRequestException('This promo code does not apply to any items in your cart');
      }

      if (promotion.minOrderValue && eligibleTotal < Number(promotion.minOrderValue)) {
        throw new BadRequestException(`Minimum eligible order value of Rs. ${promotion.minOrderValue} required for this promo code`);
      }

      let discountAmount = 0;
      const value = Number(promotion.value);

      if (promotion.type === PromotionType.PERCENTAGE) {
        discountAmount = (eligibleTotal * value) / 100;
      } else if (promotion.type === PromotionType.FIXED) {
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
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Validation crashed: ' + error.message);
    }
  }

  async incrementUsage(code: string) {
    const promotion = await this.promotionRepository.findOne({ where: { code: code.toUpperCase() } });
    if (promotion) {
      promotion.usedCount += 1;
      await this.promotionRepository.save(promotion);
    }
  }
}
