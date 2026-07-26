import {
  Controller,
  All,
  Get,
  Req,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';

@Controller()
export class GatewayController {
  constructor(private proxyService: ProxyService) { }

  @Get('health')
  healthCheck() {
    return { status: 'ok', service: 'api-gateway' };
  }

  @All('auth*')
  async proxyAuth(@Req() req: Request, @Res() res: Response) {
    return this.proxy('user', req, res);
  }

  @All('users*')
  async proxyUsers(@Req() req: Request, @Res() res: Response) {
    return this.proxy('user', req, res);
  }

  @All('products*')
  async proxyProducts(@Req() req: Request, @Res() res: Response) {
    return this.proxy('product', req, res);
  }

  @All('reviews*')
  async proxyReviews(@Req() req: Request, @Res() res: Response) {
    return this.proxy('product', req, res);
  }

  @All('cart*')
  async proxyCart(@Req() req: Request, @Res() res: Response) {
    return this.proxy('cart', req, res);
  }

  @All('orders*')
  async proxyOrders(@Req() req: Request, @Res() res: Response) {
    return this.proxy('order', req, res);
  }

  @All('wishlist*')
  async proxyWishlist(@Req() req: Request, @Res() res: Response) {
    return this.proxy('wishlist', req, res);
  }

  @All('support*')
  async proxySupport(@Req() req: Request, @Res() res: Response) {
    return this.proxy('support', req, res);
  }

  @All('admin*')
  async proxyAdmin(@Req() req: Request, @Res() res: Response) {
    return this.proxy('user', req, res);
  }

  @All('promotions*')
  async proxyPromotions(@Req() req: Request, @Res() res: Response) {
    return this.proxy('order', req, res);
  }

  private async proxy(
    service: 'user' | 'product' | 'cart' | 'order' | 'wishlist' | 'support',
    req: Request,
    res: Response,
  ) {
    try {
      const rawUrl = req.originalUrl || req.url;
      const path = rawUrl.replace(/^(\/api)+/, '').replace(/^\//, '');
      console.log(`[GatewayController] Proxying ${req.method} ${rawUrl} -> service: ${service}, path: ${path}`);

      const result = await this.proxyService.proxyRequest(
        service,
        path,
        req.method,
        req.body,
        req.headers,
      );

      // Handle redirects (e.g., for Google OAuth)
      if (result.status === 302 && result.headers.location) {
        return res.redirect(result.status, result.headers.location);
      }

      return res.status(result.status).json(result.data);
    } catch (error: any) {
      const status = error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(status).json({
        statusCode: status,
        message: error.message || 'Internal server error',
        error: error.error || 'Error',
      });
    }
  }
}
