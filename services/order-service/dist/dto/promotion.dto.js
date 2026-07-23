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
exports.ValidatePromotionDto = exports.UpdatePromotionDto = exports.CartItemDto = exports.CreatePromotionDto = void 0;
const promotion_entity_1 = require("../entities/promotion.entity");
const class_validator_1 = require("class-validator");
class CreatePromotionDto {
}
exports.CreatePromotionDto = CreatePromotionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePromotionDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(promotion_entity_1.PromotionType),
    __metadata("design:type", String)
], CreatePromotionDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreatePromotionDto.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreatePromotionDto.prototype, "minOrderValue", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(promotion_entity_1.PromotionScope),
    __metadata("design:type", String)
], CreatePromotionDto.prototype, "scope", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreatePromotionDto.prototype, "applicableProductIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Date)
], CreatePromotionDto.prototype, "expiryDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreatePromotionDto.prototype, "usageLimit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePromotionDto.prototype, "sellerId", void 0);
const class_transformer_1 = require("class-transformer");
const class_validator_2 = require("class-validator");
class CartItemDto {
}
exports.CartItemDto = CartItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CartItemDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CartItemDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_2.IsDefined)(),
    __metadata("design:type", Object)
], CartItemDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CartItemDto.prototype, "sellerId", void 0);
class UpdatePromotionDto {
}
exports.UpdatePromotionDto = UpdatePromotionDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(promotion_entity_1.PromotionType),
    __metadata("design:type", String)
], UpdatePromotionDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdatePromotionDto.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdatePromotionDto.prototype, "minOrderValue", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdatePromotionDto.prototype, "usageLimit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Date)
], UpdatePromotionDto.prototype, "expiryDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(promotion_entity_1.PromotionScope),
    __metadata("design:type", String)
], UpdatePromotionDto.prototype, "scope", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdatePromotionDto.prototype, "applicableProductIds", void 0);
class ValidatePromotionDto {
}
exports.ValidatePromotionDto = ValidatePromotionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ValidatePromotionDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CartItemDto),
    __metadata("design:type", Array)
], ValidatePromotionDto.prototype, "cartItems", void 0);
//# sourceMappingURL=promotion.dto.js.map