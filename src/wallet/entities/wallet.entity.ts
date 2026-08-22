import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** Links a Stellar public key to a user account with spending limits. */
@Entity('wallets')
export class WalletEntity {
  /** Wallet identifier. */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Owning user identifier (unique per user). */
  @Column('uuid')
  userId!: string;

  /** Stellar public key (56 characters, unique across all wallets). */
  @Column({ length: 56, unique: true })
  publicKey!: string;

  /** Weekly spending limit for XLM represented as database numeric. */
  @Column({ type: 'numeric', precision: 30, scale: 12, nullable: true })
  spendingLimitXlm!: string | null;

  /** Weekly spending limit for USDC represented as database numeric. */
  @Column({ type: 'numeric', precision: 30, scale: 12, nullable: true })
  spendingLimitUsdc!: string | null;

  /** Creation timestamp. */
  @CreateDateColumn()
  createdAt!: Date;
}
