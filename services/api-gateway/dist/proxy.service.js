"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let ProxyService = class ProxyService {
    constructor(httpService) {
        this.httpService = httpService;
        this.services = {
            user: process.env.USER_SERVICE_URL || 'http://user-service:3001',
            product: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002',
            cart: process.env.CART_SERVICE_URL || 'http://cart-service:3003',
            order: process.env.ORDER_SERVICE_URL || 'http://order-service:3004',
            wishlist: process.env.WISHLIST_SERVICE_URL || 'http://wishlist-service:3005',
            support: process.env.SUPPORT_SERVICE_URL || 'http://support-service:3006',
        };
    }
    async proxyRequest(service, path, method, body, headers) {
        const serviceUrl = this.services[service];
        const url = `${serviceUrl}/${path}`;
        try {
            const cleanHeaders = {};
            if (headers?.authorization)
                cleanHeaders.authorization = headers.authorization;
            if (headers?.Authorization)
                cleanHeaders.authorization = headers.Authorization;
            cleanHeaders['content-type'] = headers?.['content-type'] || headers?.['Content-Type'] || 'application/json';
            const config = {
                method,
                url,
                headers: cleanHeaders,
                maxRedirects: 0,
                validateStatus: (status) => status >= 200 && status < 500,
            };
            if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                config.data = body;
            }
            console.log(`[ProxyService] Forwarding ${method} ${url} with body:`, JSON.stringify(body));
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.request(config));
            console.log(`[ProxyService] Response ${response.status} from ${url}:`, JSON.stringify(response.data));
            return {
                status: response.status,
                headers: response.headers,
                data: response.data,
            };
        }
        catch (error) {
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
};
exports.ProxyService = ProxyService;
exports.ProxyService = ProxyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], ProxyService);
//# sourceMappingURL=proxy.service.js.map