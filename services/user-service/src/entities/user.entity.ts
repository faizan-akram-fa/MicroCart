import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
  BUYER = 'buyer',
  SELLER = 'seller',
  ADMIN = 'admin',
  SUB_ADMIN = 'sub_admin',
  PENDING = 'pending',
}

export enum SellerStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.BUYER,
  })
  role: UserRole;

  @Column({ type: 'simple-array', nullable: true })
  permissions: string[];

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  zipCode: string;

  @Column({ nullable: true })
  country: string;

  @Column({ default: 'en' })
  preferredLanguage: string;

  @Column({ default: 'PKR' })
  preferredCurrency: string;

  @Column({ nullable: true })
  profileImage: string;

  @Column({ nullable: true })
  googleId: string;

  @Column({ nullable: true })
  facebookId: string;

  @Column({ nullable: true })
  storeName: string;

  @Column({ nullable: true })
  storeAddress: string;

  @Column({ nullable: true })
  storeType: string; // e.g., 'individual', 'company'

  @Column({ nullable: true })
  cnicNumber: string;

  @Column({ nullable: true })
  cnicImage: string; // Path to stored file

  @Column({
    type: 'enum',
    enum: SellerStatus,
    nullable: true,
  })
  sellerStatus: SellerStatus;

  @Column({ nullable: true, type: 'text' })
  rejectionReason: string;

  @Column({ nullable: true })
  otp: string;

  @Column({ type: 'timestamp', nullable: true })
  otpExpiry: Date;

  @Column({ default: false })
  mustChangePassword: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ nullable: true })
  deletedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
