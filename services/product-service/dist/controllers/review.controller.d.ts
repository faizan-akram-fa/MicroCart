import { ReviewService } from '../services/review.service';
import { UpdateReviewStatusDto } from '../dto/review.dto';
export declare class ReviewController {
    private reviewService;
    constructor(reviewService: ReviewService);
    create(body: any, files: Array<any>, req: any): Promise<import("../entities/review.entity").Review>;
    createGuest(body: any, files: Array<any>): Promise<import("../entities/review.entity").Review>;
    findAllForProduct(productId: string): Promise<import("../entities/review.entity").Review[]>;
    findAllForAdmin(req: any): Promise<import("../entities/review.entity").Review[]>;
    findAllForSeller(req: any): Promise<import("../entities/review.entity").Review[]>;
    updateComment(id: string, body: {
        comment: string;
        rating: number;
    }, req: any): Promise<import("../entities/review.entity").Review>;
    updateStatus(id: string, dto: UpdateReviewStatusDto, req: any): Promise<import("../entities/review.entity").Review>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
}
