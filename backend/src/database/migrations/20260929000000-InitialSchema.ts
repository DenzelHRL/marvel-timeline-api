import { MigrationInterface, QueryRunner } from 'typeorm';

// The migration is deliberately explicit: no synchronize() is used in any environment.
export class InitialSchema20260929000000 implements MigrationInterface {
  name = 'InitialSchema20260929000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE series (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        slug varchar(160) NOT NULL UNIQUE,
        titulo varchar(200) NOT NULL,
        descricao text NOT NULL,
        imagem_url text,
        status varchar(20) NOT NULL DEFAULT 'RASCUNHO'
          CHECK (status IN ('RASCUNHO', 'PUBLICADA', 'ARQUIVADA')),
        criado_em timestamptz NOT NULL DEFAULT now(),
        atualizado_em timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE obras (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        slug varchar(180) NOT NULL UNIQUE,
        titulo varchar(220) NOT NULL,
        tipo varchar(20) NOT NULL CHECK (tipo IN ('FILME', 'TEMPORADA')),
        ano_lancamento smallint NOT NULL,
        serie_id uuid REFERENCES series(id) ON DELETE RESTRICT,
        numero_temporada smallint,
        resumo_sem_spoiler text NOT NULL,
        resumo_com_spoiler text,
        imagem_url text,
        status varchar(20) NOT NULL DEFAULT 'RASCUNHO'
          CHECK (status IN ('RASCUNHO', 'PUBLICADA', 'ARQUIVADA')),
        criado_em timestamptz NOT NULL DEFAULT now(),
        atualizado_em timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT ck_obras_temporada CHECK (
          (tipo = 'FILME' AND serie_id IS NULL AND numero_temporada IS NULL) OR
          (tipo = 'TEMPORADA' AND serie_id IS NOT NULL AND numero_temporada > 0)
        )
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_obras_serie_temporada
      ON obras (serie_id, numero_temporada) WHERE tipo = 'TEMPORADA'
    `);
    await queryRunner.query(
      `CREATE INDEX ix_obras_tipo_ano ON obras (tipo, ano_lancamento)`,
    );

    await queryRunner.query(`
      CREATE TABLE trilhas (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        slug varchar(160) NOT NULL UNIQUE,
        nome varchar(200) NOT NULL,
        descricao text NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'RASCUNHO'
          CHECK (status IN ('RASCUNHO', 'PUBLICADA', 'ARQUIVADA')),
        criado_em timestamptz NOT NULL DEFAULT now(),
        atualizado_em timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE etapas_trilha (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        trilha_id uuid NOT NULL REFERENCES trilhas(id) ON DELETE RESTRICT,
        obra_id uuid NOT NULL REFERENCES obras(id) ON DELETE RESTRICT,
        posicao integer NOT NULL CHECK (posicao > 0),
        prioridade varchar(20) NOT NULL CHECK (prioridade IN ('PRINCIPAL', 'CONTEXTO')),
        justificativa text,
        CONSTRAINT uq_etapas_trilha_posicao UNIQUE (trilha_id, posicao),
        CONSTRAINT uq_etapas_trilha_obra UNIQUE (trilha_id, obra_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE personagens (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        slug varchar(160) NOT NULL UNIQUE,
        nome varchar(200) NOT NULL,
        descricao_publica text,
        imagem_url text,
        criado_em timestamptz NOT NULL DEFAULT now(),
        atualizado_em timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE participacoes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        obra_id uuid NOT NULL REFERENCES obras(id) ON DELETE RESTRICT,
        personagem_id uuid NOT NULL REFERENCES personagens(id) ON DELETE RESTRICT,
        papel varchar(40) NOT NULL,
        descricao_publica text,
        presenca_e_spoiler boolean NOT NULL DEFAULT false,
        desfecho_spoiler text,
        criado_em timestamptz NOT NULL DEFAULT now(),
        atualizado_em timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_participacoes_obra_personagem UNIQUE (obra_id, personagem_id)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE acontecimentos (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        obra_id uuid NOT NULL REFERENCES obras(id) ON DELETE RESTRICT,
        titulo varchar(200) NOT NULL,
        descricao text NOT NULL,
        categoria varchar(40) NOT NULL,
        posicao integer NOT NULL CHECK (posicao > 0),
        contem_spoiler boolean NOT NULL DEFAULT false,
        criado_em timestamptz NOT NULL DEFAULT now(),
        atualizado_em timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_acontecimentos_obra_posicao UNIQUE (obra_id, posicao)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE acontecimento_personagens (
        acontecimento_id uuid NOT NULL REFERENCES acontecimentos(id) ON DELETE RESTRICT,
        personagem_id uuid NOT NULL REFERENCES personagens(id) ON DELETE RESTRICT,
        PRIMARY KEY (acontecimento_id, personagem_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE usuarios (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        nome varchar(160) NOT NULL,
        email varchar(254) NOT NULL,
        senha_hash text,
        ativo boolean NOT NULL DEFAULT true,
        criado_em timestamptz NOT NULL DEFAULT now(),
        atualizado_em timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT ck_usuarios_email_normalizado CHECK (email = lower(trim(email)))
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX uq_usuarios_email_ci ON usuarios (lower(email))`,
    );
    await queryRunner.query(`
      CREATE TABLE identidades_externas (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
        provedor varchar(30) NOT NULL,
        id_no_provedor varchar(255) NOT NULL,
        CONSTRAINT uq_identidades_provedor_id UNIQUE (provedor, id_no_provedor),
        CONSTRAINT uq_identidades_usuario_provedor UNIQUE (usuario_id, provedor)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE perfis (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        codigo varchar(60) NOT NULL UNIQUE,
        descricao text NOT NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE permissoes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        codigo varchar(100) NOT NULL UNIQUE,
        descricao text NOT NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE usuario_perfis (
        usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
        perfil_id uuid NOT NULL REFERENCES perfis(id) ON DELETE RESTRICT,
        PRIMARY KEY (usuario_id, perfil_id)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE perfil_permissoes (
        perfil_id uuid NOT NULL REFERENCES perfis(id) ON DELETE RESTRICT,
        permissao_id uuid NOT NULL REFERENCES permissoes(id) ON DELETE RESTRICT,
        PRIMARY KEY (perfil_id, permissao_id)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE progresso (
        usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
        obra_id uuid NOT NULL REFERENCES obras(id) ON DELETE RESTRICT,
        status varchar(20) NOT NULL
          CHECK (status IN ('QUERO_VER', 'ASSISTINDO', 'CONCLUIDO')),
        concluido_em timestamptz,
        atualizado_em timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (usuario_id, obra_id),
        CONSTRAINT ck_progresso_conclusao CHECK (
          (status = 'CONCLUIDO' AND concluido_em IS NOT NULL) OR
          (status <> 'CONCLUIDO' AND concluido_em IS NULL)
        )
      )
    `);
    await queryRunner.query(
      `CREATE INDEX ix_progresso_usuario_status ON progresso (usuario_id, status)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of [
      'progresso',
      'perfil_permissoes',
      'usuario_perfis',
      'permissoes',
      'perfis',
      'identidades_externas',
      'usuarios',
      'acontecimento_personagens',
      'acontecimentos',
      'participacoes',
      'personagens',
      'etapas_trilha',
      'trilhas',
      'obras',
      'series',
    ]) {
      await queryRunner.query(`DROP TABLE "${table}"`);
    }
  }
}
