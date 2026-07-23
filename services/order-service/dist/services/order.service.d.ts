import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CreateOrderDto, UpdateOrderStatusDto } from '../dto/order.dto';
import { PromotionService } from './promotion.service';
import { Transaction } from '../entities/transaction.entity';
export declare class OrderService {
    private orderRepository;
    private transactionRepository;
    private httpService;
    private configService;
    private promotionService;
    constructor(orderRepository: Repository<Order>, transactionRepository: Repository<Transaction>, httpService: HttpService, configService: ConfigService, promotionService: PromotionService);
    create(createOrderDto: CreateOrderDto, userId: string): Promise<{
        orders: any[];
        paymentUrl: any;
        requiresRedirect: boolean;
    }>;
    private sendOrderEmail;
    findByUser(userId: string): Promise<Order[]>;
    findBySeller(sellerId: string): Promise<Order[]>;
    getSellerBuyers(sellerId: string): Promise<string[]>;
    findOne(id: string): Promise<Order>;
    updateStatus(id: string, updateStatusDto: UpdateOrderStatusDto, sellerId: string): Promise<Order>;
    confirmWalletPayment(orderId: string, userId: string, transactionReference: string): Promise<Order>;
    findAll(): Promise<Order[]>;
    getAdminStats(period?: string): Promise<{
        totalRevenue: number;
        totalOrders: number;
        pendingOrders: number;
        completedOrders: number;
        averageOrderValue: number;
    }>;
    verifyPurchase(userId: string, productId: string): Promise<boolean>;
    getAllTransactions(): Promise<Transaction[]>;
    private processEasyPaisaPayment;
    private processJazzCashPayment;
    private processStripePayment;
    handleStripeWebhook(rawBody: Buffer, signature: string): Promise<any>;
    private confirmOrderPayment;
    cancelPayment(orderId: string, userId: string): Promise<Order>;
}
