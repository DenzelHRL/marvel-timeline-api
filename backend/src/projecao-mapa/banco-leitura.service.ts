import {
  Injectable,
  OnApplicationShutdown,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { leituraDatabaseOptions } from '../database/leitura-data-source';

@Injectable()
export class BancoLeituraService
  implements OnApplicationShutdown
{
  private inicializacao?: Promise<DataSource>;

  // Compartilha uma conexão iniciada apenas quando necessário.
  obterConexao(): Promise<DataSource> {
    if (!this.inicializacao) {
      const opcoes = leituraDatabaseOptions();

      const conexao = new DataSource({
        ...opcoes,

        // Limita a espera para permitir fallback quando a leitura falhar.
        extra: {
          ...opcoes.extra,
          connectionTimeoutMillis: 2000,
          statement_timeout: 2000,
          query_timeout: 2000,
        },
      });

      this.inicializacao = conexao.initialize().catch(
        (error: unknown) => {
          this.inicializacao = undefined;
          throw error;
        },
      );
    }

    return this.inicializacao;
  }

  async onApplicationShutdown(): Promise<void> {
    const conexao = await this.inicializacao?.catch(
      () => undefined,
    );

    if (conexao?.isInitialized) {
      await conexao.destroy();
    }
  }
}