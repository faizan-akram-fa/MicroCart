import { UserRole } from '../entities/user.entity';
export declare class RegisterDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
    phone?: string;
    googleId?: string;
    facebookId?: string;
    storeName?: string;
    storeAddress?: string;
    storeType?: string;
    cnicNumber?: string;
    cnicImage?: any;
}
export declare class LoginDto {
    email?: string;
    phone?: string;
    password: string;
}
export declare class UpdateProfileDto {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    preferredLanguage?: string;
    preferredCurrency?: string;
    profileImage?: string;
    storeName?: string;
    storeAddress?: string;
    storeType?: string;
    cnicNumber?: string;
}
export declare class GoogleAuthDto {
    token: string;
}
export declare class ChangePasswordDto {
    oldPassword: string;
    newPassword: string;
}
export declare class ForgotPasswordDto {
    email: string;
}
export declare class ResetPasswordDto {
    email: string;
    otp: string;
    newPassword: string;
}
