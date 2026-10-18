import { MigrationInterface, QueryRunner } from 'typeorm';

export class PrepararAtualizacaoMapas1792237200000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Identifica a versão atual dos dados usados pelo mapa.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS catalogo_revisao (
        id smallint PRIMARY KEY CHECK (id = 1),
        versao bigint NOT NULL CHECK (versao >= 1)
      )
    `);

    await queryRunner.query(`
      INSERT INTO catalogo_revisao (id, versao)
      VALUES (1, 1)
      ON CONFLICT (id) DO NOTHING
    `);

    // Preserva tarefas de atualização junto das alterações do domínio.
    // A fila poderá encaminhar esses registros ao Redis posteriormente.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mapa_outbox (
        event_id uuid PRIMARY KEY,
        trilha_id uuid NOT NULL,
        versao bigint NOT NULL CHECK (versao >= 1),
        criado_em timestamptz NOT NULL DEFAULT now(),
        enfileirado_em timestamptz,
        CONSTRAINT mapa_outbox_trilha_versao_unique
          UNIQUE (trilha_id, versao)
      )
    `);

    // Facilita encontrar tarefas que ainda precisam ser encaminhadas.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_mapa_outbox_pendentes
      ON mapa_outbox (criado_em)
      WHERE enfileirado_em IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS mapa_outbox');
    await queryRunner.query('DROP TABLE IF EXISTS catalogo_revisao');
  }
}
