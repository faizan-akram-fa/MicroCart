import { PromotionType, PromotionScope } from '../entities/promotion.entity';
export declare class CreatePromotionDto {
    code: string;
    type: PromotionType;
    value: number;
    minOrderValue?: number;
    scope?: PromotionScope;
    applicableProductIds?: string[];
    expiryDate?: Date;
    usageLimit?: number;
    sellerId?: string;
}
export declare class CartItemDto {
    productId: string;
    quantity: number;
    price: number | string;
    sellerId?: string;
}
export declare class UpdatePromotionDto {
    type?: PromotionType;
    value?: number;
    minOrderValue?: number;
    usageLimit?: number;
    expiryDate?: Date;
    scope?: PromotionScope;
    applicableProductIds?: string[];
}
export declare class ValidatePromotionDto {
    code: string;
    cartItems: CartItemDto[];
}
