import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum TicketStatus {
  OPEN = 'open',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column()
  customerName: string;

  @Column()
  customerEmail: string;

  @Column({ nullable: true })
  assignedAgentId: string;

  @Column({ nullable: true })
  sellerId: string;

  @Column({ default: 'admin' })
  recipient: 'admin' | 'vendor';

  @Column({ default: false })
  buyerUnread: boolean;

  @Column({ default: false })
  sellerUnread: boolean;

  @Column({ default: false })
  adminUnread: boolean;

  @Column()
  subject: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  category: string; // e.g. 'order', 'product', 'payment', 'refund', 'general'

  @Column({
    type: 'enum',
    enum: TicketPriority,
    default: TicketPriority.MEDIUM,
  })
  priority: TicketPriority;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.OPEN,
  })
  status: TicketStatus;

  @Column({ nullable: true })
  orderId: string;

  @Column({ nullable: true })
  productId: string;

  @Column({ type: 'simple-array', nullable: true })
  attachments: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

