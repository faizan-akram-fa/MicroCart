import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DEACTIVATED = 'deactivated',
}

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ nullable: true })
  userId: string;

  @Column()
  userName: string;

  @Column('int')
  rating: number;

  @Column('text')
  comment: string;

  @Column({
    type: 'text',
    nullable: true,
    transformer: {
      to: (value: string[]) => (value && value.length > 0 ? JSON.stringify(value) : null),
      from: (value: string) => {
        if (!value) return [];
        // Handle old simple-array format (comma-separated) vs new JSON format
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        } catch {
          // Legacy simple-array: split by comma, filter empty strings
          return value.split(',').map(s => s.trim()).filter(s => s && s !== '[object Object]');
        }
      },
    },
  })
  images: string[];

  @Column({
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.APPROVED,
  })
  status: ReviewStatus;

  @Column({ default: false })
  isEdited: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
