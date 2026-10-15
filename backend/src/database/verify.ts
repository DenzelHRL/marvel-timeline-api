import { AppDataSource } from './data-source';

type CountRow = { total: number };

const TABLES = [
  'series',
  'obras',
  'trilhas',
  'etapas_trilha',
  'personagens',
  'participacoes',
  'acontecimentos',
  'acontecimento_personagens',
  'usuarios',
  'identidades_externas',
  'perfis',
  'permissoes',
  'usuario_perfis',
  'perfil_permissoes',
  'progresso',
  'comentarios',
];

async function count(sql: string, parameters: unknown[] = []): Promise<number> {
  const rows = (await AppDataSource.query(sql, parameters)) as CountRow[];
  return Number(rows[0].total);
}

function requireAtLeast(label: string, actual: number, minimum: number): void {
  if (actual < minimum) {
    throw new Error(
      `${label}: esperado pelo menos ${minimum}, encontrado ${actual}`,
    );
  }
  console.log(`${label}: ${actual}`);
}

async function main(): Promise<void> {
  await AppDataSource.initialize();
  try {
    if (await AppDataSource.showMigrations()) {
      throw new Error('Existem migrations pendentes. Rode npm run db:migrate.');
    }

    const existing = (await AppDataSource.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = current_schema() AND table_name = ANY($1::text[])`,
      [TABLES],
    )) as { table_name: string }[];
    const names = new Set(existing.map((row) => row.table_name));
    const missing = TABLES.filter((table) => !names.has(table));
    if (missing.length)
      throw new Error(`Tabelas ausentes: ${missing.join(', ')}`);
    console.log(`Tabelas do domínio: ${names.size}/${TABLES.length}`);

    requireAtLeast(
      'Séries',
      await count('SELECT count(*)::int AS total FROM series'),
      3,
    );
    requireAtLeast(
      'Obras',
      await count('SELECT count(*)::int AS total FROM obras'),
      34,
    );
    requireAtLeast(
      'Temporadas',
      await count(
        "SELECT count(*)::int AS total FROM obras WHERE tipo = 'TEMPORADA'",
      ),
      4,
    );
    requireAtLeast(
      'Trilhas',
      await count('SELECT count(*)::int AS total FROM trilhas'),
      2,
    );
    requireAtLeast(
      'Etapas',
      await count('SELECT count(*)::int AS total FROM etapas_trilha'),
      54,
    );
    requireAtLeast(
      'Etapas da trilha curta',
      await count(
        `SELECT count(*)::int AS total FROM etapas_trilha e
         JOIN trilhas t ON t.id = e.trilha_id WHERE t.slug = $1`,
        ['curta'],
      ),
      20,
    );
    requireAtLeast(
      'Etapas da trilha longa',
      await count(
        `SELECT count(*)::int AS total FROM etapas_trilha e
         JOIN trilhas t ON t.id = e.trilha_id WHERE t.slug = $1`,
        ['longa'],
      ),
      34,
    );
    requireAtLeast(
      'Obra compartilhada entre trilhas',
      await count(
        `SELECT count(*)::int AS total FROM etapas_trilha e
         JOIN obras o ON o.id = e.obra_id WHERE o.slug = $1`,
        ['vingadores-guerra-infinita'],
      ),
      2,
    );
    requireAtLeast(
      'Perfis',
      await count('SELECT count(*)::int AS total FROM perfis'),
      2,
    );
    requireAtLeast(
      'Permissões',
      await count('SELECT count(*)::int AS total FROM permissoes'),
      26,
    );
    requireAtLeast(
      'Moderação apenas para ADMIN',
      await count(
        `SELECT count(*)::int AS total FROM perfil_permissoes pp
         JOIN perfis p ON p.id = pp.perfil_id
         JOIN permissoes a ON a.id = pp.permissao_id
         WHERE p.codigo = 'ADMIN' AND a.codigo = 'comentarios:moderar'`,
      ),
      1,
    );
    const readerModeration = await count(
      `SELECT count(*)::int AS total FROM perfil_permissoes pp
       JOIN perfis p ON p.id = pp.perfil_id
       JOIN permissoes a ON a.id = pp.permissao_id
       WHERE p.codigo = 'LEITOR' AND a.codigo = 'comentarios:moderar'`,
    );
    if (readerModeration !== 0) {
      throw new Error('LEITOR recebeu permissão de moderação por engano.');
    }
    requireAtLeast(
      'Edição administrativa de usuários',
      await count(
        `SELECT count(*)::int AS total FROM perfil_permissoes pp
         JOIN perfis p ON p.id = pp.perfil_id
         JOIN permissoes a ON a.id = pp.permissao_id
         WHERE p.codigo = 'ADMIN' AND a.codigo = 'usuarios:editar'`,
      ),
      1,
    );
    const readerEditUsers = await count(
      `SELECT count(*)::int AS total FROM perfil_permissoes pp
       JOIN perfis p ON p.id = pp.perfil_id
       JOIN permissoes a ON a.id = pp.permissao_id
       WHERE p.codigo = 'LEITOR' AND a.codigo = 'usuarios:editar'`,
    );
    if (readerEditUsers !== 0) {
      throw new Error('LEITOR recebeu permissão de editar outros usuários.');
    }

    console.log(
      'Banco pronto para desenvolver rotas. Isto não testa guards/JWT nem endpoints.',
    );
  } finally {
    await AppDataSource.destroy();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

