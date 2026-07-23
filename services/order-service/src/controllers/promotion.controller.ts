import { Controller, Get, Post, Body, Param, Put, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { PromotionService } from '../services/promotion.service';
import { CreatePromotionDto, ValidatePromotionDto } from '../dto/promotion.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('promotions')
@UseGuards(JwtAuthGuard)
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Post()
  async create(@Body() createDto: CreatePromotionDto, @Req() req: any) {
    const user = req.user;
    const role = user.role;
    if (role === 'sub_admin' && !user.permissions?.includes('MANAGE_PROMOTIONS')) {
      throw new ForbiddenException('You do not have permission to create promotions');
    }
    const isAdmin = role === 'admin' || role === 'sub_admin';
    return this.promotionService.create(createDto, user.userId, isAdmin);
  }

  @Get()
  async findAll(@Req() req: any) {
    const user = req.user;
    const role = user.role;
    if (role === 'sub_admin' && !user.permissions?.includes('MANAGE_PROMOTIONS')) {
      throw new ForbiddenException('You do not have permission to view promotions');
    }
    const isAdmin = role === 'admin' || role === 'sub_admin';
    return this.promotionService.findAll(user.userId, isAdmin);
  }

  @Put(':id/toggle')
  async toggleStatus(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    const role = user.role;
    if (role === 'sub_admin' && !user.permissions?.includes('MANAGE_PROMOTIONS')) {
      throw new ForbiddenException('You do not have permission to toggle promotions');
    }
    const isAdmin = role === 'admin' || role === 'sub_admin';
    return this.promotionService.toggleStatus(id, user.userId, isAdmin);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: any, @Req() req: any) {
    const user = req.user;
    const role = user.role;
    if (role === 'sub_admin' && !user.permissions?.includes('MANAGE_PROMOTIONS')) {
      throw new ForbiddenException('You do not have permission to edit promotions');
    }
    const isAdmin = role === 'admin' || role === 'sub_admin';
    return this.promotionService.update(id, updateDto, user.userId, isAdmin);
  }

  @Post('validate')
  async validate(@Body() validateDto: ValidatePromotionDto) {
    return this.promotionService.validate(validateDto);
  }
}
