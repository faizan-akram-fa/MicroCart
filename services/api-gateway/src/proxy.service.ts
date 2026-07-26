import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as FormData from 'form-data';

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
    reqStream?: any,
  ): Promise<{ status: number; headers: any; data: any }> {
    const serviceUrl = this.services[service];
    const url = `${serviceUrl}/${path}`;

    try {
      // Clean up headers that might cause issues with proxying
      const cleanHeaders: any = {};
      if (headers?.authorization) cleanHeaders.authorization = headers.authorization;
      if (headers?.Authorization) cleanHeaders.authorization = headers.Authorization;
      if (headers?.['content-type']) cleanHeaders['content-type'] = headers['content-type'];
      if (headers?.['Content-Type']) cleanHeaders['content-type'] = headers['Content-Type'];
      if (headers?.['x-forwarded-host'] || headers?.host) cleanHeaders['x-forwarded-host'] = headers['x-forwarded-host'] || headers.host;
      if (headers?.['x-forwarded-proto']) cleanHeaders['x-forwarded-proto'] = headers['x-forwarded-proto'];

      const isMultipart = cleanHeaders['content-type']?.toLowerCase().includes('multipart/form-data');
      const files = reqStream?.files || (reqStream as any)?.files;

      // Rebuild FormData for multipart requests (guarantees clean binary file buffers + boundary parameters + Content-Length)
      if (isMultipart) {
        console.log(`[ProxyService] Rebuilding multipart request for ${url}, files count: ${files?.length || 0}`);
        const form = new FormData();

        if (files && Array.isArray(files)) {
          for (const file of files) {
            const safeContentType = (file.mimetype && file.mimetype !== 'application/octet-stream')
              ? file.mimetype
              : 'image/jpeg';
            form.append(file.fieldname, file.buffer, {
              filename: file.originalname || 'upload.jpg',
              contentType: safeContentType,
            });
          }
        }

        if (body && typeof body === 'object') {
          for (const key of Object.keys(body)) {
            if (body[key] !== undefined && body[key] !== null) {
              form.append(key, String(body[key]));
            }
          }
        }

        const formHeaders = form.getHeaders();
        const payloadBuffer = form.getBuffer();

        cleanHeaders['content-type'] = formHeaders['content-type'];
        cleanHeaders['content-length'] = String(payloadBuffer.length);

        const config: any = {
          method,
          url,
          headers: cleanHeaders,
          data: payloadBuffer,
          maxRedirects: 0,
          validateStatus: (status: number) => status >= 200 && status < 500,
        };

        console.log(`[ProxyService] Forwarding multipart ${method} ${url} (Buffer size: ${payloadBuffer.length} bytes)`);
        const response = await firstValueFrom(this.httpService.request(config));
        return {
          status: response.status,
          headers: response.headers,
          data: response.data,
        };
      }

      const isBinaryRequest = path.startsWith('uploads') || Boolean(path.match(/\.(png|jpg|jpeg|gif|webp|pdf|svg)$/i)) || cleanHeaders['accept']?.includes('image') || cleanHeaders['accept']?.includes('pdf');

      const config: any = {
        method,
        url,
        headers: cleanHeaders,
        responseType: isBinaryRequest ? 'arraybuffer' : 'json',
        maxRedirects: 0, // Don't follow redirects, let the gateway handle them
        validateStatus: (status: number) => status >= 200 && status < 500, // Include 2xx, 3xx, and 4xx responses
      };

      if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        config.data = body;
      }

      console.log(`[ProxyService] Forwarding ${method} ${url}`);
      const response = await firstValueFrom(this.httpService.request(config));
      const resContentType = (response.headers['content-type'] || response.headers['Content-Type'] || '').toLowerCase();
      let resData = response.data;

      // Parse JSON if received as arraybuffer for non-binary content
      if (Buffer.isBuffer(resData) && !resContentType.includes('image') && !resContentType.includes('pdf') && !path.startsWith('uploads')) {
        try {
          resData = JSON.parse(resData.toString('utf-8'));
        } catch (e) {
          resData = resData.toString('utf-8');
        }
      }

      return {
        status: response.status,
        headers: response.headers,
        data: resData,
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
