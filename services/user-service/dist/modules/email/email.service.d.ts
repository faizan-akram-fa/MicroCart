import { MailerService } from '@nestjs-modules/mailer';
export declare class EmailService {
    private mailerService;
    constructor(mailerService: MailerService);
    sendWelcomeEmail(email: string, name: string): Promise<void>;
    sendBuyerWelcomeEmail(email: string, name: string): Promise<void>;
    sendSellerWelcomeEmail(email: string, name: string): Promise<void>;
    sendSellerDecisionEmail(email: string, name: string, status: 'approved' | 'rejected', reason?: string): Promise<void>;
    sendPromotionalCampaign(emails: string[], subject: string, message: string): Promise<void>;
    sendOrderConfirmation(email: string, name: string, orderData: any): Promise<void>;
    sendOrderStatusUpdate(email: string, name: string, orderId: string, status: string): Promise<void>;
    sendLowStockAlert(email: string, name: string, productData: any): Promise<void>;
    sendOutOfStockAlert(email: string, name: string, productData: any): Promise<void>;
    sendSubAdminWelcomeEmail(email: string, name: string, passwordPlain: string, permissions: string[]): Promise<void>;
    sendOtpEmail(email: string, name: string, otp: string): Promise<void>;
    sendTemporaryPasswordEmail(email: string, name: string, temporaryPassword: string): Promise<void>;
}
