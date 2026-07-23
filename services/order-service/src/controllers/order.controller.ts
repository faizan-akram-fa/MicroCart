import { Controller, Get, Post, Put, Body, Param, UseGuards, Req, ForbiddenException, Query, Headers } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderService } from '../services/order.service';
import { CreateOrderDto, UpdateOrderStatusDto } from '../dto/order.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('orders')
export class OrderController {
  constructor(
    private orderService: OrderService,
    private configService: ConfigService,
  ) {}

  @Post('stripe-webhook')
  async handleStripeWebhook(
    @Req() req,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.orderService.handleStripeWebhook(req.rawBody, signature);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createOrderDto: CreateOrderDto, @Req() req) {
    return this.orderService.create(createOrderDto, req.user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findByUser(@Req() req) {
    return this.orderService.findByUser(req.user.userId);
  }

  @Get('seller')
  @UseGuards(JwtAuthGuard)
  async findBySeller(@Req() req) {
    return this.orderService.findBySeller(req.user.userId);
  }

  @Get('seller/buyers')
  @UseGuards(JwtAuthGuard)
  async getSellerBuyers(@Req() req) {
    return this.orderService.getSellerBuyers(req.user.userId);
  }

  @Get('internal/:id')
  async findOneInternal(
    @Param('id') id: string,
    @Headers('x-internal-secret') internalSecret: string,
  ) {
    const secret = this.configService.get('INTERNAL_SERVICE_SECRET', 'microservices-secret-123');
    if (internalSecret !== secret) {
      throw new ForbiddenException('Invalid internal secret');
    }
    return this.orderService.findOne(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
    @Req() req,
  ) {
    return this.orderService.updateStatus(id, updateStatusDto, req.user.userId);
  }

  @Put(':id/cancel-payment')
  @UseGuards(JwtAuthGuard)
  async cancelPayment(
    @Param('id') id: string,
    @Req() req,
  ) {
    return this.orderService.cancelPayment(id, req.user.userId);
  }

  @Post(':id/confirm-payment')
  @UseGuards(JwtAuthGuard)
  async confirmWalletPayment(
    @Param('id') id: string,
    @Body('transactionReference') transactionReference: string,
    @Req() req,
  ) {
    return this.orderService.confirmWalletPayment(id, req.user.userId, transactionReference);
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard)
  async getAdminStats(@Req() req, @Query('period') period?: string) {
    // Basic role check since RolesGuard is complex to set up across all services now
    if (req.user.role !== 'admin' && req.user.role !== 'sub_admin') {
      throw new ForbiddenException('Forbidden: Admin access only');
    }
    return this.orderService.getAdminStats(period);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  async findAllAdmin(@Req() req) {
    if (req.user.role !== 'admin' && req.user.role !== 'sub_admin') {
      throw new ForbiddenException('Forbidden: Admin access only');
    }
    return this.orderService.findAll();
  }

  @Get('admin/transactions')
  @UseGuards(JwtAuthGuard)
  async getAllTransactions(@Req() req) {
    if (req.user.role !== 'admin' && req.user.role !== 'sub_admin') {
      throw new ForbiddenException('Forbidden: Admin access only');
    }
    return this.orderService.getAllTransactions();
  }
}

// Separate controller for internal service-to-service calls (no JWT)
@Controller('orders/internal')
export class OrderInternalController {
  constructor(
    private orderService: OrderService,
    private configService: ConfigService,
  ) {}

  @Get('verify-purchase/:userId/:productId')
  async verifyPurchase(
    @Param('userId') userId: string,
    @Param('productId') productId: string,
    @Req() req,
  ) {
    const secret = req.headers['x-internal-secret'];
    const expected = this.configService.get('INTERNAL_SERVICE_SECRET', 'microservices-secret-123');
    if (secret !== expected) {
      throw new ForbiddenException('Unauthorized internal access');
    }
    const purchased = await this.orderService.verifyPurchase(userId, productId);
    return { purchased };
  }
}
