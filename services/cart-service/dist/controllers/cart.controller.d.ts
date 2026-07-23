import { CartService } from '../services/cart.service';
import { AddToCartDto, UpdateCartItemDto } from '../dto/cart.dto';
export declare class CartController {
    private cartService;
    constructor(cartService: CartService);
    getCart(req: any): Promise<import("../entities/cart.entity").Cart>;
    getCartTotal(req: any): Promise<{
        items: import("../entities/cart.entity").CartItem[];
        itemCount: number;
        subtotal: number;
        total: number;
    }>;
    addToCart(addToCartDto: AddToCartDto, req: any): Promise<import("../entities/cart.entity").Cart>;
    updateCartItem(updateCartItemDto: UpdateCartItemDto, req: any): Promise<import("../entities/cart.entity").Cart>;
    removeFromCart(productId: string, req: any): Promise<import("../entities/cart.entity").Cart>;
    clearCart(req: any): Promise<import("../entities/cart.entity").Cart>;
}
