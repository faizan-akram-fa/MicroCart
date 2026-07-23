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
exports.Promotion = exports.PromotionScope = exports.PromotionType = void 0;
const typeorm_1 = require("typeorm");
var PromotionType;
(function (PromotionType) {
    PromotionType["PERCENTAGE"] = "percentage";
    PromotionType["FIXED"] = "fixed";
})(PromotionType || (exports.PromotionType = PromotionType = {}));
var PromotionScope;
(function (PromotionScope) {
    PromotionScope["PLATFORM"] = "platform";
    PromotionScope["STORE"] = "store";
    PromotionScope["PRODUCT"] = "product";
})(PromotionScope || (exports.PromotionScope = PromotionScope = {}));
let Promotion = class Promotion {
};
exports.Promotion = Promotion;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Promotion.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Promotion.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PromotionType,
    }),
    __metadata("design:type", String)
], Promotion.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Promotion.prototype, "value", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Promotion.prototype, "minOrderValue", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PromotionScope,
        default: PromotionScope.PLATFORM,
    }),
    __metadata("design:type", String)
], Promotion.prototype, "scope", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Promotion.prototype, "sellerId", void 0);
__decorate([
    (0, typeorm_1.Column)('simple-array', { nullable: true }),
    __metadata("design:type", Array)
], Promotion.prototype, "applicableProductIds", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Promotion.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Promotion.prototype, "expiryDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Promotion.prototype, "usageLimit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Promotion.prototype, "usedCount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Promotion.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Promotion.prototype, "updatedAt", void 0);
exports.Promotion = Promotion = __decorate([
    (0, typeorm_1.Entity)('promotions')
], Promotion);
//# sourceMappingURL=promotion.entity.js.map