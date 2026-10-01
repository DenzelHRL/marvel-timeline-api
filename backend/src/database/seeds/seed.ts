import { hash } from 'bcrypt';
import { QueryRunner } from 'typeorm';
import { AppDataSource } from '../data-source';
import {
  ACONTECIMENTOS,
  ACONTECIMENTO_PERSONAGENS,
  ETAPAS_CURTA,
  ETAPAS_LONGA,
  OBRAS,
  PARTICIPACOES,
  PERMISSOES,
  PERSONAGENS,
  SERIES,
} from './seed-data';

type IdRow = { id: string };

async function idFor(
  runner: QueryRunner,
  table: string,
  key: string,
  value: string,
): Promise<string> {
  // Only fixed table/column names from this file are used here.
  const rows = (await runner.query(
    `SELECT id FROM "${table}" WHERE "${key}" = $1`,
    [value],
  )) as IdRow[];
  if (rows.length !== 1)
    throw new Error(`Seed não encontrou ${table}.${key}: ${value}`);
  return rows[0].id;
}

async function seedAccess(runner: QueryRunner): Promise<void> {
  const profiles = [
    ['LEITOR', 'Consulta as obras, comenta e acompanha o próprio progresso.'],
    ['ADMIN', 'Edita catálogo, trilhas, contas, acessos e modera comentários.'],
  ];
  for (const [code, description] of profiles) {
    await runner.query(
      'INSERT INTO perfis (codigo, descricao) VALUES ($1, $2) ON CONFLICT (codigo) DO NOTHING',
      [code, description],
    );
  }
  const readerId = await idFor(runner, 'perfis', 'codigo', 'LEITOR');
  const adminId = await idFor(runner, 'perfis', 'codigo', 'ADMIN');

  for (const permission of PERMISSOES) {
    await runner.query(
      'INSERT INTO permissoes (codigo, descricao) VALUES ($1, $2) ON CONFLICT (codigo) DO NOTHING',
      [permission.codigo, permission.descricao],
    );
    const permissionId = await idFor(
      runner,
      'permissoes',
      'codigo',
      permission.codigo,
    );
    const profilesWithPermission =
      permission.codigo.startsWith('conta:') ||
      permission.codigo.startsWith('progresso:') ||
      (permission.codigo.startsWith('comentarios:') &&
        permission.codigo !== 'comentarios:moderar')
        ? [readerId, adminId]
        : [adminId];
    for (const profileId of profilesWithPermission) {
      await runner.query(
        'INSERT INTO perfil_permissoes (perfil_id, permissao_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [profileId, permissionId],
      );
    }
  }
}

