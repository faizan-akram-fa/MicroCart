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
exports.AssignTicketDto = exports.UpdateTicketStatusDto = exports.CreateMessageDto = exports.CreateTicketDto = void 0;
const class_validator_1 = require("class-validator");
const ticket_entity_1 = require("../entities/ticket.entity");
class CreateTicketDto {
}
exports.CreateTicketDto = CreateTicketDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(ticket_entity_1.TicketPriority),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "orderId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "recipient", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "sellerId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateTicketDto.prototype, "attachments", void 0);
class CreateMessageDto {
}
exports.CreateMessageDto = CreateMessageDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateMessageDto.prototype, "attachments", void 0);
class UpdateTicketStatusDto {
}
exports.UpdateTicketStatusDto = UpdateTicketStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(ticket_entity_1.TicketStatus),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateTicketStatusDto.prototype, "status", void 0);
class AssignTicketDto {
}
exports.AssignTicketDto = AssignTicketDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AssignTicketDto.prototype, "agentId", void 0);
//# sourceMappingURL=ticket.dto.js.map