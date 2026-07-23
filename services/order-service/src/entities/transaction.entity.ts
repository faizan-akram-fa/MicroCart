import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column()
  userId: string;

  @Column()
  paymentMethod: string; // 'card' | 'easypaisa' | 'jazzcash' | 'cash_on_delivery'

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  status: string; // 'pending' | 'completed' | 'failed'

  @Column({ nullable: true })
  transactionReference: string;

  @CreateDateColumn()
  createdAt: Date;
}
