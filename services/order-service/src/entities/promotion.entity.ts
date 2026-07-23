import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PromotionType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export enum PromotionScope {
  PLATFORM = 'platform', // Admin wide
  STORE = 'store',       // Applies to all items from a seller
  PRODUCT = 'product',   // Applies to specific products from a seller
}

@Entity('promotions')
export class Promotion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column({
    type: 'enum',
    enum: PromotionType,
  })
  type: PromotionType;

  @Column('decimal', { precision: 10, scale: 2 })
  value: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  minOrderValue: number;

  @Column({
    type: 'enum',
    enum: PromotionScope,
    default: PromotionScope.PLATFORM,
  })
  scope: PromotionScope;

  @Column({ nullable: true })
  sellerId: string;

  @Column('simple-array', { nullable: true })
  applicableProductIds: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  expiryDate: Date;

  @Column({ type: 'int', nullable: true })
  usageLimit: number;

  @Column({ type: 'int', default: 0 })
  usedCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
