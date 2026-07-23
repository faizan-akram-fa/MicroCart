import { Repository } from 'typeorm';
import { Review } from '../entities/review.entity';
import { Product } from '../entities/product.entity';
import { CreateReviewDto, UpdateReviewStatusDto } from '../dto/review.dto';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
export declare class ReviewService {
    private reviewRepository;
    private productRepository;
    private httpService;
    private configService;
    constructor(reviewRepository: Repository<Review>, productRepository: Repository<Product>, httpService: HttpService, configService: ConfigService);
    create(createReviewDto: CreateReviewDto, userId: string | null, userName: string): Promise<Review>;
    findAllForProduct(productId: string): Promise<Review[]>;
    findAllForAdmin(): Promise<Review[]>;
    findAllForSeller(sellerId: string): Promise<Review[]>;
    updateComment(id: string, comment: string, rating: number, userId: string): Promise<Review>;
    updateStatus(id: string, dto: UpdateReviewStatusDto, userId: string, role: string): Promise<Review>;
    remove(id: string, userId: string, role: string): Promise<{
        message: string;
    }>;
    private recalculateProductRating;
}
