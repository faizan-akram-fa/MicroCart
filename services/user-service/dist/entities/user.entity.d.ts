export declare enum UserRole {
    BUYER = "buyer",
    SELLER = "seller",
    ADMIN = "admin",
    SUB_ADMIN = "sub_admin",
    PENDING = "pending"
}
export declare enum SellerStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
}
export declare class User {
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
    cnicNumber: string;
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
}
