export declare enum TicketPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high"
}
export declare enum TicketStatus {
    OPEN = "open",
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    RESOLVED = "resolved",
    CLOSED = "closed"
}
export declare class Ticket {
    id: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    assignedAgentId: string;
    sellerId: string;
    recipient: 'admin' | 'vendor';
    buyerUnread: boolean;
    sellerUnread: boolean;
    adminUnread: boolean;
    subject: string;
    description: string;
    category: string;
    priority: TicketPriority;
    status: TicketStatus;
    orderId: string;
    productId: string;
    attachments: string[];
    createdAt: Date;
    updatedAt: Date;
}
