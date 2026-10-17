import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
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
import { ObraNaTrilhaRespostaDto } from './dto/obra-na-trilha-resposta.dto';
import { ConsultarMapaQuery } from './queries/consultar-mapa.query';

@ApiTags('Exploração')
@Controller('explorar')
export class ExplorarController {
  constructor(
    private readonly trilhasService: TrilhasService,
    private readonly queryBus: QueryBus,
  ) {}

  // Consulta pública do mapa: mantém filtros, paginação e dados sem spoilers.
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
  ): Promise<MapaTrilhaRespostaDto> {
    // Encaminha a consulta ao handler registrado no CQRS.
    // Nesta etapa, o handler ainda utiliza o service e o banco principal.
    return this.queryBus.execute<
      ConsultarMapaQuery,
      MapaTrilhaRespostaDto
    >(new ConsultarMapaQuery(slug, filtros));
  }

  // Consulta pública de uma obra e suas vizinhas dentro da mesma trilha.
  @Get('trilhas/:slug/obras/:obraSlug')
  @ApiOperation({
    summary: 'Consultar uma obra dentro da trilha',
    description:
      'Retorna a obra publicada e suas vizinhas publicadas na trilha, sem resumo com spoilers.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Slug da trilha publicada.',
    example: 'curta',
  })
  @ApiParam({
    name: 'obraSlug',
    description: 'Slug da obra vinculada à trilha.',
    example: 'vingadores-guerra-infinita',
  })
  @ApiOkResponse({
    description:
      'Obra atual, anterior e próxima. Nas pontas, a vizinha ausente é null.',
    type: ObraNaTrilhaRespostaDto,
  })
  @ApiNotFoundResponse({
    description:
      'Trilha ou obra publicada não encontrada na trilha.',
  })
  consultarObraNaTrilha(
    @Param('slug') slug: string,
    @Param('obraSlug') obraSlug: string,
  ) {
    // O service verifica a publicação e encontra a anterior e a próxima.
    return this.trilhasService.consultarObraNaTrilha(
      slug,
      obraSlug,
    );
  }
}