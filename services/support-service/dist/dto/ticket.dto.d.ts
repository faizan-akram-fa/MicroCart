import { TicketPriority, TicketStatus } from '../entities/ticket.entity';
export declare class CreateTicketDto {
    subject: string;
    description: string;
    category: string;
    priority?: TicketPriority;
    orderId?: string;
    productId?: string;
    recipient?: 'admin' | 'vendor';
    sellerId?: string;
    attachments?: string[];
}
export declare class CreateMessageDto {
    message: string;
    attachments?: string[];
}
export declare class UpdateTicketStatusDto {
    status: TicketStatus;
}
export declare class AssignTicketDto {
    agentId: string;
}
