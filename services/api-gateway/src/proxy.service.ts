import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProxyService {
  private services = {
    user: process.env.USER_SERVICE_URL || 'http://localhost:3001',
    product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
    cart: process.env.CART_SERVICE_URL || 'http://localhost:3003',
    order: process.env.ORDER_SERVICE_URL || 'http://localhost:3004',
    wishlist: process.env.WISHLIST_SERVICE_URL || 'http://localhost:3005',
    support: process.env.SUPPORT_SERVICE_URL || 'http://localhost:3006',
  };

  constructor(private httpService: HttpService) { }

  async proxyRequest(
    service: keyof typeof this.services,
    path: string,
    method: string,
    body?: any,
    headers?: any,
  ): Promise<{ status: number; headers: any; data: any }> {
    const serviceUrl = this.services[service];
    const url = `${serviceUrl}/${path}`;

    try {
      // Clean up headers that might cause issues with proxying
      const cleanHeaders: any = {};
      if (headers?.authorization) cleanHeaders.authorization = headers.authorization;
      if (headers?.Authorization) cleanHeaders.authorization = headers.Authorization;
      cleanHeaders['content-type'] = headers?.['content-type'] || headers?.['Content-Type'] || 'application/json';
      if (headers?.['x-forwarded-host'] || headers?.host) cleanHeaders['x-forwarded-host'] = headers['x-forwarded-host'] || headers.host;
      if (headers?.['x-forwarded-proto']) cleanHeaders['x-forwarded-proto'] = headers['x-forwarded-proto'];

      const config: any = {
        method,
        url,
        headers: cleanHeaders,
        maxRedirects: 0, // Don't follow redirects, let the gateway handle them
        validateStatus: (status: number) => status >= 200 && status < 500, // Include 2xx, 3xx, and 4xx responses
      };

      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.data = body;
      }

      console.log(`[ProxyService] Forwarding ${method} ${url} with body:`, JSON.stringify(body));
      const response = await firstValueFrom(this.httpService.request(config));
      console.log(`[ProxyService] Response ${response.status} from ${url}:`, JSON.stringify(response.data));
      return {
        status: response.status,
        headers: response.headers,
        data: response.data,
      };
    } catch (error: any) {
      console.error('[ProxyService] Axios error:', error.message);
      if (error.response) {
        console.error('[ProxyService] Error response data:', JSON.stringify(error.response.data));
        return {
          status: error.response.status,
          headers: error.response.headers,
          data: error.response.data,
        };
      }
      throw {
        statusCode: 503,
        message: 'Service unavailable',
        error: 'Service Unavailable',
      };
    }
  }
}
