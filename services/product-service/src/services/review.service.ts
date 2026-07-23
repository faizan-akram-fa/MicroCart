import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Review, ReviewStatus } from '../entities/review.entity';
import { Product } from '../entities/product.entity';
import { CreateReviewDto, UpdateReviewStatusDto } from '../dto/review.dto';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async create(createReviewDto: CreateReviewDto, userId: string | null, userName: string) {
    const { productId, rating, comment, images } = createReviewDto;

    // Check product exists
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let status = ReviewStatus.APPROVED;

    // Guest Handling
    if (!userId) {
      status = ReviewStatus.PENDING; // Guests must be approved
    } else {
      // Rate limit: Registered User cannot post more than 3 reviews in single day in a single product
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const reviewsToday = await this.reviewRepository.count({
        where: {
          productId,
          userId,
          createdAt: MoreThanOrEqual(today)
        }
      });

      if (reviewsToday >= 3) {
        throw new BadRequestException('You cannot post more than 3 reviews per day for this product');
      }

      // Verify purchase via order-service for registered users
      const orderServiceUrl = this.configService.get('ORDER_SERVICE_URL', 'http://localhost:3004');
      const internalSecret = this.configService.get('INTERNAL_SERVICE_SECRET', 'microservices-secret-123');
      try {
        const res = await firstValueFrom(
          this.httpService.get(
            `${orderServiceUrl}/orders/internal/verify-purchase/${userId}/${productId}`,
            { headers: { 'x-internal-secret': internalSecret } },
          ),
        );
        if (!res.data?.purchased) {
          throw new BadRequestException('You can only review products you have purchased and received');
        }
      } catch (err) {
        if (err instanceof BadRequestException) throw err;
        console.error('Could not verify purchase with order-service:', err.message);
      }
    }

    const review = this.reviewRepository.create({
      productId,
      userId,
      userName,
      rating,
      comment,
      images,
      status,
    });

    const saved = await this.reviewRepository.save(review);
    
    // Recalculate rating immediately if approved
    if (status === ReviewStatus.APPROVED) {
      await this.recalculateProductRating(productId);
    }

    return saved;
  }

  async findAllForProduct(productId: string) {
    return this.reviewRepository.find({
      where: { productId, status: ReviewStatus.APPROVED },
      order: { createdAt: 'DESC' },
    });
  }

  async findAllForAdmin() {
    return this.reviewRepository.find({
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllForSeller(sellerId: string) {
    return this.reviewRepository
      .createQueryBuilder('review')
      .innerJoinAndSelect('review.product', 'product')
      .where('product.sellerId = :sellerId', { sellerId })
      .orderBy('review.createdAt', 'DESC')
      .getMany();
  }

  async updateComment(id: string, comment: string, rating: number, userId: string) {
    const review = await this.reviewRepository.findOne({ where: { id } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only edit your own reviews');
    }

    if (review.status === ReviewStatus.DEACTIVATED) {
      throw new BadRequestException('Cannot edit a deactivated review');
    }

    review.comment = comment;
    review.rating = rating;
    review.isEdited = true;
    
    const saved = await this.reviewRepository.save(review);
    
    // Recalculate rating since rating might have changed
    if (review.status === ReviewStatus.APPROVED) {
      await this.recalculateProductRating(review.productId);
    }
    
    return saved;
  }

  async updateStatus(id: string, dto: UpdateReviewStatusDto, userId: string, role: string) {
    const review = await this.reviewRepository.findOne({ 
      where: { id },
      relations: ['product']
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Permission check for sellers
    if (role === 'seller') {
      if (review.product.sellerId !== userId) {
        throw new ForbiddenException('You can only moderate reviews for your own products');
      }
    }

    const oldStatus = review.status;
    review.status = dto.status;
    const saved = await this.reviewRepository.save(review);

    // Recalculate product rating when a review is approved or deactivated
    if (
      dto.status === ReviewStatus.APPROVED ||
      oldStatus === ReviewStatus.APPROVED
    ) {
      await this.recalculateProductRating(review.productId);
    }

    return saved;
  }

  async remove(id: string, userId: string, role: string) {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['product'],
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Check permissions
    if (role === 'seller') {
      if (review.product.sellerId !== userId) {
        throw new ForbiddenException('You can only delete reviews for your own products');
      }
    }

    const productId = review.productId;
    const oldStatus = review.status;
    
    // Permanent Delete
    await this.reviewRepository.remove(review);

    // Recalculate rating if it was approved
    if (oldStatus === ReviewStatus.APPROVED) {
      await this.recalculateProductRating(productId);
    }
    
    return { message: 'Review permanently removed' };
  }

  private async recalculateProductRating(productId: string) {
    const approved = await this.reviewRepository.find({
      where: { productId, status: ReviewStatus.APPROVED },
    });

    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) return;

    const count = approved.length;
    const avg =
      count > 0
        ? approved.reduce((sum, r) => sum + r.rating, 0) / count
        : 0;

    product.rating = Math.round(avg * 10) / 10; // 1 decimal
    product.reviewCount = count;
    await this.productRepository.save(product);
  }
}
