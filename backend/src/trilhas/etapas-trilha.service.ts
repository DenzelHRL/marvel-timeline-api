import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import {
  EtapaTrilha,
  Obra,
  Trilha,
} from '../database/entities/catalog.entities';
import { AtualizarEtapaDto } from './dto/atualizar-etapa.dto';
import { ReordenarEtapasDto } from './dto/reordenar-etapas.dto';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class EtapasTrilhaService {
  constructor(
    @InjectRepository(Trilha)
    private readonly trilhasRepository: Repository<Trilha>,

    private readonly cacheService: CacheService
  ) {}

  async atualizar(
    trilhaId: string,
    etapaId: string,
    dto: AtualizarEtapaDto,
  ): Promise<EtapaTrilha> {
    if (
      dto.prioridade === undefined &&
      dto.justificativa === undefined
    ) {
      throw new BadRequestException(
        'Informe a prioridade ou a justificativa para atualizar.',
      );
    }

    return this.trilhasRepository.manager.transaction(
      async (manager) => {
        const trilhasRepository = manager.getRepository(Trilha);
        const etapasRepository = manager.getRepository(EtapaTrilha);

        const trilha = await trilhasRepository.findOne({
          where: { id: trilhaId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!trilha) {
          throw new NotFoundException('Trilha não encontrada.');
        }

        const etapa = await etapasRepository.findOne({
          where: {
            id: etapaId,
            trilhaId,
          },
          lock: { mode: 'pessimistic_write' },
        });

        if (!etapa) {
          throw new NotFoundException(
            'Etapa não encontrada nesta trilha.',
          );
        }

        if (dto.prioridade !== undefined) {
          etapa.prioridade = dto.prioridade;
        }

        if (dto.justificativa !== undefined) {
          etapa.justificativa = dto.justificativa;
        }
        const etapaAtualizada = await etapasRepository.save(etapa);
        await this.cacheService.invalidarPorPadrao("trilhas:*");
        return etapaAtualizada; 
      },
    );
  }

  async remover(
    trilhaId: string,
    etapaId: string,
  ): Promise<void> {
    await this.trilhasRepository.manager.transaction(
      async (manager) => {
        const trilhasRepository = manager.getRepository(Trilha);
        const etapasRepository = manager.getRepository(EtapaTrilha);

        const trilha = await trilhasRepository.findOne({
          where: { id: trilhaId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!trilha) {
          throw new NotFoundException('Trilha não encontrada.');
        }

        const etapa = await etapasRepository.findOne({
          where: {
            id: etapaId,
            trilhaId,
          },
          lock: { mode: 'pessimistic_write' },
        });

        if (!etapa) {
          throw new NotFoundException(
            'Etapa não encontrada nesta trilha.',
          );
        }

        if (trilha.status === 'PUBLICADA') {
          const etapasValidasRestantes = await etapasRepository
            .createQueryBuilder('etapa')
            .innerJoin(
              Obra,
              'obra',
              'obra.id = etapa.obraId',
            )
            .where('etapa.trilhaId = :trilhaId', {
              trilhaId,
            })
            .andWhere('etapa.id <> :etapaId', {
              etapaId,
            })
            .andWhere('obra.status = :status', {
              status: 'PUBLICADA',
            })
            .getCount();

          if (etapasValidasRestantes === 0) {
            throw new BadRequestException(
              'Não é possível remover a última etapa com obra publicada de uma trilha publicada.',
            );
          }
        }

        await etapasRepository.delete({
          id: etapaId,
          trilhaId,
        });

        const etapasSeguintes = await etapasRepository.find({
          where: {
            trilhaId,
            posicao: MoreThan(etapa.posicao),
          },
          order: {
            posicao: 'ASC',
          },
        });

        for (const etapaSeguinte of etapasSeguintes) {
          await etapasRepository.update(
            {
              id: etapaSeguinte.id,
              trilhaId,
            },
            {
              posicao: etapaSeguinte.posicao - 1,
            },
          );
        }
      },
    );

    await this.cacheService.invalidarPorPadrao("trilhas:*");
  }

  async reordenar(
    trilhaId: string,
    dto: ReordenarEtapasDto,
  ): Promise<EtapaTrilha[]> {
    return this.trilhasRepository.manager.transaction(
      async (manager) => {
        const trilhasRepository = manager.getRepository(Trilha);
        const etapasRepository = manager.getRepository(EtapaTrilha);

        const trilha = await trilhasRepository.findOne({
          where: { id: trilhaId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!trilha) {
          throw new NotFoundException('Trilha não encontrada.');
        }

        const etapas = await etapasRepository.find({
          where: { trilhaId },
          order: {
            posicao: 'ASC',
          },
          lock: { mode: 'pessimistic_write' },
        });

        if (etapas.length === 0) {
          throw new BadRequestException(
            'A trilha não possui etapas para reordenar.',
          );
        }

        const etapaIds = dto.etapaIds.map(
          (id) => id.toLowerCase(),
        );

        const idsRecebidos = new Set(etapaIds);

        const idsDaTrilha = new Set(
          etapas.map((etapa) => etapa.id.toLowerCase()),
        );

        const listaCompleta =
          etapaIds.length === etapas.length &&
          idsRecebidos.size === etapas.length &&
          etapaIds.every((id) => idsDaTrilha.has(id));

        if (!listaCompleta) {
          throw new BadRequestException(
            'Informe todas as etapas desta trilha exatamente uma vez, sem incluir etapas de outras trilhas.',
          );
        }

        const maiorPosicao = etapas.reduce(
          (maior, etapa) => Math.max(maior, etapa.posicao),
          0,
        );

        const limiteInteiro = 2147483647;

        if (maiorPosicao + etapas.length > limiteInteiro) {
          throw new BadRequestException(
            'As posições atuais excedem o limite permitido para reordenação.',
          );
        }

        // Primeira fase: move todas as etapas para posições
        // temporárias acima da maior posição existente.
        for (let indice = 0; indice < etapas.length; indice++) {
          await etapasRepository.update(
            {
              id: etapas[indice].id,
              trilhaId,
            },
            {
              posicao: maiorPosicao + indice + 1,
            },
          );
        }

        // Segunda fase: aplica a ordem solicitada,
        // com posições consecutivas a partir de 1.
        for (let indice = 0; indice < etapaIds.length; indice++) {
          await etapasRepository.update(
            {
              id: etapaIds[indice],
              trilhaId,
            },
            {
              posicao: indice + 1,
            },
          );
        }

        const etapasOrdenadas = await etapasRepository.find({
          where: { trilhaId },
          order: {
            posicao: 'ASC',
          },
        });
          
        await this.cacheService.invalidarPorPadrao("trilhas:*");
        return etapasOrdenadas;
      },
    );
  }
}