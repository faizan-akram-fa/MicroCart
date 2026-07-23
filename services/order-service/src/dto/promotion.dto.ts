import { PromotionType, PromotionScope } from '../entities/promotion.entity';
import { IsString, IsEnum, IsNumber, IsOptional, IsArray, IsDateString, Min, ValidateNested } from 'class-validator';

export class CreatePromotionDto {
  @IsString()
  code: string;

  @IsEnum(PromotionType)
  type: PromotionType;

  @IsNumber()
  @Min(0)
  value: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @IsOptional()
  @IsEnum(PromotionScope)
  scope?: PromotionScope;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableProductIds?: string[];

  @IsOptional()
  @IsDateString()
  expiryDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsString()
  sellerId?: string;
}

import { Type } from 'class-transformer';
import { IsDefined } from 'class-validator';

export class CartItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsDefined()
  price: number | string;

  @IsOptional()
  @IsString()
  sellerId?: string;
}

export class UpdatePromotionDto {
  @IsOptional()
  @IsEnum(PromotionType)
  type?: PromotionType;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsNumber()
  minOrderValue?: number;

  @IsOptional()
  @IsNumber()
  usageLimit?: number;

  @IsOptional()
  @IsDateString()
  expiryDate?: Date;

  @IsOptional()
  @IsEnum(PromotionScope)
  scope?: PromotionScope;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableProductIds?: string[];
}

export class ValidatePromotionDto {
  @IsString()
  code: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  cartItems: CartItemDto[];
}
