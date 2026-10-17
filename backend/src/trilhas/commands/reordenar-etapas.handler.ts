import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EtapaTrilha } from '../../database/entities/catalog.entities';
import { EtapasTrilhaService } from '../etapas-trilha.service';
import { ReordenarEtapasCommand } from './reordenar-etapas.command';

@CommandHandler(ReordenarEtapasCommand)
export class ReordenarEtapasHandler
  implements ICommandHandler<ReordenarEtapasCommand>
{
  constructor(
    private readonly etapasTrilhaService: EtapasTrilhaService,
  ) {}

  // Reutiliza as regras, os locks e a transação existentes.
  async execute(
    command: ReordenarEtapasCommand,
  ): Promise<EtapaTrilha[]> {
    return this.etapasTrilhaService.reordenar(
      command.trilhaId,
      command.dto,
    );
  }
}