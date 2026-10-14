import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { TrilhasService } from './trilhas.service';
import { ListarEtapasDto } from './dto/listar-etapas.dto';
import { MapaTrilhaRespostaDto } from './dto/mapa-trilha-resposta.dto';

@ApiTags('Exploração')
@Controller('explorar')
export class ExplorarController {
  constructor(
    private readonly trilhasService: TrilhasService,
  ) {}

  @Get('trilhas/:slug/mapa')
  @ApiOperation({
    summary: 'Consultar o mapa de uma trilha',
    description:
      'Retorna etapas e dados das obras publicadas, em ordem de posição, com filtros e paginação. Não inclui o resumo com spoilers.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Slug exato da trilha publicada.',
    example: 'curta',
  })
  @ApiOkResponse({
    description: 'Dados do mapa retornados com paginação.',
    type: MapaTrilhaRespostaDto,
  })
  @ApiBadRequestResponse({
    description: 'Filtros ou paginação inválidos.',
  })
  @ApiNotFoundResponse({
    description: 'Trilha publicada não encontrada.',
  })
  consultarMapa(
    @Param('slug') slug: string,
    @Query() filtros: ListarEtapasDto,
  ) {
    return this.trilhasService.consultarMapa(slug, filtros);
  }
}