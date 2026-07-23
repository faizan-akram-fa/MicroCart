import { ConfigService } from '@nestjs/config';
import { OrderService } from '../services/order.service';
import { CreateOrderDto, UpdateOrderStatusDto } from '../dto/order.dto';
export declare class OrderController {
    private orderService;
    private configService;
    constructor(orderService: OrderService, configService: ConfigService);
    handleStripeWebhook(req: any, signature: string): Promise<any>;
    create(createOrderDto: CreateOrderDto, req: any): Promise<{
        orders: any[];
        paymentUrl: any;
        requiresRedirect: boolean;
    }>;
    findByUser(req: any): Promise<import("../entities/order.entity").Order[]>;
    findBySeller(req: any): Promise<import("../entities/order.entity").Order[]>;
    getSellerBuyers(req: any): Promise<string[]>;
    findOneInternal(id: string, internalSecret: string): Promise<import("../entities/order.entity").Order>;
    findOne(id: string): Promise<import("../entities/order.entity").Order>;
    updateStatus(id: string, updateStatusDto: UpdateOrderStatusDto, req: any): Promise<import("../entities/order.entity").Order>;
    cancelPayment(id: string, req: any): Promise<import("../entities/order.entity").Order>;
    confirmWalletPayment(id: string, transactionReference: string, req: any): Promise<import("../entities/order.entity").Order>;
    getAdminStats(req: any, period?: string): Promise<{
        totalRevenue: number;
        totalOrders: number;
        pendingOrders: number;
        completedOrders: number;
        averageOrderValue: number;
    }>;
    findAllAdmin(req: any): Promise<import("../entities/order.entity").Order[]>;
    getAllTransactions(req: any): Promise<import("../entities/transaction.entity").Transaction[]>;
}
export declare class OrderInternalController {
    private orderService;
    private configService;
    constructor(orderService: OrderService, configService: ConfigService);
    verifyPurchase(userId: string, productId: string, req: any): Promise<{
        purchased: boolean;
    }>;
}
