import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Wishlist } from '../entities/wishlist.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private wishlistRepository: Repository<Wishlist>,
    private httpService: HttpService,
  ) {}

  async getWishlist(userId: string) {
    const wishlistItems = await this.wishlistRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
    const productsWithDetails = await Promise.all(
      wishlistItems.map(async (item) => {
        try {
          const response = await firstValueFrom(
            this.httpService.get(`${productServiceUrl}/products/${item.productId}`),
          );
          return { ...item, product: response.data };
        } catch (error) {
          return { ...item, product: null };
        }
      }),
    );

    return productsWithDetails;
  }

  async addToWishlist(userId: string, productId: string) {
    const existing = await this.wishlistRepository.findOne({
      where: { userId, productId },
    });

    if (existing) {
      throw new ConflictException('Product already in wishlist');
    }

    const wishlistItem = this.wishlistRepository.create({
      userId,
      productId,
    });

    return this.wishlistRepository.save(wishlistItem);
  }

  async removeFromWishlist(userId: string, productId: string) {
    const item = await this.wishlistRepository.findOne({
      where: { userId, productId },
    });

    if (!item) {
      throw new NotFoundException('Item not found in wishlist');
    }

    await this.wishlistRepository.remove(item);
    return { message: 'Item removed from wishlist' };
  }
}
