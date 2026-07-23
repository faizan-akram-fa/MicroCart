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
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const mailer_1 = require("@nestjs-modules/mailer");
let EmailService = class EmailService {
    constructor(mailerService) {
        this.mailerService = mailerService;
    }
    async sendWelcomeEmail(email, name) {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Welcome to MicroCart! 🎉',
                template: './welcome',
                context: {
                    name,
                },
            });
            console.log(`Welcome email sent to ${email}`);
        }
        catch (error) {
            console.error(`Failed to send welcome email to ${email}`, error);
        }
    }
    async sendBuyerWelcomeEmail(email, name) {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'You are all set to shop on MicroCart! 🛒',
                template: './welcome-buyer',
                context: { name },
            });
        }
        catch (e) {
            console.error(e);
        }
    }
    async sendSellerWelcomeEmail(email, name) {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Welcome to the MicroCart Seller Community! 🚀',
                template: './welcome-seller',
                context: { name },
            });
        }
        catch (e) {
            console.error(e);
        }
    }
    async sendSellerDecisionEmail(email, name, status, reason) {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: status === 'approved' ? 'Your Seller Account is Approved! 🎊' : 'Update Required for Your Seller Application',
                template: status === 'approved' ? './seller-approved' : './seller-rejected',
                context: {
                    name,
                    reason,
                },
            });
            console.log(`Seller decision email (${status}) sent to ${email}`);
        }
        catch (error) {
            console.error(`Failed to send seller decision email to ${email}`, error);
        }
    }
    async sendPromotionalCampaign(emails, subject, message) {
        try {
            await this.mailerService.sendMail({
                to: 'noreply@microcart.com',
                bcc: emails,
                subject: subject,
                template: './promotional',
                context: {
                    subject,
                    message,
                },
            });
            console.log(`Promotional email campaign sent to ${emails.length} recipients.`);
        }
        catch (error) {
            console.error('Failed to send promotional campaign', error);
            throw error;
        }
    }
    async sendOrderConfirmation(email, name, orderData) {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: `Order Confirmed - #${orderData.orderId} 📦`,
                template: './order-confirmation',
                context: {
                    name,
                    ...orderData,
                },
            });
            console.log(`Order confirmation email sent to ${email}`);
        }
        catch (error) {
            console.error(`Failed to send order confirmation to ${email}`, error);
        }
    }
    async sendOrderStatusUpdate(email, name, orderId, status) {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: `Shipping Update for Order #${orderId} 🚚`,
                template: './order-status-update',
                context: {
                    name,
                    orderId,
                    status: status.toUpperCase(),
                },
            });
            console.log(`Order status update sent to ${email}`);
        }
        catch (error) {
            console.error(`Failed to send order status update to ${email}`, error);
        }
    }
    async sendLowStockAlert(email, name, productData) {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: `Low Stock Alert: ${productData.productName} ⚠️`,
                template: './low-stock-alert',
                context: {
                    name,
                    ...productData,
                },
            });
            console.log(`Low stock alert sent to ${email} for product ${productData.productName}`);
        }
        catch (error) {
            console.error(`Failed to send low stock alert to ${email}`, error);
        }
    }
    async sendOutOfStockAlert(email, name, productData) {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: `Out of Stock Alert: ${productData.productName} 🚨`,
                template: './out-of-stock-alert',
                context: {
                    name,
                    ...productData,
                },
            });
            console.log(`Out of stock alert sent to ${email} for product ${productData.productName}`);
        }
        catch (error) {
            console.error(`Failed to send out of stock alert to ${email}`, error);
        }
    }
    async sendSubAdminWelcomeEmail(email, name, passwordPlain, permissions) {
        try {
            const formattedPermissions = (permissions || []).map(p => {
                switch (p) {
                    case 'MANAGE_USERS': return 'User Management';
                    case 'MANAGE_SELLERS': return 'Seller Application Review';
                    case 'MANAGE_INVENTORY': return 'Inventory Administration';
                    case 'VIEW_LOGS': return 'System Activity Logs';
                    case 'SEND_COMMUNICATIONS': return 'Promotional Email Campaigns';
                    case 'MANAGE_SUPPORT': return 'Support Center Management';
                    default: return p.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
                }
            });
            await this.mailerService.sendMail({
                to: email,
                subject: 'Welcome to the MicroCart Admin Team! 🛡️',
                template: './welcome-subadmin',
                context: {
                    name,
                    email,
                    password: passwordPlain,
                    permissions: formattedPermissions,
                },
            });
            console.log(`Sub-admin welcome email sent to ${email}`);
        }
        catch (error) {
            console.error(`Failed to send sub-admin welcome email to ${email}`, error);
        }
    }
    async sendOtpEmail(email, name, otp) {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Password Reset Verification Code - MicroCart 🔑',
                template: './forgot-password',
                context: {
                    name,
                    otp,
                },
            });
            console.log(`Password reset OTP email sent to ${email}`);
        }
        catch (error) {
            console.error(`Failed to send password reset OTP email to ${email}`, error);
        }
    }
    async sendTemporaryPasswordEmail(email, name, temporaryPassword) {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Your Password Has Been Reset - Temporary Password Issued 🔒',
                template: './reset-temp-password',
                context: {
                    name,
                    temporaryPassword,
                },
            });
            console.log(`Temporary password email sent to ${email}`);
        }
        catch (error) {
            console.error(`Failed to send temporary password email to ${email}`, error);
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mailer_1.MailerService])
], EmailService);
//# sourceMappingURL=email.service.js.map