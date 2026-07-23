import { AuthService } from '../services/auth.service';
import { RegisterDto, LoginDto, ResetPasswordDto, ForgotPasswordDto } from '../dto/user.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto, file: Express.Multer.File): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import("../entities/user.entity").UserRole;
            phone: string;
            profileImage: string;
            storeName: string;
            storeAddress: string;
            storeType: string;
            cnicNumber: string;
            sellerStatus: import("../entities/user.entity").SellerStatus;
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
    testError(): Promise<void>;
    googleAuth(): Promise<void>;
    googleAuthRedirect(req: any, res: any): Promise<any>;
    validateToken(req: any): Promise<{
        valid: boolean;
        user: any;
    }>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    verifyOtp(body: {
        email: string;
        otp: string;
    }): Promise<{
        valid: boolean;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    setRole(req: any, role: string): Promise<{
        message: string;
        user: {
            cnicNumber: string;
            id: string;
            email: string;
            password: string;
            firstName: string;
            lastName: string;
            role: import("../entities/user.entity").UserRole;
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
            sellerStatus: import("../entities/user.entity").SellerStatus;
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
