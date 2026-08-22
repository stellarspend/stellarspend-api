import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** Persists the link between a StellarSpend user and their Stellar public key. */
@Entity('wallets')
export class WalletEntity {
  /** Wallet record identifier. */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Owning user identifier — one wallet per user enforced at DB level. */
  @Column({ type: 'uuid', unique: true })
  userId!: string;

  /** Stellar public key (G…, 56 chars) — unique across all users. */
  @Column({ length: 56, unique: true })
  publicKey!: string;

  /** Optional weekly spending cap for XLM. */
  @Column({ type: 'numeric', precision: 30, scale: 12, nullable: true })
  spendingLimitXlm!: string | null;

  /** Optional weekly spending cap for USDC. */
  @Column({ type: 'numeric', precision: 30, scale: 12, nullable: true })
  spendingLimitUsdc!: string | null;

  /** Optional weekly spending cap for EURC. */
  @Column({ type: 'numeric', precision: 30, scale: 12, nullable: true })
  spendingLimitEurc!: string | null;

  /** Record creation timestamp. */
  @CreateDateColumn()
  createdAt!: Date;
}
