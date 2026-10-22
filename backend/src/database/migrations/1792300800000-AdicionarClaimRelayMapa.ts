import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdicionarClaimRelayMapa1792300800000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE mapa_outbox
        ADD COLUMN relay_claim_token uuid,
        ADD COLUMN relay_claim_expira_em timestamptz
    `);

    await queryRunner.query(`
      CREATE INDEX idx_mapa_outbox_relay_claim
      ON mapa_outbox (relay_claim_expira_em, criado_em, event_id)
      WHERE enfileirado_em IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX idx_mapa_outbox_relay_claim');
    await queryRunner.query(`
      ALTER TABLE mapa_outbox
        DROP COLUMN relay_claim_token,
        DROP COLUMN relay_claim_expira_em
    `);
  }
}
