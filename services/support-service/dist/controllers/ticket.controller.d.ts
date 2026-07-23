import { TicketService } from '../services/ticket.service';
import { CreateTicketDto, UpdateTicketStatusDto, AssignTicketDto, CreateMessageDto } from '../dto/ticket.dto';
export declare class TicketController {
    private ticketService;
    constructor(ticketService: TicketService);
    createTicket(createTicketDto: CreateTicketDto, req: any): Promise<import("../entities/ticket.entity").Ticket>;
    uploadFile(file: any): Promise<{
        url: string;
    }>;
    getTickets(req: any): Promise<import("../entities/ticket.entity").Ticket[]>;
    getUnreadCount(req: any): Promise<number>;
    getTicketById(id: string, req: any): Promise<import("../entities/ticket.entity").Ticket>;
    updateStatus(id: string, updateStatusDto: UpdateTicketStatusDto, req: any): Promise<import("../entities/ticket.entity").Ticket>;
    assignTicket(id: string, assignTicketDto: AssignTicketDto, req: any): Promise<import("../entities/ticket.entity").Ticket>;
    addMessage(id: string, createMessageDto: CreateMessageDto, req: any): Promise<import("../entities/ticket-message.entity").TicketMessage>;
    getMessages(id: string, req: any): Promise<import("../entities/ticket-message.entity").TicketMessage[]>;
}
