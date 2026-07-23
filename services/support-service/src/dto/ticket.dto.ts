import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray } from 'class-validator';
import { TicketPriority, TicketStatus } from '../entities/ticket.entity';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsString()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsOptional()
  recipient?: 'admin' | 'vendor';

  @IsString()
  @IsOptional()
  sellerId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}

export class UpdateTicketStatusDto {
  @IsEnum(TicketStatus)
  @IsNotEmpty()
  status: TicketStatus;
}

export class AssignTicketDto {
  @IsString()
  @IsNotEmpty()
  agentId: string;
}
