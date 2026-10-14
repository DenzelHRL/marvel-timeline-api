import { Controller, Get, Query, Param } from '@nestjs/common';
import { ListarTrilhasRespostaDto, TrilhaRespostaDto } from './dto/listar-trilhas-resposta.dto';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiParam,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { TrilhasService } from './trilhas.service';
import { ListarTrilhasDto } from './dto/listar-trilhas.dto';
import { ListarEtapasDto } from './dto/listar-etapas.dto';
import { ListarEtapasRespostaDto } from './dto/listar-etapas-resposta.dto';

@ApiTags('Trilhas')
@Controller('trilhas')
export class TrilhasController {
  constructor(private readonly trilhasService: TrilhasService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar trilhas publicadas',
    description:
      'Retorna trilhas publicadas com filtros por nome e slug, além de paginação.',
  })
  @ApiOkResponse({
  description: 'Trilhas retornadas com os dados da paginação.',
  type: ListarTrilhasRespostaDto,
})


  @ApiBadRequestResponse({
    description:
      'Parâmetros inválidos. A página deve ser um inteiro maior ou igual a 1 e o limite deve ser um inteiro entre 1 e 50.',
  })
  listarPublicadas(@Query() filtros: ListarTrilhasDto) {
    return this.trilhasService.listarPublicadas(filtros);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Buscar uma trilha publicada pelo slug',
  })
  @ApiParam({
    name: 'slug',
    description: 'Slug exato da trilha.',
    example: 'curta',
  })
  @ApiOkResponse({
    description: 'Trilha encontrada.',
    type: TrilhaRespostaDto,
  })
  @ApiNotFoundResponse({
    description: 'Não existe uma trilha publicada com esse slug.',
  })
  buscarPublicadaPorSlug(@Param('slug') slug: string) {
    return this.trilhasService.buscarPublicadaPorSlug(slug);
  }

  @Get(':slug/etapas')
  @ApiOperation({
    summary: 'Listar etapas de uma trilha publicada',
  })
  @ApiParam({
    name: 'slug',
    description: 'Slug exato da trilha.',
    example: 'curta',
  })
  @ApiOkResponse({
  description: 'Etapas retornadas em ordem de posição, com paginação.',
  type: ListarEtapasRespostaDto,
  })
  @ApiBadRequestResponse({
    description: 'Filtros ou paginação inválidos.',
  })
  @ApiNotFoundResponse({
    description: 'Trilha publicada não encontrada.',
  })

  listarEtapas(
    @Param('slug') slug: string,
    @Query() filtros: ListarEtapasDto,
  ) {
    return this.trilhasService.listarEtapas(slug, filtros);
  }

  
}