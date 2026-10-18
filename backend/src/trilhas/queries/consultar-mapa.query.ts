import { ListarEtapasDto } from '../dto/listar-etapas.dto';

export class ConsultarMapaQuery {
  constructor(
    public readonly slug: string,
    public readonly filtros: ListarEtapasDto,
  ) {}
}