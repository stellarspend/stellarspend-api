import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
/** Stores the mapping between user accounts and their Stellar public keys. */
@Entity('wallets')
export class WalletEntity {
  /** Wallet identifier. */
  @PrimaryGeneratedColumn('uuid') id!: string;
  /** Owning user identifier (one wallet per user). */
  @Column({ unique: true }) userId!: string;
  /** Stellar public key (G-prefixed, 56 characters). */
  @Column({ unique: true, length: 56 }) publicKey!: string;
  /** Weekly spending limit for XLM (stored as decimal string). */
  @Column({ type: 'numeric', precision: 30, scale: 12, nullable: true }) spendingLimitXlm!: string | null;
  /** Weekly spending limit for USDC (stored as decimal string). */
  @Column({ type: 'numeric', precision: 30, scale: 12, nullable: true }) spendingLimitUsdc!: string | null;
  /** Wallet creation timestamp. */
  @CreateDateColumn() createdAt!: Date;
}
