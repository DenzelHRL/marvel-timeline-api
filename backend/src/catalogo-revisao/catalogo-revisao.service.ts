import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { DataSource, EntityManager } from 'typeorm';

interface RevisaoRegistro {
  versao: string;
}

interface TrilhaRegistro {
  id: string;
}

@Injectable()
export class CatalogoRevisaoService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async atual(
    manager: EntityManager = this.dataSource.manager,
  ): Promise<string> {
    const registros = await manager.query<RevisaoRegistro[]>(`
      SELECT versao::text AS versao
      FROM catalogo_revisao
      WHERE id = 1
    `);

    return this.extrairVersao(registros);
  }

  async bloquear(manager: EntityManager): Promise<void> {
    this.exigirTransacao(manager);

    const registros = await manager.query<RevisaoRegistro[]>(`
      SELECT versao::text AS versao
      FROM catalogo_revisao
      WHERE id = 1
      FOR UPDATE
    `);

    this.extrairVersao(registros);
  }

  async registrarAlteracao(
    manager: EntityManager,
  ): Promise<string> {
    this.exigirTransacao(manager);

    const registros = await manager.query<RevisaoRegistro[]>(`
      WITH atualizada AS (
        UPDATE catalogo_revisao
        SET versao = versao + 1
        WHERE id = 1
        RETURNING versao
      )
      SELECT versao::text AS versao
      FROM atualizada
    `);

    const versao = this.extrairVersao(registros);

    const trilhas = await manager.query<TrilhaRegistro[]>(`
      SELECT id
      FROM trilhas
      ORDER BY id
    `);

    for (const trilha of trilhas) {
      await manager.query(
        `
          INSERT INTO mapa_outbox (
            event_id,
            trilha_id,
            versao
          )
          VALUES ($1, $2, $3::bigint)
        `,
        [randomUUID(), trilha.id, versao],
      );
    }

    return versao;
  }

  private exigirTransacao(manager: EntityManager): void {
    if (!manager.queryRunner?.isTransactionActive) {
      throw new Error(
        'O controle de revisão exige uma transação ativa.',
      );
    }
  }

  private extrairVersao(
    registros: RevisaoRegistro[],
  ): string {
    if (!registros[0]) {
      throw new Error(
        'Revisão do catálogo não encontrada. Execute as migrations.',
      );
    }

    return registros[0].versao;
  }
}
