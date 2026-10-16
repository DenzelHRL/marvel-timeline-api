import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Authorize } from '../acesso/autorizacao.decorators';
import { TrilhasService } from './trilhas.service';
import { CriarTrilhaDto } from './dto/criar-trilha.dto';
import { ListarTrilhasDto } from './dto/listar-trilhas.dto';
import {
  ListarTrilhasRespostaDto,
  TrilhaRespostaDto,
} from './dto/listar-trilhas-resposta.dto';
import { ListarEtapasDto } from './dto/listar-etapas.dto';
import { ListarEtapasRespostaDto } from './dto/listar-etapas-resposta.dto';
import { TrilhaAdminRespostaDto } from './dto/trilha-admin-resposta.dto';

@ApiTags('Trilhas')
@Controller('trilhas')
export class TrilhasController {
  constructor(
    private readonly trilhasService: TrilhasService,
  ) {}

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
    description:
      'Etapas retornadas em ordem de posição, com paginação.',
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

  @Post()
  @Authorize({
    roles: ['ADMIN'],
    permissions: ['trilhas:criar'],
  })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Criar uma trilha',
    description:
      'Cria uma trilha com status inicial RASCUNHO. Exige perfil ADMIN e permissão trilhas:criar.',
  })
  @ApiCreatedResponse({
  description: 'Trilha criada com status RASCUNHO.',
  type: TrilhaAdminRespostaDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos no corpo da requisição.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido ou conta inativa.',
  })
  @ApiForbiddenResponse({
    description: 'Perfil ou permissão insuficiente.',
  })
  @ApiConflictResponse({
    description: 'Já existe uma trilha com esse slug.',
  })
  criar(@Body() dto: CriarTrilhaDto) {
    return this.trilhasService.criar(dto);
  }
}