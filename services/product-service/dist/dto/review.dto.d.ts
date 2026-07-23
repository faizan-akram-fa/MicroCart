import { ReviewStatus } from '../entities/review.entity';
export declare class CreateReviewDto {
    productId: string;
    rating: number;
    comment: string;
    images?: string[];
}
export declare class UpdateReviewStatusDto {
    status: ReviewStatus;
}
