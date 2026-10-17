import { DataSourceOptions } from 'typeorm';
import { databaseOptions } from './data-source';
import { CriarMapasLeitura1792233000000 } from './leitura-migrations/1792233000000-CriarMapasLeitura';

// Reutiliza a conexão principal, direcionando para outro banco.
export function leituraDatabaseOptions(): DataSourceOptions {
  const principal = databaseOptions();
  const nomeBanco = process.env.READ_DB_NAME?.trim();

  if (principal.type !== 'postgres') {
    throw new Error('O banco de leitura exige PostgreSQL.');
  }

  if (!nomeBanco) {
    throw new Error('Configure READ_DB_NAME no arquivo .env.');
  }

  const nomePrincipal = principal.url
    ? decodeURIComponent(new URL(principal.url).pathname.slice(1))
    : principal.database;

  // Impede que as migrations de leitura atinjam o banco principal.
  if (nomeBanco === nomePrincipal) {
    throw new Error(
      'READ_DB_NAME deve ser diferente do banco principal.',
    );
  }

  const leitura = {
    ...principal,
    name: 'leitura',
    database: nomeBanco,

    // A projeção será acessada por consultas SQL parametrizadas.
    entities: [],

    // Mantém as migrations de leitura separadas das migrations do domínio.
    migrations: [CriarMapasLeitura1792233000000],
    migrationsTableName: 'migrations_leitura',

    synchronize: false,
    migrationsRun: false,
  };

  // Preserva host, credenciais e opções quando existe DATABASE_URL.
  if (principal.url) {
    const url = new URL(principal.url);
    url.pathname = `/${encodeURIComponent(nomeBanco)}`;
    leitura.url = url.toString();
  }

  return leitura;
}