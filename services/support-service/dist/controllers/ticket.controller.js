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
exports.TicketController = void 0;
const common_1 = require("@nestjs/common");
const ticket_service_1 = require("../services/ticket.service");
const ticket_dto_1 = require("../dto/ticket.dto");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
let TicketController = class TicketController {
    constructor(ticketService) {
        this.ticketService = ticketService;
    }
    async createTicket(createTicketDto, req) {
        return this.ticketService.create(req.user, createTicketDto);
    }
    async uploadFile(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        const fileUrl = `http://localhost:3006/uploads/${file.filename}`;
        return { url: fileUrl };
    }
    async getTickets(req) {
        return this.ticketService.findAll(req.user);
    }
    async getUnreadCount(req) {
        return this.ticketService.getUnreadCount(req.user);
    }
    async getTicketById(id, req) {
        return this.ticketService.findOne(id, req.user);
    }
    async updateStatus(id, updateStatusDto, req) {
        return this.ticketService.updateStatus(id, updateStatusDto.status, req.user);
    }
    async assignTicket(id, assignTicketDto, req) {
        return this.ticketService.assign(id, assignTicketDto.agentId, req.user);
    }
    async addMessage(id, createMessageDto, req) {
        return this.ticketService.addMessage(id, createMessageDto, req.user);
    }
    async getMessages(id, req) {
        return this.ticketService.findMessages(id, req.user);
    }
};
exports.TicketController = TicketController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ticket_dto_1.CreateTicketDto, Object]),
    __metadata("design:returntype", Promise)
], TicketController.prototype, "createTicket", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TicketController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TicketController.prototype, "getTickets", null);
__decorate([
    (0, common_1.Get)('unread/count'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TicketController.prototype, "getUnreadCount", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TicketController.prototype, "getTicketById", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ticket_dto_1.UpdateTicketStatusDto, Object]),
    __metadata("design:returntype", Promise)
], TicketController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Put)(':id/assign'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ticket_dto_1.AssignTicketDto, Object]),
    __metadata("design:returntype", Promise)
], TicketController.prototype, "assignTicket", null);
__decorate([
    (0, common_1.Post)(':id/messages'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ticket_dto_1.CreateMessageDto, Object]),
    __metadata("design:returntype", Promise)
], TicketController.prototype, "addMessage", null);
__decorate([
    (0, common_1.Get)(':id/messages'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TicketController.prototype, "getMessages", null);
exports.TicketController = TicketController = __decorate([
    (0, common_1.Controller)('support/tickets'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [ticket_service_1.TicketService])
], TicketController);
//# sourceMappingURL=ticket.controller.js.map