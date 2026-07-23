"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const ticket_entity_1 = require("../entities/ticket.entity");
const ticket_message_entity_1 = require("../entities/ticket-message.entity");
let TicketService = class TicketService {
    constructor(ticketRepository, messageRepository, httpService) {
        this.ticketRepository = ticketRepository;
        this.messageRepository = messageRepository;
        this.httpService = httpService;
    }
    async create(user, createTicketDto) {
        console.log('[TicketService] Incoming createTicketDto:', JSON.stringify(createTicketDto));
        console.log('[TicketService] Incoming user context:', JSON.stringify(user));
        const isVendorSupport = createTicketDto.recipient === 'vendor';
        const ticket = this.ticketRepository.create({
            customerId: user.id || user.userId,
            customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
            customerEmail: user.email,
            subject: createTicketDto.subject,
            description: createTicketDto.description,
            category: createTicketDto.category,
            priority: createTicketDto.priority || ticket_entity_1.TicketPriority.MEDIUM,
            status: ticket_entity_1.TicketStatus.OPEN,
            productId: createTicketDto.productId || null,
            orderId: createTicketDto.orderId || null,
            recipient: createTicketDto.recipient || 'admin',
            buyerUnread: false,
            sellerUnread: isVendorSupport,
            adminUnread: !isVendorSupport,
            attachments: createTicketDto.attachments || [],
        });
        let sellerId = createTicketDto.sellerId || null;
        console.log('[TicketService] Initial sellerId from dto:', sellerId);
        if (isVendorSupport && !sellerId) {
            if (createTicketDto.productId) {
                try {
                    const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
                    const internalSecret = process.env.INTERNAL_SERVICE_SECRET || 'microservices-secret-123';
                    const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${productServiceUrl}/products/${createTicketDto.productId}`, {
                        headers: { 'x-internal-secret': internalSecret }
                    }));
                    if (response.data && response.data.sellerId) {
                        sellerId = response.data.sellerId;
                    }
                }
                catch (err) {
                    console.error(`[TicketService] Failed to fetch product ${createTicketDto.productId} for routing: ${err.message}`);
                }
            }
            else if (createTicketDto.orderId) {
                try {
                    const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://order-service:3004';
                    const internalSecret = process.env.INTERNAL_SERVICE_SECRET || 'microservices-secret-123';
                    const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${orderServiceUrl}/orders/internal/${createTicketDto.orderId}`, {
                        headers: { 'x-internal-secret': internalSecret }
                    }));
                    if (response.data && response.data.sellerId) {
                        sellerId = response.data.sellerId;
                    }
                }
                catch (err) {
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
    async findAll(user) {
        const userId = user.id || user.userId;
        const role = user.role;
        console.log('[TicketService] findAll called. userId:', userId, 'role:', role, 'user context:', JSON.stringify(user));
        if (role === 'admin' || role === 'sub_admin') {
            if (role === 'sub_admin' && !user.permissions?.includes('MANAGE_SUPPORT')) {
                throw new common_1.ForbiddenException('You do not have permission to view support tickets');
            }
            const tickets = await this.ticketRepository.find({ order: { updatedAt: 'DESC' } });
            console.log('[TicketService] findAll (admin) returning count:', tickets.length);
            return tickets;
        }
        if (role === 'seller') {
            const tickets = await this.ticketRepository.find({
                where: { sellerId: userId, recipient: 'vendor' },
                order: { updatedAt: 'DESC' },
            });
            console.log('[TicketService] findAll (seller) returning count:', tickets.length, 'for sellerId:', userId);
            return tickets;
        }
        const tickets = await this.ticketRepository.find({
            where: { customerId: userId },
            order: { updatedAt: 'DESC' },
        });
        console.log('[TicketService] findAll (buyer) returning count:', tickets.length, 'for customerId:', userId);
        return tickets;
    }
    async findOne(id, user) {
        const ticket = await this.ticketRepository.findOne({ where: { id } });
        if (!ticket) {
            throw new common_1.NotFoundException(`Ticket with ID "${id}" not found`);
        }
        const userId = user.id || user.userId;
        const role = user.role;
        const isAuthorized = role === 'admin' ||
            (role === 'sub_admin' && user.permissions?.includes('MANAGE_SUPPORT')) ||
            ticket.customerId === userId ||
            ticket.sellerId === userId;
        if (!isAuthorized) {
            throw new common_1.ForbiddenException('You do not have permission to view this ticket');
        }
        let hasChanges = false;
        if ((role === 'admin' || role === 'sub_admin') && ticket.adminUnread) {
            ticket.adminUnread = false;
            hasChanges = true;
        }
        else if (role === 'seller' && ticket.sellerId === userId && ticket.sellerUnread) {
            ticket.sellerUnread = false;
            hasChanges = true;
        }
        else if (role === 'buyer' && ticket.customerId === userId && ticket.buyerUnread) {
            ticket.buyerUnread = false;
            hasChanges = true;
        }
        if (hasChanges) {
            await this.ticketRepository.save(ticket);
        }
        return ticket;
    }
    async updateStatus(id, status, user) {
        const ticket = await this.findOne(id, user);
        const role = user.role;
        if (role === 'buyer') {
            throw new common_1.ForbiddenException('Buyers are not allowed to close or change the status of tickets.');
        }
        ticket.status = status;
        if (role === 'admin' || role === 'sub_admin') {
            ticket.buyerUnread = true;
            if (ticket.recipient === 'vendor') {
                ticket.sellerUnread = true;
            }
        }
        else if (role === 'seller') {
            ticket.buyerUnread = true;
            ticket.adminUnread = true;
        }
        else if (role === 'buyer') {
            ticket.adminUnread = true;
            if (ticket.recipient === 'vendor') {
                ticket.sellerUnread = true;
            }
        }
        return this.ticketRepository.save(ticket);
    }
    async assign(id, agentId, user) {
        const role = user.role;
        if (role !== 'admin' && role !== 'sub_admin') {
            throw new common_1.ForbiddenException('Only admin or support staff can assign tickets');
        }
        if (role === 'sub_admin' && !user.permissions?.includes('MANAGE_SUPPORT')) {
            throw new common_1.ForbiddenException('You do not have permission to assign tickets');
        }
        const ticket = await this.findOne(id, user);
        ticket.assignedAgentId = agentId;
        ticket.adminUnread = false;
        return this.ticketRepository.save(ticket);
    }
    async getUnreadCount(user) {
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
                where: { sellerId: userId, sellerUnread: true, recipient: 'vendor' },
            });
        }
        return this.ticketRepository.count({
            where: { customerId: userId, buyerUnread: true },
        });
    }
    async addMessage(ticketId, createMessageDto, user) {
        const ticket = await this.findOne(ticketId, user);
        const userId = user.id || user.userId;
        if (ticket.status === ticket_entity_1.TicketStatus.CLOSED) {
            throw new common_1.ForbiddenException('Cannot send messages to a closed ticket.');
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
        if (user.role === 'buyer') {
            ticket.buyerUnread = false;
            if (ticket.recipient === 'vendor') {
                ticket.sellerUnread = true;
            }
            ticket.adminUnread = true;
        }
        else if (user.role === 'seller') {
            ticket.sellerUnread = false;
            ticket.buyerUnread = true;
            ticket.adminUnread = true;
        }
        else if (user.role === 'admin' || user.role === 'sub_admin') {
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
    async findMessages(ticketId, user) {
        await this.findOne(ticketId, user);
        return this.messageRepository.find({
            where: { ticketId },
            order: { createdAt: 'ASC' },
        });
    }
};
exports.TicketService = TicketService;
exports.TicketService = TicketService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ticket_entity_1.Ticket)),
    __param(1, (0, typeorm_1.InjectRepository)(ticket_message_entity_1.TicketMessage)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        axios_1.HttpService])
], TicketService);
//# sourceMappingURL=ticket.service.js.map