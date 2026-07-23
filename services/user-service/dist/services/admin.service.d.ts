import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { ActivityLog } from '../entities/activity-log.entity';
import { EmailService } from '../modules/email/email.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
export declare class AdminService {
    private userRepository;
    private logRepository;
    private emailService;
    private httpService;
    private configService;
    constructor(userRepository: Repository<User>, logRepository: Repository<ActivityLog>, emailService: EmailService, httpService: HttpService, configService: ConfigService);
    getAllUsers(): Promise<User[]>;
    updateUserStatus(userId: string, isActive: boolean, adminId: string, adminEmail: string): Promise<{
        message: string;
    }>;
    deleteUser(userId: string, adminId: string, adminEmail: string): Promise<{
        message: string;
        user: User;
    }>;
    getPendingSellers(): Promise<User[]>;
    approveSeller(sellerId: string, adminId: string, adminEmail: string): Promise<{
        message: string;
        user: User;
    }>;
    rejectSeller(sellerId: string, reason: string, adminId: string, adminEmail: string): Promise<{
        message: string;
        user: User;
    }>;
    createSubAdmin(data: any, adminId: string, adminEmail: string): Promise<User>;
    updateSubAdmin(id: string, data: any, adminId: string, adminEmail: string): Promise<User>;
    deleteSubAdmin(id: string, adminId: string, adminEmail: string): Promise<{
        message: string;
    }>;
    getRecentActivity(): Promise<ActivityLog[]>;
    sendPromotionalEmail(data: {
        target: string;
        subject: string;
        message: string;
    }, adminId: string, adminEmail: string): Promise<{
        message: string;
    }>;
    getSellerBuyersDetails(sellerId: string, token: string): Promise<User[]>;
    sendSellerPromotionalEmail(data: {
        subject: string;
        message: string;
    }, sellerId: string, sellerEmail: string, token: string): Promise<{
        message: string;
    }>;
    resetUserPassword(userId: string, customPassword: string | undefined, adminId: string, adminEmail: string): Promise<{
        message: string;
    }>;
    getTechnicalLogs(): Promise<any[]>;
    private logActivity;
}