async function seedCatalog(runner: QueryRunner): Promise<Map<string, string>> {
  const seriesIds = new Map<string, string>();
  for (const serie of SERIES) {
    await runner.query(
      `INSERT INTO series (slug, titulo, descricao, status)
       VALUES ($1, $2, $3, 'PUBLICADA') ON CONFLICT (slug) DO NOTHING`,
      [serie.slug, serie.titulo, serie.descricao],
    );
    seriesIds.set(
      serie.slug,
      await idFor(runner, 'series', 'slug', serie.slug),
    );
  }

  const workIds = new Map<string, string>();
  for (const obra of OBRAS) {
    const serieId = 'serieSlug' in obra ? seriesIds.get(obra.serieSlug) : null;
    if ('serieSlug' in obra && !serieId)
      throw new Error(`Série ausente: ${obra.serieSlug}`);
    await runner.query(
      `INSERT INTO obras
       (slug, titulo, tipo, ano_lancamento, serie_id, numero_temporada,
        resumo_sem_spoiler, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PUBLICADA')
       ON CONFLICT (slug) DO NOTHING`,
      [
        obra.slug,
        obra.titulo,
        obra.tipo,
        obra.ano,
        serieId ?? null,
        'temporada' in obra ? obra.temporada : null,
        obra.resumo,
      ],
    );
    workIds.set(obra.slug, await idFor(runner, 'obras', 'slug', obra.slug));
  }

  for (const [slug, name, description, steps] of [
    [
      'curta',
      'Rumo a Doutor Destino — trilha curta',
      'Seleção iniciada em Guerra Infinita.',
      ETAPAS_CURTA,
    ],
    [
      'longa',
      'Rumo a Doutor Destino — trilha longa',
      'Seleção que começa com o primeiro Capitão América.',
      ETAPAS_LONGA,
    ],
  ] as const) {
    await runner.query(
      `INSERT INTO trilhas (slug, nome, descricao, status)
       VALUES ($1, $2, $3, 'PUBLICADA') ON CONFLICT (slug) DO NOTHING`,
      [slug, name, description],
    );
    const trailId = await idFor(runner, 'trilhas', 'slug', slug);
    for (const step of steps) {
      const obraId = workIds.get(step.slug);
      if (!obraId)
        throw new Error(`Obra ausente na trilha ${slug}: ${step.slug}`);
      await runner.query(
        `INSERT INTO etapas_trilha (trilha_id, obra_id, posicao, prioridade)
         VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
        [trailId, obraId, step.posicao, step.prioridade],
      );
    }
  }
  return workIds;
}

async function seedStories(
  runner: QueryRunner,
  workIds: Map<string, string>,
): Promise<void> {
  const characterIds = new Map<string, string>();
  for (const person of PERSONAGENS) {
    await runner.query(
      `INSERT INTO personagens (slug, nome, descricao_publica)
       VALUES ($1, $2, $3) ON CONFLICT (slug) DO NOTHING`,
      [person.slug, person.nome, person.descricao],
    );
    characterIds.set(
      person.slug,
      await idFor(runner, 'personagens', 'slug', person.slug),
    );
  }

  for (const part of PARTICIPACOES) {
    await runner.query(
      `INSERT INTO participacoes
       (obra_id, personagem_id, papel, presenca_e_spoiler, desfecho_spoiler)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT (obra_id, personagem_id) DO NOTHING`,
      [
        workIds.get(part.obraSlug),
        characterIds.get(part.personagemSlug),
        part.papel,
        part.presencaSpoiler,
        part.desfecho,
      ],
    );
  }

  for (const event of ACONTECIMENTOS) {
    const obraId = workIds.get(event.obraSlug);
    await runner.query(
      `INSERT INTO acontecimentos
       (obra_id, posicao, titulo, descricao, categoria, contem_spoiler)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (obra_id, posicao) DO NOTHING`,
      [
        obraId,
        event.posicao,
        event.titulo,
        event.descricao,
        event.categoria,
        event.spoiler,
      ],
    );
  }

  for (const link of ACONTECIMENTO_PERSONAGENS) {
    const obraId = workIds.get(link.obraSlug);
    const events = (await runner.query(
      'SELECT id FROM acontecimentos WHERE obra_id = $1 AND posicao = $2',
      [obraId, link.posicao],
    )) as IdRow[];
    if (events.length !== 1)
      throw new Error(
        `Acontecimento ausente: ${link.obraSlug}/${link.posicao}`,
      );
    for (const slug of link.personagens) {
      await runner.query(
        `INSERT INTO acontecimento_personagens (acontecimento_id, personagem_id)
         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [events[0].id, characterIds.get(slug)],
      );
    }
  }
}

