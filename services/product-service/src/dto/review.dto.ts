import { IsNumber, IsString, Min, Max, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ReviewStatus } from '../entities/review.entity';

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsNotEmpty()
  comment: string;

  @IsOptional()
  images?: string[];
}

export class UpdateReviewStatusDto {
  @IsEnum(ReviewStatus)
  status: ReviewStatus;
}
