import { IsArray, IsString, IsNumber, IsOptional } from 'class-validator';

export interface OrderItemDto {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image?: string;
  sellerId: string;
  shipping?: number;
}

export class CreateOrderDto {
  @IsArray()
  items: OrderItemDto[];

  @IsNumber()
  totalAmount: number;

  @IsString()
  shippingAddress: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  zipCode: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  promoCode?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  transactionReference?: string;

  @IsOptional()
  @IsString()
  walletPhone?: string;

  @IsOptional()
  @IsString()
  cnic?: string;
}

export class UpdateOrderStatusDto {
  @IsString()
  status: string;
}
