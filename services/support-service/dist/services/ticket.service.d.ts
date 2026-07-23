import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { Ticket, TicketStatus } from '../entities/ticket.entity';
import { TicketMessage } from '../entities/ticket-message.entity';
import { CreateTicketDto, CreateMessageDto } from '../dto/ticket.dto';
export declare class TicketService {
    private ticketRepository;
    private messageRepository;
    private httpService;
    constructor(ticketRepository: Repository<Ticket>, messageRepository: Repository<TicketMessage>, httpService: HttpService);
    create(user: any, createTicketDto: CreateTicketDto): Promise<Ticket>;
    findAll(user: any): Promise<Ticket[]>;
    findOne(id: string, user: any): Promise<Ticket>;
    updateStatus(id: string, status: TicketStatus, user: any): Promise<Ticket>;
    assign(id: string, agentId: string, user: any): Promise<Ticket>;
    getUnreadCount(user: any): Promise<number>;
    addMessage(ticketId: string, createMessageDto: CreateMessageDto, user: any): Promise<TicketMessage>;
    findMessages(ticketId: string, user: any): Promise<TicketMessage[]>;
}
