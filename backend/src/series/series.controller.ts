import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { SeriesService } from './series.service';
import { ListarSeriesDto } from './dto/listar-series.dto';
import { ListarSeriesRespostaDto, SerieRespostaDto } from './dto/serie-resposta.dto';

@ApiTags('Séries')
@Controller('series')
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar séries publicadas',
    description:
      'Retorna séries publicadas com filtros opcionais por título e slug, com paginação.',
  })
  @ApiOkResponse({
    description: 'Séries retornadas com metadados de paginação.',
    type: ListarSeriesRespostaDto,
  })
  @ApiBadRequestResponse({
    description:
      'Parâmetros inválidos. A página deve ser maior ou igual a 1 e o limite entre 1 e 50.',
  })
  listarPublicadas(@Query() filtros: ListarSeriesDto) {
    return this.seriesService.listarPublicadas(filtros);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Consultar dados de uma série',
    description: 'Retorna os detalhes de uma série publicada pelo seu slug.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Slug identificador da série (ex.: loki)',
    type: String,
    example: 'loki',
  })
  @ApiOkResponse({
    description: 'Dados da série encontrados com sucesso.',
    type: SerieRespostaDto,
  })
  @ApiNotFoundResponse({
    description: 'Série não encontrada ou não publicada.',
  })
  consultarPorSlug(@Param('slug') slug: string) {
    return this.seriesService.consultarPorSlug(slug);
  }
}
