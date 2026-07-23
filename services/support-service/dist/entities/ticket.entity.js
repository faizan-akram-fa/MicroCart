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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ticket = exports.TicketStatus = exports.TicketPriority = void 0;
const typeorm_1 = require("typeorm");
var TicketPriority;
(function (TicketPriority) {
    TicketPriority["LOW"] = "low";
    TicketPriority["MEDIUM"] = "medium";
    TicketPriority["HIGH"] = "high";
})(TicketPriority || (exports.TicketPriority = TicketPriority = {}));
var TicketStatus;
(function (TicketStatus) {
    TicketStatus["OPEN"] = "open";
    TicketStatus["PENDING"] = "pending";
    TicketStatus["IN_PROGRESS"] = "in_progress";
    TicketStatus["RESOLVED"] = "resolved";
    TicketStatus["CLOSED"] = "closed";
})(TicketStatus || (exports.TicketStatus = TicketStatus = {}));
let Ticket = class Ticket {
};
exports.Ticket = Ticket;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Ticket.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Ticket.prototype, "customerId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Ticket.prototype, "customerName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Ticket.prototype, "customerEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Ticket.prototype, "assignedAgentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Ticket.prototype, "sellerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'admin' }),
    __metadata("design:type", String)
], Ticket.prototype, "recipient", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Ticket.prototype, "buyerUnread", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Ticket.prototype, "sellerUnread", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Ticket.prototype, "adminUnread", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Ticket.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Ticket.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Ticket.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: TicketPriority,
        default: TicketPriority.MEDIUM,
    }),
    __metadata("design:type", String)
], Ticket.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: TicketStatus,
        default: TicketStatus.OPEN,
    }),
    __metadata("design:type", String)
], Ticket.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Ticket.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Ticket.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], Ticket.prototype, "attachments", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Ticket.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Ticket.prototype, "updatedAt", void 0);
exports.Ticket = Ticket = __decorate([
    (0, typeorm_1.Entity)('tickets')
], Ticket);
//# sourceMappingURL=ticket.entity.js.map