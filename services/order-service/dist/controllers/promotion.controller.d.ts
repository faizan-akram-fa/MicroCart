import { PromotionService } from '../services/promotion.service';
import { CreatePromotionDto, ValidatePromotionDto } from '../dto/promotion.dto';
export declare class PromotionController {
    private readonly promotionService;
    constructor(promotionService: PromotionService);
    create(createDto: CreatePromotionDto, req: any): Promise<import("../entities/promotion.entity").Promotion>;
    findAll(req: any): Promise<import("../entities/promotion.entity").Promotion[]>;
    toggleStatus(id: string, req: any): Promise<import("../entities/promotion.entity").Promotion>;
    update(id: string, updateDto: any, req: any): Promise<import("../entities/promotion.entity").Promotion>;
    validate(validateDto: ValidatePromotionDto): Promise<{
        promotionId: string;
        code: string;
        type: import("../entities/promotion.entity").PromotionType;
        value: number;
        eligibleTotal: number;
        discountAmount: number;
    }>;
}
