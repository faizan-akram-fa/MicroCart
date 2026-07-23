import { Product } from './product.entity';
export declare enum ReviewStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    DEACTIVATED = "deactivated"
}
export declare class Review {
    id: string;
    productId: string;
    product: Product;
    userId: string;
    userName: string;
    rating: number;
    comment: string;
    images: string[];
    status: ReviewStatus;
    isEdited: boolean;
    createdAt: Date;
    updatedAt: Date;
}
