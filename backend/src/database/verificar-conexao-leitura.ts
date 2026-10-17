import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { leituraDatabaseOptions } from './leitura-data-source';

async function main(): Promise<void> {
  const conexao = new DataSource(leituraDatabaseOptions());

  try {
    await conexao.initialize();

    // Confirma o banco realmente acessado, sem criar tabelas.
    const resultado = await conexao.query<
      Array<{ banco: string }>
    >('SELECT current_database() AS banco');

    console.log(`Banco conectado: ${resultado[0].banco}`);
    console.log('Conexão de leitura validada.');
  } finally {
    // Encerra a conexão para liberar o terminal.
    if (conexao.isInitialized) {
      await conexao.destroy();
    }
  }
}

void main().catch((error: unknown) => {
  console.error(
    'Falha na conexão de leitura:',
    error instanceof Error ? error.message : 'Erro desconhecido.',
  );

  process.exitCode = 1;
});