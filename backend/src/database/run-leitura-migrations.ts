import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { leituraDatabaseOptions } from './leitura-data-source';

async function main(): Promise<void> {
  const conexao = new DataSource(leituraDatabaseOptions());

  try {
    await conexao.initialize();

    // Executa apenas as migrations registradas para o banco de leitura.
    const executadas = await conexao.runMigrations();

    console.log(
      `Migrations de leitura executadas: ${executadas.length}`,
    );
  } finally {
    if (conexao.isInitialized) {
      await conexao.destroy();
    }
  }
}

void main().catch((error: unknown) => {
  console.error(
    'Falha nas migrations de leitura:',
    error instanceof Error ? error.message : 'Erro desconhecido.',
  );

  process.exitCode = 1;
});