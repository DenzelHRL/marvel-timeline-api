import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddComments20260929180000 implements MigrationInterface {
  name = 'AddComments20260929180000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE comentarios (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        obra_id uuid NOT NULL REFERENCES obras(id) ON DELETE RESTRICT,
        usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
        texto text NOT NULL CHECK (length(btrim(texto)) BETWEEN 1 AND 2000),
        contem_spoiler boolean NOT NULL DEFAULT false,
        status varchar(20) NOT NULL DEFAULT 'PUBLICADO'
          CHECK (status IN ('PUBLICADO', 'OCULTO', 'REMOVIDO')),
        criado_em timestamptz NOT NULL DEFAULT now(),
        atualizado_em timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX ix_comentarios_obra_criado
      ON comentarios (obra_id, criado_em DESC, id DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX ix_comentarios_usuario_criado
      ON comentarios (usuario_id, criado_em DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX ix_comentarios_status_criado
      ON comentarios (status, criado_em DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE comentarios');
  }
}
