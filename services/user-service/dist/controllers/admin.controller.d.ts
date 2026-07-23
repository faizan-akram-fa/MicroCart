import { AdminService } from '../services/admin.service';
export declare class AdminController {
    private adminService;
    constructor(adminService: AdminService);
    getAllUsers(req: any): Promise<import("../entities/user.entity").User[]>;
    getPendingSellers(req: any): Promise<import("../entities/user.entity").User[]>;
    approveSeller(id: string, req: any): Promise<{
        message: string;
        user: import("../entities/user.entity").User;
    }>;
    rejectSeller(id: string, reason: string, req: any): Promise<{
        message: string;
        user: import("../entities/user.entity").User;
    }>;
    updateUserStatus(id: string, isActive: boolean, req: any): Promise<{
        message: string;
    }>;
    deleteUser(id: string, req: any): Promise<{
        message: string;
        user: import("../entities/user.entity").User;
    }>;
    createSubAdmin(data: any, req: any): Promise<import("../entities/user.entity").User>;
    updateSubAdmin(id: string, data: any, req: any): Promise<import("../entities/user.entity").User>;
    deleteSubAdmin(id: string, req: any): Promise<{
        message: string;
    }>;
    getActivityLogs(req: any): Promise<import("../entities/activity-log.entity").ActivityLog[]>;
    sendPromotionalEmail(data: {
        target: string;
        subject: string;
        message: string;
    }, req: any): Promise<{
        message: string;
    }>;
    sendSellerPromotionalEmail(data: {
        subject: string;
        message: string;
    }, req: any): Promise<{
        message: string;
    }>;
    getSellerBuyers(req: any): Promise<import("../entities/user.entity").User[]>;
    resetUserPassword(id: string, password: string | undefined, req: any): Promise<{
        message: string;
    }>;
    getTechnicalLogs(): Promise<any[]>;
}
