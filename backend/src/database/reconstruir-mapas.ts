import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { databaseOptions } from './data-source';
import { Trilha } from './entities/catalog.entities';
import { ProjecaoMapaModule } from '../projecao-mapa/projecao-mapa.module';
import { ProjecaoMapaService } from '../projecao-mapa/projecao-mapa.service';
import { BancoLeituraService } from '../projecao-mapa/banco-leitura.service';

interface ResumoMapa {
  trilhaId: string;
  versao: string;
  publicada: boolean;
  etapas: number;
}

// Inicia apenas os módulos necessários, sem abrir um servidor HTTP.
@Module({
  imports: [
    TypeOrmModule.forRoot(databaseOptions()),
    ProjecaoMapaModule,
  ],
})
class ReconstruirMapasModule {}

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(
    ReconstruirMapasModule,
    {
      logger: ['error', 'warn'],
    },
  );

  try {
    const principal = app.get(DataSource);
    const projecao = app.get(ProjecaoMapaService);
    const bancoLeitura = app.get(BancoLeituraService);

    // Busca as trilhas oficiais no banco principal.
    const trilhas = await principal
      .getRepository(Trilha)
      .find({
        select: {
          id: true,
          slug: true,
        },
        order: {
          slug: 'ASC',
        },
      });

    // Utiliza o mesmo serviço que será chamado pelo worker da fila.
    for (const trilha of trilhas) {
      await projecao.reconstruir(trilha.id);
      console.log(`Mapa reconstruído: ${trilha.slug}`);
    }

    const leitura = await bancoLeitura.obterConexao();

    const bancos = await leitura.query<
      Array<{ banco: string }>
    >('SELECT current_database() AS banco');

    // Confere o conteúdo realmente gravado no segundo banco.
    const mapas = await leitura.query<ResumoMapa[]>(`
      SELECT
        trilha_id AS "trilhaId",
        versao::text AS versao,
        publicada,
        jsonb_array_length(itens) AS etapas
      FROM mapas_leitura
      ORDER BY trilha_id
    `);

    console.log(`Banco de leitura: ${bancos[0].banco}`);
    console.table(mapas);
    console.log(`Trilhas reconstruídas: ${trilhas.length}`);
  } finally {
    // Encerra o contexto e libera as conexões dos dois bancos.
    await app.close();
  }
}

void main().catch((error: unknown) => {
  console.error(
    'Falha na reconstrução dos mapas:',
    error instanceof Error ? error.message : 'Erro desconhecido.',
  );

  process.exitCode = 1;
});