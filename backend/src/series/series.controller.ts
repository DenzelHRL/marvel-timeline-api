import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { SeriesService } from './series.service';
import { ListarSeriesDto } from './dto/listar-series.dto';
import { ListarSeriesRespostaDto, SerieRespostaDto } from './dto/serie-resposta.dto';
import {
  ListarTemporadasSerieDto,
  ListarTemporadasSerieRespostaDto,
} from './dto/listar-temporadas-serie.dto';
import { CriarSerieDto } from './dto/criar-serie.dto';
import { AtualizarSerieDto } from './dto/atualizar-serie.dto';
import { AlterarStatusSerieDto } from './dto/alterar-status-serie.dto';

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

  @Get(':slug/temporadas')
  @ApiOperation({
    summary: 'Listar temporadas de uma serie',
    description: 'Retorna as temporadas de uma serie com filtros opcionais por numero e ano de lancamento.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Slug da serie (ex: loki)',
    type: String,
    example: 'loki',
  })
  @ApiOkResponse({
    description: 'Temporadas encontradas com sucesso.',
    type: ListarTemporadasSerieRespostaDto,
  })
  @ApiNotFoundResponse({
    description: 'Serie nao encontrada ou nao publicada.',
  })
  listarTemporadas(
    @Param('slug') slug: string,
    @Query() query: ListarTemporadasSerieDto,
  ) {
    return this.seriesService.listarTemporadas(slug, query);
  }

  @Post()

  @ApiOperation({
    summary: 'Cadastrar serie',
    description: 'Cria uma nova serie com status inicial de rascunho.',
  })
  @ApiCreatedResponse({
    description: 'Serie criada com sucesso.',
    type: SerieRespostaDto,
  })
  @ApiConflictResponse({
    description: 'Ja existe uma serie com esse slug.',
  })
  criar(@Body() dto: CriarSerieDto) {
    return this.seriesService.criar(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Editar dados da serie',
    description: 'Atualiza metadados da serie pelo id, sem alterar o status.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da serie',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Serie atualizada com sucesso.',
    type: SerieRespostaDto,
  })
  @ApiNotFoundResponse({
    description: 'Serie nao encontrada.',
  })
  @ApiConflictResponse({
    description: 'Slug ja esta em uso por outra serie.',
  })
  atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarSerieDto,
  ) {
    return this.seriesService.atualizar(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Alterar status da serie',
    description: 'Publica ou arquiva uma serie. Bloqueia o arquivamento caso tenha temporadas publicadas (Regra R02).',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da serie',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Status atualizado com sucesso.',
    type: SerieRespostaDto,
  })
  @ApiNotFoundResponse({
    description: 'Serie nao encontrada.',
  })
  @ApiBadRequestResponse({
    description: 'Nao e permitido arquivar uma serie com temporadas publicadas.',
  })
  alterarStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AlterarStatusSerieDto,
  ) {
    return this.seriesService.alterarStatus(id, dto);
  }
}
