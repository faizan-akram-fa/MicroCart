import { WishlistService } from '../services/wishlist.service';
import { AddToWishlistDto } from '../dto/wishlist.dto';
export declare class WishlistController {
    private wishlistService;
    constructor(wishlistService: WishlistService);
    getWishlist(req: any): Promise<{
        product: any;
        id: string;
        userId: string;
        productId: string;
        createdAt: Date;
    }[]>;
    addToWishlist(addToWishlistDto: AddToWishlistDto, req: any): Promise<import("../entities/wishlist.entity").Wishlist>;
    removeFromWishlist(productId: string, req: any): Promise<{
        message: string;
    }>;
}
