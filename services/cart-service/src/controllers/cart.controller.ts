import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CartService } from '../services/cart.service';
import { AddToCartDto, UpdateCartItemDto } from '../dto/cart.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  async getCart(@Req() req) {
    return this.cartService.getCart(req.user.userId);
  }

  @Get('total')
  async getCartTotal(@Req() req) {
    return this.cartService.getCartTotal(req.user.userId);
  }

  @Post('add')
  async addToCart(@Body() addToCartDto: AddToCartDto, @Req() req) {
    return this.cartService.addToCart(req.user.userId, addToCartDto);
  }

  @Put('update')
  async updateCartItem(@Body() updateCartItemDto: UpdateCartItemDto, @Req() req) {
    return this.cartService.updateCartItem(req.user.userId, updateCartItemDto);
  }

  @Delete('remove/:productId')
  async removeFromCart(@Param('productId') productId: string, @Req() req) {
    return this.cartService.removeFromCart(req.user.userId, productId);
  }

  @Delete('clear')
  async clearCart(@Req() req) {
    return this.cartService.clearCart(req.user.userId);
  }
}
