import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ObrasService } from './obras.service';
import { ListarObrasDto } from './dto/listar-obras.dto';
import { ConsultarObraDto } from './dto/consultar-obra.dto';
import { ListarObrasRespostaDto, ObraRespostaDto } from './dto/obra-resposta.dto';

@ApiTags('Obras')
@Controller('obras')
export class ObrasController {
  constructor(private readonly obrasService: ObrasService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar obras publicadas',
    description:
      'Retorna filmes e temporadas com paginacao e filtros opcionais por tipo e ano de lancamento.',
  })
  @ApiOkResponse({
    description: 'Lista de obras retornada com sucesso.',
    type: ListarObrasRespostaDto,
  })
  @ApiBadRequestResponse({
    description: 'Parametros de consulta invalidos.',
  })
  listarPublicadas(@Query() filtros: ListarObrasDto) {
    return this.obrasService.listarPublicadas(filtros);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Consultar dados de uma obra',
    description:
      'Retorna os detalhes de uma obra pelo slug. O resumo com spoiler fica oculto por padrao, exceto se incluirSpoilers for true (Regra R03).',
  })
  @ApiParam({
    name: 'slug',
    description: 'Slug identificador da obra (ex: vingadores-guerra-infinita)',
    type: String,
    example: 'vingadores-guerra-infinita',
  })
  @ApiOkResponse({
    description: 'Dados da obra encontrados com sucesso.',
    type: ObraRespostaDto,
  })
  @ApiNotFoundResponse({
    description: 'Obra nao encontrada ou nao publicada.',
  })
  consultarPorSlug(
    @Param('slug') slug: string,
    @Query() query: ConsultarObraDto,
  ) {
    return this.obrasService.consultarPorSlug(slug, query);
  }
}
