import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSavingsGoalsAssetColumn1710000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'savings_goals',
      new TableColumn({
        name: 'asset',
        type: 'varchar',
        length: '12',
        isNullable: false,
        default: "'XLM'",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('savings_goals', 'asset');
  }
}
