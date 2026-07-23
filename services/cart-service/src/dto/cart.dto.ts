import { IsString, IsNumber, Min } from 'class-validator';

export class AddToCartDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  sellerId: string;
}

export class UpdateCartItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(0)
  quantity: number;
}

export class RemoveFromCartDto {
  @IsString()
  productId: string;
}
