"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const cart_entity_1 = require("../entities/cart.entity");
let CartService = class CartService {
    constructor(cartRepository, httpService) {
        this.cartRepository = cartRepository;
        this.httpService = httpService;
    }
    async getCart(userId) {
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
                    const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${productServiceUrl}/products/${item.productId}`));
                    if (response.data && response.data.stock !== undefined) {
                        if (item.stock !== response.data.stock) {
                            item.stock = response.data.stock;
                            hasChanges = true;
                        }
                    }
                }
                catch (error) {
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
    async addToCart(userId, addToCartDto) {
        const cart = await this.getCart(userId);
        const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${productServiceUrl}/products/${addToCartDto.productId}`));
            const product = response.data;
            const existingItemIndex = cart.items.findIndex((item) => item.productId === addToCartDto.productId);
            if (existingItemIndex > -1) {
                const newQuantity = cart.items[existingItemIndex].quantity + addToCartDto.quantity;
                if (product.stock !== undefined && newQuantity > product.stock) {
                    throw new common_1.BadRequestException(`Only ${product.stock} items in stock`);
                }
                cart.items[existingItemIndex].quantity = newQuantity;
                cart.items[existingItemIndex].stock = product.stock;
            }
            else {
                if (product.stock !== undefined && addToCartDto.quantity > product.stock) {
                    throw new common_1.BadRequestException(`Only ${product.stock} items in stock`);
                }
                const newItem = {
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
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.NotFoundException('Product not found');
        }
    }
    async updateCartItem(userId, updateCartItemDto) {
        const cart = await this.getCart(userId);
        const itemIndex = cart.items.findIndex((item) => item.productId === updateCartItemDto.productId);
        if (itemIndex === -1) {
            throw new common_1.NotFoundException('Item not found in cart');
        }
        const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${productServiceUrl}/products/${updateCartItemDto.productId}`));
            const product = response.data;
            if (updateCartItemDto.quantity > 0 && product.stock !== undefined && updateCartItemDto.quantity > product.stock) {
                throw new common_1.BadRequestException(`Only ${product.stock} items in stock`);
            }
            cart.items[itemIndex].stock = product.stock;
            if (updateCartItemDto.quantity === 0) {
                cart.items.splice(itemIndex, 1);
            }
            else {
                cart.items[itemIndex].quantity = updateCartItemDto.quantity;
            }
            await this.cartRepository.save(cart);
            return cart;
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            if (updateCartItemDto.quantity === 0) {
                cart.items.splice(itemIndex, 1);
                await this.cartRepository.save(cart);
                return cart;
            }
            throw new common_1.NotFoundException('Product not found or unavailable');
        }
    }
    async removeFromCart(userId, productId) {
        const cart = await this.getCart(userId);
        cart.items = cart.items.filter((item) => item.productId !== productId);
        await this.cartRepository.save(cart);
        return cart;
    }
    async clearCart(userId) {
        const cart = await this.getCart(userId);
        cart.items = [];
        await this.cartRepository.save(cart);
        return cart;
    }
    async getCartTotal(userId) {
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
};
exports.CartService = CartService;
exports.CartService = CartService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cart_entity_1.Cart)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        axios_1.HttpService])
], CartService);
//# sourceMappingURL=cart.service.js.map