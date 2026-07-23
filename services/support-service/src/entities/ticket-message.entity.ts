import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('ticket_messages')
export class TicketMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ticketId: string;

  @Column()
  senderId: string;

  @Column()
  senderName: string;

  @Column()
  senderRole: string; // 'buyer', 'seller', 'admin', 'sub_admin'

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'simple-array', nullable: true })
  attachments: string[];

  @CreateDateColumn()
  createdAt: Date;
}
