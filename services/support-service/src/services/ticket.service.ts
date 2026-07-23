import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Ticket, TicketStatus, TicketPriority } from '../entities/ticket.entity';
import { TicketMessage } from '../entities/ticket-message.entity';
import { CreateTicketDto, CreateMessageDto } from '../dto/ticket.dto';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(TicketMessage)
    private messageRepository: Repository<TicketMessage>,
    private httpService: HttpService,
  ) {}

  async create(user: any, createTicketDto: CreateTicketDto): Promise<Ticket> {
    console.log('[TicketService] Incoming createTicketDto:', JSON.stringify(createTicketDto));
    console.log('[TicketService] Incoming user context:', JSON.stringify(user));
    
    const isVendorSupport = createTicketDto.recipient === 'vendor';
    
    const ticket = this.ticketRepository.create({
      customerId: user.id || user.userId, // handle varying user object formats
      customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      customerEmail: user.email,
      subject: createTicketDto.subject,
      description: createTicketDto.description,
      category: createTicketDto.category,
      priority: createTicketDto.priority || TicketPriority.MEDIUM,
      status: TicketStatus.OPEN,
      productId: createTicketDto.productId || null,
      orderId: createTicketDto.orderId || null,
      recipient: createTicketDto.recipient || 'admin',
      buyerUnread: false,
      sellerUnread: isVendorSupport,
      adminUnread: !isVendorSupport,
      attachments: createTicketDto.attachments || [],
    });

    // Attempt to route to seller automatically
    let sellerId: string | null = createTicketDto.sellerId || null;
    console.log('[TicketService] Initial sellerId from dto:', sellerId);
    if (isVendorSupport && !sellerId) {
      if (createTicketDto.productId) {
        try {
          const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
          const internalSecret = process.env.INTERNAL_SERVICE_SECRET || 'microservices-secret-123';
          const response = await firstValueFrom(
            this.httpService.get(`${productServiceUrl}/products/${createTicketDto.productId}`, {
              headers: { 'x-internal-secret': internalSecret }
            })
          );
          if (response.data && response.data.sellerId) {
            sellerId = response.data.sellerId;
          }
        } catch (err) {
          console.error(`[TicketService] Failed to fetch product ${createTicketDto.productId} for routing: ${err.message}`);
        }
      } else if (createTicketDto.orderId) {
        try {
          const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://order-service:3004';
          const internalSecret = process.env.INTERNAL_SERVICE_SECRET || 'microservices-secret-123';
          const response = await firstValueFrom(
            this.httpService.get(`${orderServiceUrl}/orders/internal/${createTicketDto.orderId}`, {
              headers: { 'x-internal-secret': internalSecret }
            })
          );
          if (response.data && response.data.sellerId) {
            sellerId = response.data.sellerId;
          }
        } catch (err) {
          console.error(`[TicketService] Failed to fetch order ${createTicketDto.orderId} for routing: ${err.message}`);
        }
      }
    }

    console.log('[TicketService] Final resolved sellerId:', sellerId);
    ticket.sellerId = sellerId;
    const saved = await this.ticketRepository.save(ticket);
    console.log('[TicketService] Saved ticket entity in DB:', JSON.stringify(saved));
    return saved;
  }

  async findAll(user: any): Promise<Ticket[]> {
    const userId = user.id || user.userId;
    const role = user.role;
    console.log('[TicketService] findAll called. userId:', userId, 'role:', role, 'user context:', JSON.stringify(user));

    if (role === 'admin' || role === 'sub_admin') {
      if (role === 'sub_admin' && !user.permissions?.includes('MANAGE_SUPPORT')) {
        throw new ForbiddenException('You do not have permission to view support tickets');
      }
      const tickets = await this.ticketRepository.find({ order: { updatedAt: 'DESC' } });
      console.log('[TicketService] findAll (admin) returning count:', tickets.length);
      return tickets;
    }

    if (role === 'seller') {
      const tickets = await this.ticketRepository.find({
        where: { sellerId: userId, recipient: 'vendor' as any },
        order: { updatedAt: 'DESC' },
      });
      console.log('[TicketService] findAll (seller) returning count:', tickets.length, 'for sellerId:', userId);
      return tickets;
    }

    // Buyer
    const tickets = await this.ticketRepository.find({
      where: { customerId: userId },
      order: { updatedAt: 'DESC' },
    });
    console.log('[TicketService] findAll (buyer) returning count:', tickets.length, 'for customerId:', userId);
    return tickets;
  }

  async findOne(id: string, user: any): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID "${id}" not found`);
    }

    const userId = user.id || user.userId;
    const role = user.role;

    const isAuthorized =
      role === 'admin' ||
      (role === 'sub_admin' && user.permissions?.includes('MANAGE_SUPPORT')) ||
      ticket.customerId === userId ||
      ticket.sellerId === userId;

    if (!isAuthorized) {
      throw new ForbiddenException('You do not have permission to view this ticket');
    }

    // Reset unread flag based on role
    let hasChanges = false;
    if ((role === 'admin' || role === 'sub_admin') && ticket.adminUnread) {
      ticket.adminUnread = false;
      hasChanges = true;
    } else if (role === 'seller' && ticket.sellerId === userId && ticket.sellerUnread) {
      ticket.sellerUnread = false;
      hasChanges = true;
    } else if (role === 'buyer' && ticket.customerId === userId && ticket.buyerUnread) {
      ticket.buyerUnread = false;
      hasChanges = true;
    }

    if (hasChanges) {
      await this.ticketRepository.save(ticket);
    }

    return ticket;
  }

  async updateStatus(id: string, status: TicketStatus, user: any): Promise<Ticket> {
    const ticket = await this.findOne(id, user);
    const role = user.role;

    if (role === 'buyer') {
      throw new ForbiddenException('Buyers are not allowed to close or change the status of tickets.');
    }

    ticket.status = status;
    
    // When status updates, notify respective parties if needed
    if (role === 'admin' || role === 'sub_admin') {
      ticket.buyerUnread = true;
      if (ticket.recipient === 'vendor') {
        ticket.sellerUnread = true;
      }
    } else if (role === 'seller') {
      ticket.buyerUnread = true;
      ticket.adminUnread = true;
    } else if (role === 'buyer') {
      ticket.adminUnread = true;
      if (ticket.recipient === 'vendor') {
        ticket.sellerUnread = true;
      }
    }

    return this.ticketRepository.save(ticket);
  }

  async assign(id: string, agentId: string, user: any): Promise<Ticket> {
    // Only Admin or Sub Admin can assign
    const role = user.role;
    if (role !== 'admin' && role !== 'sub_admin') {
      throw new ForbiddenException('Only admin or support staff can assign tickets');
    }
    if (role === 'sub_admin' && !user.permissions?.includes('MANAGE_SUPPORT')) {
      throw new ForbiddenException('You do not have permission to assign tickets');
    }

    const ticket = await this.findOne(id, user);
    ticket.assignedAgentId = agentId;
    ticket.adminUnread = false;
    return this.ticketRepository.save(ticket);
  }

  async getUnreadCount(user: any): Promise<number> {
    const userId = user.id || user.userId;
    const role = user.role;

    if (role === 'admin' || role === 'sub_admin') {
      if (role === 'sub_admin' && !user.permissions?.includes('MANAGE_SUPPORT')) {
        return 0;
      }
      return this.ticketRepository.count({
        where: { adminUnread: true },
      });
    }

    if (role === 'seller') {
      return this.ticketRepository.count({
        where: { sellerId: userId, sellerUnread: true, recipient: 'vendor' as any },
      });
    }

    // Buyer
    return this.ticketRepository.count({
      where: { customerId: userId, buyerUnread: true },
    });
  }

  // --- Message (Chat) Operations ---

  async addMessage(ticketId: string, createMessageDto: CreateMessageDto, user: any): Promise<TicketMessage> {
    // Validate ticket existence and authorization
    const ticket = await this.findOne(ticketId, user);
    const userId = user.id || user.userId;

    if (ticket.status === TicketStatus.CLOSED) {
      throw new ForbiddenException('Cannot send messages to a closed ticket.');
    }

    const message = this.messageRepository.create({
      ticketId,
      senderId: userId,
      senderName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      senderRole: user.role,
      message: createMessageDto.message,
      attachments: createMessageDto.attachments || [],
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update ticket notification flags
    if (user.role === 'buyer') {
      ticket.buyerUnread = false;
      if (ticket.recipient === 'vendor') {
        ticket.sellerUnread = true;
      }
      ticket.adminUnread = true;
    } else if (user.role === 'seller') {
      ticket.sellerUnread = false;
      ticket.buyerUnread = true;
      ticket.adminUnread = true;
    } else if (user.role === 'admin' || user.role === 'sub_admin') {
      ticket.adminUnread = false;
      ticket.buyerUnread = true;
      if (ticket.recipient === 'vendor') {
        ticket.sellerUnread = true;
      }
    }

    ticket.updatedAt = new Date();
    await this.ticketRepository.save(ticket);

    return savedMessage;
  }

  async findMessages(ticketId: string, user: any): Promise<TicketMessage[]> {
    // Validate ticket authorization first and reset unread flag
    await this.findOne(ticketId, user);

    return this.messageRepository.find({
      where: { ticketId },
      order: { createdAt: 'ASC' },
    });
  }
}

