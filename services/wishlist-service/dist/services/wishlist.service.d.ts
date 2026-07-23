import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { Wishlist } from '../entities/wishlist.entity';
export declare class WishlistService {
    private wishlistRepository;
    private httpService;
    constructor(wishlistRepository: Repository<Wishlist>, httpService: HttpService);
    getWishlist(userId: string): Promise<{
        product: any;
        id: string;
        userId: string;
        productId: string;
        createdAt: Date;
    }[]>;
    addToWishlist(userId: string, productId: string): Promise<Wishlist>;
    removeFromWishlist(userId: string, productId: string): Promise<{
        message: string;
    }>;
}
