import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image?: string;
  sellerId: string;
  shipping?: number;
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column('jsonb')
  items: OrderItem[];

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column()
  shippingAddress: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  zipCode: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: 'cash_on_delivery' })
  paymentMethod: string;

  @Column({ nullable: true })
  transactionReference: string;

  @Column({ nullable: true })
  sellerId: string;

  @Column({ nullable: true })
  promoCode: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
