import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';
export declare class GatewayController {
    private proxyService;
    constructor(proxyService: ProxyService);
    proxyAuth(req: Request, res: Response): Promise<void | Response<any, Record<string, any>>>;
    proxyUsers(req: Request, res: Response): Promise<void | Response<any, Record<string, any>>>;
    proxyProducts(req: Request, res: Response): Promise<void | Response<any, Record<string, any>>>;
    proxyReviews(req: Request, res: Response): Promise<void | Response<any, Record<string, any>>>;
    proxyCart(req: Request, res: Response): Promise<void | Response<any, Record<string, any>>>;
    proxyOrders(req: Request, res: Response): Promise<void | Response<any, Record<string, any>>>;
    proxyWishlist(req: Request, res: Response): Promise<void | Response<any, Record<string, any>>>;
    proxySupport(req: Request, res: Response): Promise<void | Response<any, Record<string, any>>>;
    proxyAdmin(req: Request, res: Response): Promise<void | Response<any, Record<string, any>>>;
    proxyPromotions(req: Request, res: Response): Promise<void | Response<any, Record<string, any>>>;
    private proxy;
}
