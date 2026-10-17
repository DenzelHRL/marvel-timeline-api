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
import { ObrasService } from './obras.service';
import { ListarObrasDto } from './dto/listar-obras.dto';
import { ConsultarObraDto } from './dto/consultar-obra.dto';
import { ListarObrasRespostaDto, ObraRespostaDto } from './dto/obra-resposta.dto';
import { CriarObraDto } from './dto/criar-obra.dto';
import { AtualizarObraDto } from './dto/atualizar-obra.dto';
import { AlterarStatusObraDto } from './dto/alterar-status-obra.dto';

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

  @Post()
  @Authorize({
    roles: ['ADMIN'],
    permissions: ['obras:criar'],
  })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cadastrar nova obra',
    description:
      'Cria um novo filme ou temporada no catalogo com status RASCUNHO (Regra R04).',
  })
  @ApiCreatedResponse({
    description: 'Obra criada com sucesso.',
    type: ObraRespostaDto,
  })
  @ApiConflictResponse({
    description: 'Slug em uso ou numero de temporada repetido na serie.',
  })
  @ApiBadRequestResponse({
    description: 'Dados invalidos ou incoerentes entre tipo e serie/temporada.',
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente, invalido ou expirado.' })
  @ApiForbiddenResponse({ description: 'Requer perfil ADMIN e permissao obras:criar.' })
  criar(@Body() dto: CriarObraDto) {
    return this.obrasService.criar(dto);
  }

  @Patch(':id')
  @Authorize({
    roles: ['ADMIN'],
    permissions: ['obras:editar'],
  })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Editar dados de uma obra',
    description: 'Atualiza dados de uma obra existente pelo id (Regra R04).',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da obra',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Obra atualizada com sucesso.',
    type: ObraRespostaDto,
  })
  @ApiNotFoundResponse({
    description: 'Obra nao encontrada.',
  })
  @ApiConflictResponse({
    description: 'Slug ou numero de temporada em conflito.',
  })
  @ApiBadRequestResponse({
    description: 'Dados invalidos.',
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente, invalido ou expirado.' })
  @ApiForbiddenResponse({ description: 'Requer perfil ADMIN e permissao obras:editar.' })
  atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarObraDto,
  ) {
    return this.obrasService.atualizar(id, dto);
  }

  @Patch(':id/status')
  @Authorize({
    roles: ['ADMIN'],
    permissions: ['obras:editar'],
  })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Alterar status de uma obra',
    description:
      'Publica ou arquiva uma obra. Aplica verificacoes de dependencias (Regra R02).',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da obra',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Status atualizado com sucesso.',
    type: ObraRespostaDto,
  })
  @ApiNotFoundResponse({
    description: 'Obra nao encontrada.',
  })
  @ApiBadRequestResponse({
    description:
      'Transicao invalida (serie nao publicada ou pertencente a trilha publicada).',
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente, invalido ou expirado.' })
  @ApiForbiddenResponse({ description: 'Requer perfil ADMIN e permissao obras:editar.' })
  alterarStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AlterarStatusObraDto,
  ) {
    return this.obrasService.alterarStatus(id, dto);
  }
}
