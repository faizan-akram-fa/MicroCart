import { EmailService } from '../modules/email/email.service';
import { ConfigService } from '@nestjs/config';
export declare class InternalEmailController {
    private emailService;
    private configService;
    constructor(emailService: EmailService, configService: ConfigService);
    private validateSecret;
    sendOrderConfirmation(secret: string, data: {
        email: string;
        name: string;
        orderData: any;
    }): Promise<void>;
    sendOrderStatusUpdate(secret: string, data: {
        email: string;
        name: string;
        orderId: string;
        status: string;
    }): Promise<void>;
    sendLowStockAlert(secret: string, data: {
        email: string;
        name: string;
        productData: any;
    }): Promise<void>;
    sendOutOfStockAlert(secret: string, data: {
        email: string;
        name: string;
        productData: any;
    }): Promise<void>;
}
