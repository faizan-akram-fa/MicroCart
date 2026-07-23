import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { WishlistService } from '../services/wishlist.service';
import { AddToWishlistDto } from '../dto/wishlist.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private wishlistService: WishlistService) {}

  @Get()
  async getWishlist(@Req() req) {
    return this.wishlistService.getWishlist(req.user.userId);
  }

  @Post('add')
  async addToWishlist(@Body() addToWishlistDto: AddToWishlistDto, @Req() req) {
    return this.wishlistService.addToWishlist(req.user.userId, addToWishlistDto.productId);
  }

  @Delete('remove/:productId')
  async removeFromWishlist(@Param('productId') productId: string, @Req() req) {
    return this.wishlistService.removeFromWishlist(req.user.userId, productId);
  }
}
