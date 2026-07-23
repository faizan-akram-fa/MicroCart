import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
  description?: string;
  image?: string;
  sellerId: string;
  stock?: number;
}

@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column('jsonb', { default: [] })
  items: CartItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
