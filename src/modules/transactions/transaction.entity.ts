import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

 
  @Column({ type: 'varchar', length: 64, unique: true })
  hash: string;

  @Column({ type: 'varchar', length: 56 })
  sourceAccount: string;

  @Column({ type: 'varchar', length: 56, nullable: true })
  destinationAccount?: string;


  @Column({ type: 'decimal', precision: 20, scale: 7 })
  amount: number;

 
  @Column({ type: 'varchar', length: 12, default: 'XLM' })
  assetCode: string;

  
  @Column({ type: 'varchar', length: 56, nullable: true })
  assetIssuer?: string;

 
  @Column({ type: 'varchar', length: 50 })
  transactionType: string;


  @Column({ type: 'varchar', length: 500, nullable: true })
  memo?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  memoType?: string;

 
  @Column({
    type: 'varchar',
    length: 20,
    default: 'completed',
  })
  status: 'pending' | 'completed' | 'failed';


  @Column({ type: 'bigint', nullable: true })
  ledgerSequence?: number;

 
  @Column({ type: 'datetime' })
  stellarCreatedAt: Date;


  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

 
  @Column({ type: 'varchar', length: 50, nullable: true })
  category?: string;

 
  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string;
}
