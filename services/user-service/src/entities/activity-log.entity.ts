import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  userEmail: string;

  @Column()
  action: string; // e.g., 'BLOCK_USER', 'CREATE_SUB_ADMIN'

  @Column({ nullable: true })
  targetId: string; // The ID of the user/product being acted upon

  @Column({ type: 'text', nullable: true })
  details: string;

  @CreateDateColumn()
  timestamp: Date;
}
