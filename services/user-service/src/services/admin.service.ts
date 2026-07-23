import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { User, UserRole, SellerStatus } from '../entities/user.entity';
import { ActivityLog } from '../entities/activity-log.entity';
import * as bcrypt from 'bcryptjs';
import { EmailService } from '../modules/email/email.service';
import { In } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ActivityLog)
    private logRepository: Repository<ActivityLog>,
    private emailService: EmailService,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async getAllUsers() {
    return this.userRepository.find({
      order: { createdAt: 'DESC' },
      select: [
        'id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt', 
        'profileImage', 'permissions', 'phone', 'address', 'city', 'state', 
        'zipCode', 'country', 'storeName', 'storeAddress', 'storeType', 
        'cnicNumber', 'sellerStatus', 'isDeleted', 'deletedBy'
      ],
    });
  }

  async updateUserStatus(userId: string, isActive: boolean, adminId: string, adminEmail: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    
    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Cannot modify status of another primary admin');
    }

    user.isActive = isActive;
    // If restoring status from deleted state
    if (isActive && user.isDeleted) {
      user.isDeleted = false;
      user.deletedBy = null as any;
    }
    await this.userRepository.save(user);

    await this.logActivity(adminId, adminEmail, isActive ? 'ACTIVATE_USER' : 'BLOCK_USER', userId, `User ${user.email} status changed to ${isActive}`);
    
    return { message: `User ${isActive ? 'activated' : 'blocked'} successfully` };
  }

  async deleteUser(userId: string, adminId: string, adminEmail: string) {
    if (userId === adminId) throw new ForbiddenException('Cannot delete yourself');

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Cannot delete a primary super admin account');
    }

    user.isDeleted = true;
    user.isActive = false;
    user.deletedBy = adminEmail || 'Admin';
    await this.userRepository.save(user);

    await this.logActivity(adminId, adminEmail, 'DELETE_USER', userId, `Soft deleted user account ${user.email} by ${adminEmail}`);

    return { message: `User ${user.email} marked as deleted successfully`, user };
  }

  async getPendingSellers() {
    return this.userRepository.find({
      where: { role: UserRole.SELLER, sellerStatus: SellerStatus.PENDING },
      order: { createdAt: 'DESC' },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt', 'profileImage', 'phone', 'storeName', 'storeAddress', 'storeType', 'cnicNumber', 'cnicImage', 'sellerStatus'],
    });
  }

  async approveSeller(sellerId: string, adminId: string, adminEmail: string) {
    try {
      const user = await this.userRepository.findOne({ where: { id: sellerId, role: UserRole.SELLER } });
      if (!user) throw new NotFoundException('Seller not found or does not have SELLER role');

      user.sellerStatus = SellerStatus.APPROVED;
      user.rejectionReason = null;
      await this.userRepository.save(user);

      await this.logActivity(adminId, adminEmail, 'APPROVE_SELLER', sellerId, `Approved seller: ${user.email}`);

      // Send Approval Email
      this.emailService.sendSellerDecisionEmail(user.email, `${user.firstName} ${user.lastName}`, 'approved');

      return { message: 'Seller approved successfully', user };
    } catch (error: any) {
      throw new BadRequestException('Approval failed: ' + error.message);
    }
  }

  async rejectSeller(sellerId: string, reason: string, adminId: string, adminEmail: string) {
    const user = await this.userRepository.findOne({ where: { id: sellerId, role: UserRole.SELLER } });
    if (!user) throw new NotFoundException('Seller not found');

    user.sellerStatus = SellerStatus.REJECTED;
    user.rejectionReason = reason;
    await this.userRepository.save(user);

    await this.logActivity(adminId, adminEmail, 'REJECT_SELLER', sellerId, `Rejected seller: ${user.email}. Reason: ${reason}`);

    // Send Rejection Email
    this.emailService.sendSellerDecisionEmail(user.email, `${user.firstName} ${user.lastName}`, 'rejected', reason);

    return { message: 'Seller rejected successfully', user };
  }

  async createSubAdmin(data: any, adminId: string, adminEmail: string) {
    const existing = await this.userRepository.findOne({ where: { email: data.email } });
    if (existing) throw new ForbiddenException('Email already in use');

    if (data.phone) {
      const existingPhone = await this.userRepository.findOne({ where: { phone: data.phone } });
      if (existingPhone) throw new BadRequestException('Phone number already in use');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const subAdmin = this.userRepository.create({
      ...data,
      password: hashedPassword,
      role: UserRole.SUB_ADMIN,
      isActive: true,
      profileImage: `https://ui-avatars.com/api/?name=${data.firstName}+${data.lastName}&background=6366f1&color=fff`,
    } as Partial<User>);

    await this.userRepository.save(subAdmin);
    await this.logActivity(adminId, adminEmail, 'CREATE_SUB_ADMIN', subAdmin.id, `Created sub-admin: ${data.email}`);

    // Send Welcome Email
    this.emailService.sendSubAdminWelcomeEmail(
      subAdmin.email,
      `${subAdmin.firstName} ${subAdmin.lastName}`.trim(),
      data.password,
      subAdmin.permissions || [],
    );

    return subAdmin;
  }

  async updateSubAdmin(id: string, data: any, adminId: string, adminEmail: string) {
    const subAdmin = await this.userRepository.findOne({ where: { id, role: UserRole.SUB_ADMIN } });
    if (!subAdmin) throw new NotFoundException('Sub-Admin not found');

    if (data.email && data.email !== subAdmin.email) {
      const existing = await this.userRepository.findOne({ where: { email: data.email, id: Not(id) } });
      if (existing) throw new ForbiddenException('Email already in use');
    }

    if (data.phone && data.phone !== subAdmin.phone) {
      const existingPhone = await this.userRepository.findOne({ where: { phone: data.phone, id: Not(id) } });
      if (existingPhone) throw new BadRequestException('Phone number already in use');
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    } else {
      delete data.password;
    }

    Object.assign(subAdmin, data);
    await this.userRepository.save(subAdmin);

    await this.logActivity(adminId, adminEmail, 'UPDATE_SUB_ADMIN', id, `Updated sub-admin: ${subAdmin.email}`);
    return subAdmin;
  }

  async deleteSubAdmin(id: string, adminId: string, adminEmail: string) {
    if (id === adminId) throw new ForbiddenException('Cannot delete yourself');
    
    const subAdmin = await this.userRepository.findOne({ where: { id, role: UserRole.SUB_ADMIN } });
    if (!subAdmin) throw new NotFoundException('Sub-Admin not found');

    const email = subAdmin.email;
    await this.userRepository.remove(subAdmin);

    await this.logActivity(adminId, adminEmail, 'DELETE_SUB_ADMIN', id, `Deleted sub-admin: ${email}`);
    return { message: 'Sub-Admin deleted successfully' };
  }

  async getRecentActivity() {
    return this.logRepository.find({
      order: { timestamp: 'DESC' },
      take: 50,
    });
  }

  async sendPromotionalEmail(data: { target: string, subject: string, message: string }, adminId: string, adminEmail: string) {
    let users = [];
    
    if (data.target === 'all') {
      users = await this.userRepository.find({ select: ['email'] });
    } else if (data.target === 'buyers') {
      users = await this.userRepository.find({ where: { role: UserRole.BUYER }, select: ['email'] });
    } else if (data.target === 'sellers') {
      users = await this.userRepository.find({ where: { role: UserRole.SELLER }, select: ['email'] });
    } else {
      // If it's a specific email
      users = [{ email: data.target }];
    }

    const emailList = users.map(u => u.email).filter(e => !!e);
    
    if (emailList.length === 0) {
      throw new BadRequestException('No recipients found for the selected target.');
    }

    await this.emailService.sendPromotionalCampaign(emailList, data.subject, data.message);

    await this.logActivity(adminId, adminEmail, 'SEND_PROMOTIONAL_EMAIL', 'MULTIPLE', `Sent campaign "${data.subject}" to ${emailList.length} recipients`);

    return { message: `Campaign sent successfully to ${emailList.length} recipients` };
  }

  async getSellerBuyersDetails(sellerId: string, token: string) {
    const orderServiceUrl = this.configService.get('ORDER_SERVICE_URL', 'http://localhost:3004');
    
    try {
      const buyersRes = await firstValueFrom(
        this.httpService.get<string[]>(`${orderServiceUrl}/orders/seller/buyers`, {
          headers: { Authorization: token }
        })
      );
      
      const buyerIds = buyersRes.data;
      if (!buyerIds || buyerIds.length === 0) {
        return [];
      }

      const users = await this.userRepository.find({
        where: { id: In(buyerIds) },
        select: ['id', 'firstName', 'lastName', 'email', 'profileImage', 'createdAt']
      });

      return users;
    } catch (error: any) {
      console.error('Failed to get seller buyers details:', error.response?.data || error.message);
      throw new BadRequestException('Failed to fetch loyal customers.');
    }
  }

  async sendSellerPromotionalEmail(data: { subject: string, message: string }, sellerId: string, sellerEmail: string, token: string) {
    const orderServiceUrl = this.configService.get('ORDER_SERVICE_URL', 'http://localhost:3004');
    
    try {
      // 1. Get buyer IDs from order-service who purchased from this seller
      const buyersRes = await firstValueFrom(
        this.httpService.get<string[]>(`${orderServiceUrl}/orders/seller/buyers`, {
          headers: { Authorization: token }
        })
      );
      
      const buyerIds = buyersRes.data;
      if (!buyerIds || buyerIds.length === 0) {
        throw new BadRequestException('No buyers found who have purchased from your store.');
      }

      // 2. Get emails for these buyer IDs
      const users = await this.userRepository.find({
        where: { id: In(buyerIds) },
        select: ['email']
      });

      const emailList = users.map(u => u.email).filter(e => !!e);
      if (emailList.length === 0) {
        throw new BadRequestException('No valid email addresses found for your customers.');
      }

      // 3. Send promotional emails
      await this.emailService.sendPromotionalCampaign(emailList, data.subject, data.message);

      // 4. Log activity
      await this.logActivity(sellerId, sellerEmail, 'SEND_SELLER_PROMOTION', 'MULTIPLE', `Seller sent campaign "${data.subject}" to ${emailList.length} customers`);

      return { message: `Campaign sent successfully to ${emailList.length} customers` };
    } catch (error: any) {
      console.error('Failed to send seller promotion:', error.response?.data || error.message);
      throw new BadRequestException(error.response?.data?.message || 'Failed to send promotional campaign to your customers.');
    }
  }

  async resetUserPassword(userId: string, customPassword: string | undefined, adminId: string, adminEmail: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Cannot reset password of another primary admin');
    }

    // Generate a temporary password or use the custom one
    const passwordToUse = (customPassword && customPassword.trim().length > 0)
      ? customPassword.trim()
      : Math.random().toString(36).slice(-8) + Math.floor(1000 + Math.random() * 9000).toString();

    const hashedPassword = await bcrypt.hash(passwordToUse, 10);

    user.password = hashedPassword;
    user.mustChangePassword = true; // Mark as must change password
    await this.userRepository.save(user);

    // Send email with password
    await this.emailService.sendTemporaryPasswordEmail(
      user.email,
      `${user.firstName} ${user.lastName}`.trim(),
      passwordToUse
    );

    await this.logActivity(
      adminId,
      adminEmail,
      'RESET_USER_PASSWORD',
      userId,
      `Admin reset password for user ${user.email}`
    );

    return { message: 'Password reset successfully. An email has been sent with the password.' };
  }

  async getTechnicalLogs() {
    try {
      const lokiUrl = 'http://loki:3100/loki/api/v1/query_range';
      const response = await firstValueFrom(
        this.httpService.get(lokiUrl, {
          params: {
            query: '{service=~".+"}',
            limit: 100,
          },
        }),
      );

      const logs: any[] = [];
      const streams = response.data?.data?.result || [];

      for (const streamObj of streams) {
        const service = streamObj.stream?.service || streamObj.stream?.container || 'microservice';
        const values = streamObj.values || [];

        for (const [nanoTs, message] of values) {
          const timestampMs = Math.floor(parseInt(nanoTs, 10) / 1000000);
          const dateObj = new Date(timestampMs);

          let type = 'info';
          if (message.match(/error|fail|exception/i)) {
            type = 'error';
          } else if (message.match(/warn/i)) {
            type = 'warn';
          }

          logs.push({
            id: nanoTs,
            type,
            service,
            msg: message.trim(),
            time: dateObj.toLocaleTimeString(),
            timestamp: dateObj.toISOString(),
          });
        }
      }

      // Sort newest logs first
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return logs.slice(0, 100);
    } catch (error: any) {
      console.error('Failed to fetch technical logs from Loki:', error?.message);
      return [
        { id: '1', type: 'info', service: 'API Gateway', msg: 'System monitoring streaming live', time: new Date().toLocaleTimeString(), timestamp: new Date().toISOString() }
      ];
    }
  }

  private async logActivity(userId: string, userEmail: string, action: string, targetId: string, details: string) {
    const log = this.logRepository.create({
      userId,
      userEmail,
      action,
      targetId,
      details,
    });
    await this.logRepository.save(log);
  }
}
