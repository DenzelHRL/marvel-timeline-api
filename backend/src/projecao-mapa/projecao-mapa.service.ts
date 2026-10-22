import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CatalogoRevisaoService } from '../catalogo-revisao/catalogo-revisao.service';
import {
  EtapaTrilha,
  Obra,
  Trilha,
} from '../database/entities/catalog.entities';
import { ItemMapaDto } from '../trilhas/dto/mapa-trilha-resposta.dto';
import { BancoLeituraService } from './banco-leitura.service';

interface SnapshotMapa {
  versao: string;
  publicada: boolean;
  itens: ItemMapaDto[];
}

@Injectable()
export class ProjecaoMapaService {
  constructor(
    @InjectDataSource()
    private readonly principal: DataSource,
    private readonly bancoLeitura: BancoLeituraService,
    private readonly revisao: CatalogoRevisaoService,
  ) {}

  // Ponto de integração: a fila chamará este método para atualizar uma trilha.
  async reconstruir(trilhaId: string): Promise<void> {
    const snapshot = await this.principal.transaction(
      'REPEATABLE READ',
      async (manager): Promise<SnapshotMapa> => {
        // Lê versão, publicação e etapas no mesmo snapshot do principal.
        await manager.query('SET TRANSACTION READ ONLY');

        const versao = await this.revisao.atual(manager);

        const trilha = await manager
          .getRepository(Trilha)
          .findOne({
            where: { id: trilhaId },
          });

        // Mantém um registro não público para impedir reaparecimento
        // de uma projeção antiga após arquivamento ou remoção.
        if (!trilha || trilha.status !== 'PUBLICADA') {
          return {
            versao,
            publicada: false,
            itens: [],
          };
        }

        // Seleciona somente os campos públicos usados pelo mapa.
        const itens = await manager
          .getRepository(EtapaTrilha)
          .createQueryBuilder('etapa')
          .innerJoin(
            Obra,
            'obra',
            'obra.id = etapa.obraId',
          )
          .where('etapa.trilhaId = :trilhaId', {
            trilhaId,
          })
          .andWhere('obra.status = :status', {
            status: 'PUBLICADA',
          })
          .select('etapa.id', 'id')
          .addSelect('etapa.trilhaId', 'trilhaId')
          .addSelect('etapa.obraId', 'obraId')
          .addSelect('etapa.posicao', 'posicao')
          .addSelect('etapa.prioridade', 'prioridade')
          .addSelect('etapa.justificativa', 'justificativa')
          .addSelect('obra.slug', 'obraSlug')
          .addSelect('obra.titulo', 'titulo')
          .addSelect('obra.resumoSemSpoiler', 'resumoSemSpoiler')
          .addSelect('obra.imagemUrl', 'imagemUrl')
          .orderBy('etapa.posicao', 'ASC')
          .addOrderBy('etapa.id', 'ASC')
          .getRawMany<ItemMapaDto>();

        return {
          versao,
          publicada: true,
          itens,
        };
      },
    );

    const leitura = await this.bancoLeitura.obterConexao();

    // Grava o mapa completo no segundo banco.
    // Uma tarefa antiga não sobrescreve versão mais recente; a mesma versão pode ser refeita.
    await leitura.query(
      `
        INSERT INTO mapas_leitura (
          trilha_id,
          versao,
          publicada,
          itens,
          atualizado_em
        )
        VALUES ($1, $2::bigint, $3, $4::jsonb, now())
        ON CONFLICT (trilha_id) DO UPDATE
        SET versao = EXCLUDED.versao,
            publicada = EXCLUDED.publicada,
            itens = EXCLUDED.itens,
            atualizado_em = EXCLUDED.atualizado_em
        WHERE mapas_leitura.versao <= EXCLUDED.versao
      `,
      [
        trilhaId,
        snapshot.versao,
        snapshot.publicada,
        JSON.stringify(snapshot.itens),
      ],
    );
  }
}