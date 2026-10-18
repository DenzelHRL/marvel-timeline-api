import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { TrilhasService } from '../trilhas.service';
import { MapaTrilhaRespostaDto } from '../dto/mapa-trilha-resposta.dto';
import { MapaLeituraService } from '../../projecao-mapa/mapa-leitura.service';
import { ConsultarMapaQuery } from './consultar-mapa.query';

@QueryHandler(ConsultarMapaQuery)
export class ConsultarMapaHandler
  implements IQueryHandler<ConsultarMapaQuery>
{
  constructor(
    private readonly trilhasService: TrilhasService,
    private readonly mapaLeitura: MapaLeituraService,
  ) {}

  async execute(
    query: ConsultarMapaQuery,
  ): Promise<MapaTrilhaRespostaDto> {
    // A leitura otimizada é habilitada explicitamente pelo ambiente.
    if (process.env.CQRS_MAPA_ENABLED === 'true') {
      const mapa = await this.mapaLeitura.consultarSeAtual(
        query.slug,
        query.filtros,
      );

      if (mapa) {
        return mapa;
      }
    }

    // Preserva a resposta quando a projeção estiver atrasada ou desligada.
    return this.trilhasService.consultarMapa(
      query.slug,
      query.filtros,
    );
  }
}