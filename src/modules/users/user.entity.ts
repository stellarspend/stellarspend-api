import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'boolean', default: false })
  isSuspended: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  suspensionReason: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  refreshToken: string | null;

  @Column({ type: 'datetime', nullable: true })
  refreshTokenExpiry: Date | null;
  @Column({ type: 'int', default: 0 })
  failedLoginAttempts: number;

  @Column({ type: 'datetime', nullable: true })
  lockedUntil: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  /**
   * Check if the account is currently locked
   */
  isLocked(): boolean {
    return this.lockedUntil !== null && this.lockedUntil > new Date();
  }

  /**
   * Get remaining lock time in seconds
   */
  getRemainingLockTimeSeconds(): number {
    if (!this.isLocked()) return 0;
    return Math.floor((this.lockedUntil!.getTime() - Date.now()) / 1000);
  }

  /**
   * Reset failed login attempts
   */
  resetFailedAttempts(): void {
    this.failedLoginAttempts = 0;
    this.lockedUntil = null;
  }

  /**
   * Increment failed login attempts and lock if needed
   */
  incrementFailedAttempts(maxAttempts: number): boolean {
    this.failedLoginAttempts += 1;
    if (this.failedLoginAttempts >= maxAttempts) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + 15);
      this.lockedUntil = lockUntil;
      return true;
    }
    return false;
  }
}
