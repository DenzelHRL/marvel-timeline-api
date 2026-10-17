import { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarMapasLeitura1792233000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Guarda um mapa preparado por trilha, com sua versão.
    // Não há chave estrangeira porque a trilha está em outro banco.
    await queryRunner.query(`
      CREATE TABLE mapas_leitura (
        trilha_id uuid PRIMARY KEY,
        versao bigint NOT NULL CHECK (versao >= 1),
        publicada boolean NOT NULL,
        itens jsonb NOT NULL DEFAULT '[]'::jsonb,
        atualizado_em timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT mapas_leitura_itens_array
          CHECK (jsonb_typeof(itens) = 'array')
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverte somente a estrutura de projeção desta migration.
    await queryRunner.query('DROP TABLE mapas_leitura');
  }
}