import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
/** Tracks a user's savings goal and decimal-safe progress. */
@Entity('savings_goals')
export class SavingsGoalEntity {
  /** Goal identifier. */
  @PrimaryGeneratedColumn('uuid') id!: string;
  /** Owning user identifier. */
  @Column('uuid') userId!: string;
  /** Human-readable goal name. */
  @Column() name!: string;
  /** Currency/asset identifier. */
  @Column({ type: 'varchar', length: 12, default: 'XLM' }) asset!: string;
  /** Target represented as a database numeric. */
  @Column({ type: 'numeric', precision: 30, scale: 12 }) targetAmount!: string;
  /** Current contribution represented as a database numeric. */
  @Column({ type: 'numeric', precision: 30, scale: 12, default: 0 }) currentAmount!: string;
  /** Completion state. */
  @Column({ default: false }) isCompleted!: boolean;
  /** Creation timestamp. */
  @CreateDateColumn() createdAt!: Date;
  /** Update timestamp. */
  @UpdateDateColumn() updatedAt!: Date;
}
