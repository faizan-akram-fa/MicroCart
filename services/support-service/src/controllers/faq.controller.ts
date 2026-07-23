import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { FaqService } from '../services/faq.service';
import { CreateFaqDto, UpdateFaqDto } from '../dto/faq.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('support/faqs')
export class FaqController {
  constructor(private faqService: FaqService) {}

  @Get()
  async getActiveFaqs(@Query('category') category?: string) {
    return this.faqService.findAllActive(category);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'sub_admin')
  async getAllFaqs(@Req() req) {
    if (req.user.role === 'sub_admin' && !req.user.permissions?.includes('MANAGE_SUPPORT')) {
      throw new ForbiddenException('You do not have permission to manage FAQs');
    }
    return this.faqService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'sub_admin')
  async createFaq(@Body() createFaqDto: CreateFaqDto, @Req() req) {
    if (req.user.role === 'sub_admin' && !req.user.permissions?.includes('MANAGE_SUPPORT')) {
      throw new ForbiddenException('You do not have permission to manage FAQs');
    }
    return this.faqService.create(createFaqDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'sub_admin')
  async updateFaq(@Param('id') id: string, @Body() updateFaqDto: UpdateFaqDto, @Req() req) {
    if (req.user.role === 'sub_admin' && !req.user.permissions?.includes('MANAGE_SUPPORT')) {
      throw new ForbiddenException('You do not have permission to manage FAQs');
    }
    return this.faqService.update(id, updateFaqDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'sub_admin')
  async deleteFaq(@Param('id') id: string, @Req() req) {
    if (req.user.role === 'sub_admin' && !req.user.permissions?.includes('MANAGE_SUPPORT')) {
      throw new ForbiddenException('You do not have permission to manage FAQs');
    }
    await this.faqService.remove(id);
    return { message: 'FAQ deleted successfully' };
  }
}
