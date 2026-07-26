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
import { extname } from 'path';
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

  @All('uploads*')
  async proxyUploads(@Req() req: Request, @Res() res: Response) {
    return this.proxy('user', req, res);
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
        req,
      );

      // Handle redirects (e.g., for Google OAuth)
      if (result.status === 302 && result.headers.location) {
        return res.redirect(result.status, result.headers.location);
      }

      let contentType = (result.headers['content-type'] || result.headers['Content-Type'] || '').toLowerCase();
      const isUploadOrBinary = path.startsWith('uploads') || contentType.includes('image') || contentType.includes('pdf') || contentType.includes('octet-stream');

      if (isUploadOrBinary) {
        const buffer = Buffer.isBuffer(result.data)
          ? result.data
          : (result.data instanceof ArrayBuffer || ArrayBuffer.isView(result.data))
            ? Buffer.from(result.data as any)
            : typeof result.data === 'string'
              ? Buffer.from(result.data, 'binary')
              : Buffer.from(String(result.data), 'binary');

        // Dynamic Magic Byte Inspection (overrides wrong extensions or generic octet-stream headers)
        if (buffer && buffer.length >= 4) {
          if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
            contentType = 'image/png';
          } else if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
            contentType = 'image/jpeg';
          } else if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
            contentType = 'application/pdf';
          } else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
            contentType = 'image/gif';
          } else if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
            contentType = 'image/webp';
          }
        }

        if (!contentType || contentType.includes('json') || contentType.includes('octet-stream')) {
          const ext = extname(path).toLowerCase();
          if (ext === '.png') contentType = 'image/png';
          else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
          else if (ext === '.gif') contentType = 'image/gif';
          else if (ext === '.webp') contentType = 'image/webp';
          else if (ext === '.pdf') contentType = 'application/pdf';
          else if (ext === '.svg') contentType = 'image/svg+xml';
          else contentType = 'image/jpeg';
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Content-Length', String(buffer.length));
        return res.status(result.status).send(buffer);
      }

      if (contentType) {
        res.setHeader('Content-Type', contentType);
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
