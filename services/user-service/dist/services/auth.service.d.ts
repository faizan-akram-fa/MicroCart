import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole, SellerStatus } from '../entities/user.entity';
import { ActivityLog } from '../entities/activity-log.entity';
import { RegisterDto, LoginDto, ResetPasswordDto, ForgotPasswordDto } from '../dto/user.dto';
import { EmailService } from '../modules/email/email.service';
export declare class AuthService implements OnModuleInit {
    private userRepository;
    private logRepository;
    private jwtService;
    private emailService;
    constructor(userRepository: Repository<User>, logRepository: Repository<ActivityLog>, jwtService: JwtService, emailService: EmailService);
    private logActivity;
    onModuleInit(): Promise<void>;
    private seedAdmin;
    register(registerDto: RegisterDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: UserRole;
            phone: string;
            profileImage: string;
            storeName: string;
            storeAddress: string;
            storeType: string;
            cnicNumber: string;
            sellerStatus: SellerStatus;
            rejectionReason: string;
            permissions: string[];
            mustChangePassword: boolean;
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            firstName: any;
            lastName: any;
            role: any;
            profileImage: any;
            phone: any;
            address: any;
            city: any;
            state: any;
            zipCode: any;
            country: any;
            storeName: any;
            storeAddress: any;
            storeType: any;
            cnicNumber: any;
            sellerStatus: any;
            rejectionReason: any;
            permissions: any;
            mustChangePassword: any;
        };
    }>;
    validateUser(userId: string): Promise<User>;
    googleLogin(googleUser: any): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: UserRole;
            profileImage: string;
            phone: string;
            address: string;
            city: string;
            state: string;
            zipCode: string;
            country: string;
            storeName: string;
            storeAddress: string;
            storeType: string;
            cnicNumber: string;
            sellerStatus: SellerStatus;
            rejectionReason: string;
            permissions: string[];
            mustChangePassword: boolean;
        };
    }>;
    forgotPassword(forgotDto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    verifyOtp(email: string, otp: string): Promise<{
        valid: boolean;
    }>;
    resetPassword(resetDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    setRole(userId: string, role: string): Promise<{
        message: string;
        user: {
            cnicNumber: string;
            id: string;
            email: string;
            password: string;
            firstName: string;
            lastName: string;
            role: UserRole;
            permissions: string[];
            phone: string;
            address: string;
            city: string;
            state: string;
            zipCode: string;
            country: string;
            preferredLanguage: string;
            preferredCurrency: string;
            profileImage: string;
            googleId: string;
            facebookId: string;
            storeName: string;
            storeAddress: string;
            storeType: string;
            cnicImage: string;
            sellerStatus: SellerStatus;
            rejectionReason: string;
            otp: string;
            otpExpiry: Date;
            mustChangePassword: boolean;
            isActive: boolean;
            isDeleted: boolean;
            deletedBy: string;
            createdAt: Date;
            updatedAt: Date;
        };
        access_token: string;
    }>;
}
