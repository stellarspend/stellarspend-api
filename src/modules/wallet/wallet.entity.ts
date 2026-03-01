import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  publicKey: string;

  @Column({ type: 'uuid' })
  userId: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;
}
