export declare enum PromotionType {
    PERCENTAGE = "percentage",
    FIXED = "fixed"
}
export declare enum PromotionScope {
    PLATFORM = "platform",
    STORE = "store",
    PRODUCT = "product"
}
export declare class Promotion {
    id: string;
    code: string;
    type: PromotionType;
    value: number;
    minOrderValue: number;
    scope: PromotionScope;
    sellerId: string;
    applicableProductIds: string[];
    isActive: boolean;
    expiryDate: Date;
    usageLimit: number;
    usedCount: number;
    createdAt: Date;
    updatedAt: Date;
}
