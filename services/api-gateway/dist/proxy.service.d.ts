import { HttpService } from '@nestjs/axios';
export declare class ProxyService {
    private httpService;
    private services;
    constructor(httpService: HttpService);
    proxyRequest(service: keyof typeof this.services, path: string, method: string, body?: any, headers?: any): Promise<{
        status: number;
        headers: any;
        data: any;
    }>;
}
