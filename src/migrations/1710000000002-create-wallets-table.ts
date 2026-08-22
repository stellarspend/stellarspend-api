import { MigrationInterface, QueryRunner } from 'typeorm';

/** Creates the wallets table that links a user account to a Stellar public key. */
export class CreateWalletsTable1710000000002 implements MigrationInterface {
  /** Applies the wallets schema. */
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id                    uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id               uuid            UNIQUE NOT NULL,
        public_key            varchar(56)     UNIQUE NOT NULL,
        spending_limit_xlm    numeric(30,12),
        spending_limit_usdc   numeric(30,12),
        spending_limit_eurc   numeric(30,12),
        created_at            timestamptz     NOT NULL DEFAULT now()
      )
    `);
  }

  /** Removes only the schema introduced by this migration. */
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS wallets');
  }
}
