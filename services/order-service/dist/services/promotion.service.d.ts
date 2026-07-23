import { Repository } from 'typeorm';
import { Promotion, PromotionType } from '../entities/promotion.entity';
import { CreatePromotionDto, ValidatePromotionDto, UpdatePromotionDto } from '../dto/promotion.dto';
export declare class PromotionService {
    private promotionRepository;
    constructor(promotionRepository: Repository<Promotion>);
    create(createDto: CreatePromotionDto, sellerId?: string, isAdmin?: boolean): Promise<Promotion>;
    findAll(sellerId?: string, isAdmin?: boolean): Promise<Promotion[]>;
    toggleStatus(id: string, sellerId?: string, isAdmin?: boolean): Promise<Promotion>;
    update(id: string, updateDto: UpdatePromotionDto, sellerId?: string, isAdmin?: boolean): Promise<Promotion>;
    validate(validateDto: ValidatePromotionDto): Promise<{
        promotionId: string;
        code: string;
        type: PromotionType;
        value: number;
        eligibleTotal: number;
        discountAmount: number;
    }>;
    incrementUsage(code: string): Promise<void>;
}
