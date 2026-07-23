import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Cart, CartItem } from '../entities/cart.entity';
import { AddToCartDto, UpdateCartItemDto } from '../dto/cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    private httpService: HttpService,
  ) { }

  async getCart(userId: string) {
    let cart = await this.cartRepository.findOne({
      where: { userId },
    });

    if (!cart) {
      cart = this.cartRepository.create({
        userId,
        items: [],
      });
      await this.cartRepository.save(cart);
    }

    if (cart.items && cart.items.length > 0) {
      const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
      let hasChanges = false;

      await Promise.all(cart.items.map(async (item) => {
        try {
          const response = await firstValueFrom(
            this.httpService.get(`${productServiceUrl}/products/${item.productId}`)
          );
          if (response.data && response.data.stock !== undefined) {
            if (item.stock !== response.data.stock) {
              item.stock = response.data.stock;
              hasChanges = true;
            }
          }
        } catch (error) {
          // If product fetch fails (deleted/unavailable)
          if (item.stock !== 0) {
            item.stock = 0;
            hasChanges = true;
          }
        }
      }));

      if (hasChanges) {
        await this.cartRepository.save(cart);
      }
    }

    return cart;
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    const cart = await this.getCart(userId);

    // Fetch product details from product service
    const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${productServiceUrl}/products/${addToCartDto.productId}`),
      );
      const product = response.data;

      // Check if product already in cart
      const existingItemIndex = cart.items.findIndex(
        (item) => item.productId === addToCartDto.productId,
      );

      if (existingItemIndex > -1) {
        const newQuantity = cart.items[existingItemIndex].quantity + addToCartDto.quantity;
        if (product.stock !== undefined && newQuantity > product.stock) {
          throw new BadRequestException(`Only ${product.stock} items in stock`);
        }
        cart.items[existingItemIndex].quantity = newQuantity;
        cart.items[existingItemIndex].stock = product.stock;
      } else {
        if (product.stock !== undefined && addToCartDto.quantity > product.stock) {
          throw new BadRequestException(`Only ${product.stock} items in stock`);
        }
        const newItem: CartItem = {
          productId: product.id,
          quantity: addToCartDto.quantity,
          price: (product.isOnSale && product.salePrice) ? product.salePrice : product.price,
          name: product.name,
          description: product.description,
          image: product.images?.[0],
          sellerId: addToCartDto.sellerId || product.sellerId,
          stock: product.stock,
        };
        cart.items.push(newItem);
      }

      await this.cartRepository.save(cart);
      return cart;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new NotFoundException('Product not found');
    }
  }

  async updateCartItem(userId: string, updateCartItemDto: UpdateCartItemDto) {
    const cart = await this.getCart(userId);

    const itemIndex = cart.items.findIndex(
      (item) => item.productId === updateCartItemDto.productId,
    );

    if (itemIndex === -1) {
      throw new NotFoundException('Item not found in cart');
    }

    const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${productServiceUrl}/products/${updateCartItemDto.productId}`),
      );
      const product = response.data;

      if (updateCartItemDto.quantity > 0 && product.stock !== undefined && updateCartItemDto.quantity > product.stock) {
        throw new BadRequestException(`Only ${product.stock} items in stock`);
      }

      cart.items[itemIndex].stock = product.stock;

      if (updateCartItemDto.quantity === 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = updateCartItemDto.quantity;
      }

      await this.cartRepository.save(cart);
      return cart;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      // Allow deletion even if product fetch fails
      if (updateCartItemDto.quantity === 0) {
        cart.items.splice(itemIndex, 1);
        await this.cartRepository.save(cart);
        return cart;
      }
      throw new NotFoundException('Product not found or unavailable');
    }
  }

  async removeFromCart(userId: string, productId: string) {
    const cart = await this.getCart(userId);

    cart.items = cart.items.filter((item) => item.productId !== productId);

    await this.cartRepository.save(cart);
    return cart;
  }

  async clearCart(userId: string) {
    const cart = await this.getCart(userId);
    cart.items = [];
    await this.cartRepository.save(cart);
    return cart;
  }

  async getCartTotal(userId: string) {
    const cart = await this.getCart(userId);

    const total = cart.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    return {
      items: cart.items,
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: total,
      total: total,
    };
  }
}
