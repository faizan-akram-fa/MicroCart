import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { Cart, CartItem } from '../entities/cart.entity';
import { AddToCartDto, UpdateCartItemDto } from '../dto/cart.dto';
export declare class CartService {
    private cartRepository;
    private httpService;
    constructor(cartRepository: Repository<Cart>, httpService: HttpService);
    getCart(userId: string): Promise<Cart>;
    addToCart(userId: string, addToCartDto: AddToCartDto): Promise<Cart>;
    updateCartItem(userId: string, updateCartItemDto: UpdateCartItemDto): Promise<Cart>;
    removeFromCart(userId: string, productId: string): Promise<Cart>;
    clearCart(userId: string): Promise<Cart>;
    getCartTotal(userId: string): Promise<{
        items: CartItem[];
        itemCount: number;
        subtotal: number;
        total: number;
    }>;
}
