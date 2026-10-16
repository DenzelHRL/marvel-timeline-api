import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EtapaTrilha,
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
}