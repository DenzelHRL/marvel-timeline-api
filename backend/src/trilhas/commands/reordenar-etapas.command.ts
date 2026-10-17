import { ReordenarEtapasDto } from '../dto/reordenar-etapas.dto';

// Representa a solicitação de alteração da ordem de uma trilha.
export class ReordenarEtapasCommand {
  constructor(
    public readonly trilhaId: string,
    public readonly dto: ReordenarEtapasDto,
  ) {}
}