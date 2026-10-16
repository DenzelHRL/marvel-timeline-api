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

@Injectable()
export class EtapasTrilhaService {
  constructor(
    @InjectRepository(Trilha)
    private readonly trilhasRepository: Repository<Trilha>,
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

        return etapasRepository.save(etapa);
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
  }
}