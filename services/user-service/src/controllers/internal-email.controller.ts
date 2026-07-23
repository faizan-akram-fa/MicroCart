import { Controller, Post, Body, Headers, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { EmailService } from '../modules/email/email.service';
import { ConfigService } from '@nestjs/config';

@Controller('internal/email')
export class InternalEmailController {
  constructor(
    private emailService: EmailService,
    private configService: ConfigService
  ) {}

  private validateSecret(secret: string) {
    const internalSecret = this.configService.get('INTERNAL_SERVICE_SECRET', 'microservices-secret-123');
    if (secret !== internalSecret) {
      throw new UnauthorizedException('Invalid internal service secret');
    }
  }

  @Post('order-confirmation')
  async sendOrderConfirmation(
    @Headers('x-internal-secret') secret: string,
    @Body() data: { email: string; name: string; orderData: any }
  ) {
    this.validateSecret(secret);
    if (!data.email || !data.orderData) throw new BadRequestException('Missing required fields');
    
    return this.emailService.sendOrderConfirmation(data.email, data.name, data.orderData);
  }

  @Post('order-status-update')
  async sendOrderStatusUpdate(
    @Headers('x-internal-secret') secret: string,
    @Body() data: { email: string; name: string; orderId: string; status: string }
  ) {
    this.validateSecret(secret);
    if (!data.email || !data.orderId || !data.status) throw new BadRequestException('Missing required fields');
    
    return this.emailService.sendOrderStatusUpdate(data.email, data.name, data.orderId, data.status);
  }
  @Post('low-stock-alert')
  async sendLowStockAlert(
    @Headers('x-internal-secret') secret: string,
    @Body() data: { email: string; name: string; productData: any }
  ) {
    this.validateSecret(secret);
    if (!data.email || !data.productData) throw new BadRequestException('Missing required fields');
    
    return this.emailService.sendLowStockAlert(data.email, data.name, data.productData);
  }

  @Post('out-of-stock-alert')
  async sendOutOfStockAlert(
    @Headers('x-internal-secret') secret: string,
    @Body() data: { email: string; name: string; productData: any }
  ) {
    this.validateSecret(secret);
    if (!data.email || !data.productData) throw new BadRequestException('Missing required fields');
    
    return this.emailService.sendOutOfStockAlert(data.email, data.name, data.productData);
  }
}
