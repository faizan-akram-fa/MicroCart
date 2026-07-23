import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  category: string;

  @Column('int')
  stock: number;

  @Column('simple-array', { nullable: true })
  images: string[];

  @Column()
  sellerId: string;

  @Column({ nullable: true })
  storeName: string;

  @Column({ nullable: true })
  brand: string;

  @Column({ default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Column({ default: true })
  isActive: boolean;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  salePrice: number;

  @Column({ default: false })
  isOnSale: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