async function seedDemoUser(
  runner: QueryRunner,
  email: string,
  nome: string,
  password: string,
  profileCode: 'ADMIN' | 'LEITOR',
): Promise<string> {
  const existing = (await runner.query(
    'SELECT id FROM usuarios WHERE email = $1',
    [email],
  )) as IdRow[];
  const profileId = await idFor(runner, 'perfis', 'codigo', profileCode);
  if (existing.length) {
    const links = (await runner.query(
      'SELECT 1 FROM usuario_perfis WHERE usuario_id = $1 AND perfil_id = $2',
      [existing[0].id, profileId],
    )) as unknown[];
    if (!links.length)
      throw new Error(
        `E-mail de demonstração já pertence a outra conta: ${email}`,
      );
    return existing[0].id; // Rerun never resets an existing password.
  }

  const passwordHash = await hash(password, 12);
  const inserted = (await runner.query(
    'INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id',
    [nome, email, passwordHash],
  )) as IdRow[];
  await runner.query(
    'INSERT INTO usuario_perfis (usuario_id, perfil_id) VALUES ($1, $2)',
    [inserted[0].id, profileId],
  );
  return inserted[0].id;
}

async function seedDemo(
  runner: QueryRunner,
  workIds: Map<string, string>,
): Promise<void> {
  if (process.env.SEED_DEMO_USERS !== 'true') return;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SEED_DEMO_USERS não pode ser usado em produção.');
  }
  const adminPassword = process.env.DEMO_ADMIN_PASSWORD;
  const readerPassword = process.env.DEMO_READER_PASSWORD;
  if (
    !adminPassword ||
    !readerPassword ||
    adminPassword.length < 8 ||
    readerPassword.length < 8
  ) {
    throw new Error(
      'Defina DEMO_ADMIN_PASSWORD e DEMO_READER_PASSWORD (mínimo 8 caracteres) no .env local.',
    );
  }

  await seedDemoUser(
    runner,
    'admin@marvel-timeline.test',
    'Administrador de demonstração',
    adminPassword,
    'ADMIN',
  );
  const readerId = await seedDemoUser(
    runner,
    'leitor@marvel-timeline.test',
    'Leitor de demonstração',
    readerPassword,
    'LEITOR',
  );
  for (const [id, texto, contemSpoiler] of [
    [
      'f8410444-3a6b-4d7e-a58a-dab982f6d3b0',
      'Gostei de rever os personagens se encontrando nesta obra.',
      false,
    ],
    [
      '33746259-5b44-4cc8-853c-9a23e229b19b',
      'A conclusão do confronto me surpreendeu.',
      true,
    ],
  ] as const) {
    await runner.query(
      `INSERT INTO comentarios (id, obra_id, usuario_id, texto, contem_spoiler)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
      [
        id,
        workIds.get('vingadores-guerra-infinita'),
        readerId,
        texto,
        contemSpoiler,
      ],
    );
  }
  for (const [slug, status, completedAt] of [
    ['vingadores-guerra-infinita', 'CONCLUIDO', '2026-09-01T18:00:00Z'],
    ['wandavision-temporada-1', 'ASSISTINDO', null],
    ['quarteto-fantastico-primeiros-passos', 'QUERO_VER', null],
  ] as const) {
    await runner.query(
      `INSERT INTO progresso (usuario_id, obra_id, status, concluido_em)
       VALUES ($1, $2, $3, $4) ON CONFLICT (usuario_id, obra_id) DO NOTHING`,
      [readerId, workIds.get(slug), status, completedAt],
    );
  }
}

async function main(): Promise<void> {
  await AppDataSource.initialize();
  try {
    const pending = await AppDataSource.showMigrations();
    if (pending) throw new Error('Execute npm run db:migrate antes dos seeds.');
    const runner = AppDataSource.createQueryRunner();
    await runner.connect();
    try {
      await runner.startTransaction();
      try {
        await seedAccess(runner);
        const workIds = await seedCatalog(runner);
        await seedStories(runner, workIds);
        await seedDemo(runner, workIds);
        await runner.commitTransaction();
        console.log(
          `Seed concluído: 2 perfis, ${PERMISSOES.length} permissões, 34 obras, 2 trilhas e 55 etapas.`,
        );
      } catch (error) {
        await runner.rollbackTransaction();
        throw error;
      }
    } finally {
      await runner.release();
    }
  } finally {
    await AppDataSource.destroy();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
