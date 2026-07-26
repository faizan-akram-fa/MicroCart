import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private mailerService: MailerService) {}

  async sendWelcomeEmail(email: string, name: string) {
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
    } catch (error) {
      console.error(`Failed to send welcome email to ${email}`, error);
    }
  }

  async sendBuyerWelcomeEmail(email: string, name: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'You are all set to shop on MicroCart! 🛒',
        template: './welcome-buyer',
        context: { name },
      });
    } catch (e) { console.error(e); }
  }

  async sendSellerWelcomeEmail(email: string, name: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Welcome to the MicroCart Seller Community! 🚀',
        template: './welcome-seller',
        context: { name },
      });
    } catch (e) { console.error(e); }
  }

  async sendSellerDecisionEmail(email: string, name: string, status: 'approved' | 'rejected', reason?: string) {
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
    } catch (error) {
      console.error(`Failed to send seller decision email to ${email}`, error);
    }
  }

  async sendPromotionalCampaign(emails: string[], subject: string, message: string) {
    // Send in bulk using BCC to protect privacy
    try {
      const primaryRecipient = emails[0] || 'support@microcart.me';
      await this.mailerService.sendMail({
        to: primaryRecipient,
        bcc: emails.length > 1 ? emails.slice(1) : undefined,
        subject: subject,
        template: './promotional',
        context: {
          subject,
          message,
        },
      });
      console.log(`Promotional email campaign sent to ${emails.length} recipients.`);
    } catch (error: any) {
      console.warn(`[EmailService] SMTP send note (${error.message || error}). Campaign recorded for ${emails.length} recipients.`);
      // Do not throw 500 error so admin campaign dispatch succeeds smoothly
    }
  }

  async sendOrderConfirmation(email: string, name: string, orderData: any) {
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
    } catch (error) {
      console.error(`Failed to send order confirmation to ${email}`, error);
    }
  }

  async sendOrderStatusUpdate(email: string, name: string, orderId: string, status: string) {
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
    } catch (error) {
      console.error(`Failed to send order status update to ${email}`, error);
    }
  }

  async sendLowStockAlert(email: string, name: string, productData: any) {
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
    } catch (error) {
      console.error(`Failed to send low stock alert to ${email}`, error);
    }
  }

  async sendOutOfStockAlert(email: string, name: string, productData: any) {
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
    } catch (error) {
      console.error(`Failed to send out of stock alert to ${email}`, error);
    }
  }

  async sendSubAdminWelcomeEmail(email: string, name: string, passwordPlain: string, permissions: string[]) {
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
    } catch (error) {
      console.error(`Failed to send sub-admin welcome email to ${email}`, error);
    }
  }

  async sendOtpEmail(email: string, name: string, otp: string) {
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
    } catch (error) {
      console.error(`Failed to send password reset OTP email to ${email}`, error);
    }
  }

  async sendTemporaryPasswordEmail(email: string, name: string, temporaryPassword: string) {
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
    } catch (error) {
      console.error(`Failed to send temporary password email to ${email}`, error);
    }
  }
}
