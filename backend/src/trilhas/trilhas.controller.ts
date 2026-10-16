import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Authorize } from '../acesso/autorizacao.decorators';
import { TrilhasService } from './trilhas.service';
import { EtapasTrilhaService } from './etapas-trilha.service';
import { CriarTrilhaDto } from './dto/criar-trilha.dto';
import { AtualizarTrilhaDto } from './dto/atualizar-trilha.dto';
import { AlterarStatusTrilhaDto } from './dto/alterar-status-trilha.dto';
import { CriarEtapaDto } from './dto/criar-etapa.dto';
import { AtualizarEtapaDto } from './dto/atualizar-etapa.dto';
import { ListarTrilhasDto } from './dto/listar-trilhas.dto';
import {
  ListarTrilhasRespostaDto,
  TrilhaRespostaDto,
} from './dto/listar-trilhas-resposta.dto';
import { ListarEtapasDto } from './dto/listar-etapas.dto';
import {
  EtapaRespostaDto,
  ListarEtapasRespostaDto,
} from './dto/listar-etapas-resposta.dto';
import { TrilhaAdminRespostaDto } from './dto/trilha-admin-resposta.dto';

@ApiTags('Trilhas')
@Controller('trilhas')
export class TrilhasController {
  constructor(
    private readonly trilhasService: TrilhasService,
    private readonly etapasTrilhaService: EtapasTrilhaService,
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

  @Patch(':id')
  @Authorize({
    roles: ['ADMIN'],
    permissions: ['trilhas:editar'],
  })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Editar os dados de uma trilha',
    description:
      'Atualiza apenas os campos informados entre nome, slug e descrição. Não altera status nem etapas. Exige perfil ADMIN e permissão trilhas:editar.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da trilha.',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Trilha atualizada.',
    type: TrilhaAdminRespostaDto,
  })
  @ApiBadRequestResponse({
    description: 'UUID ou dados do corpo inválidos.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido ou conta inativa.',
  })
  @ApiForbiddenResponse({
    description: 'Perfil ou permissão insuficiente.',
  })
  @ApiNotFoundResponse({
    description: 'Trilha não encontrada.',
  })
  @ApiConflictResponse({
    description: 'Já existe uma trilha com esse slug.',
  })
  atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarTrilhaDto,
  ) {
    return this.trilhasService.atualizar(id, dto);
  }

  @Patch(':id/status')
  @Authorize({
    roles: ['ADMIN'],
    permissions: ['trilhas:editar'],
  })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Alterar o status de uma trilha',
    description:
      'Altera o status para RASCUNHO, PUBLICADA ou ARQUIVADA. Para publicar, a trilha precisa ter ao menos uma etapa vinculada a uma obra publicada. Exige perfil ADMIN e permissão trilhas:editar.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da trilha.',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Status da trilha atualizado.',
    type: TrilhaAdminRespostaDto,
  })
  @ApiBadRequestResponse({
    description:
      'UUID ou status inválido, ou tentativa de publicar uma trilha sem etapa com obra publicada.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido ou conta inativa.',
  })
  @ApiForbiddenResponse({
    description: 'Perfil ou permissão insuficiente.',
  })
  @ApiNotFoundResponse({
    description: 'Trilha não encontrada.',
  })
  alterarStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AlterarStatusTrilhaDto,
  ) {
    return this.trilhasService.alterarStatus(id, dto);
  }

  @Post(':id/etapas')
  @Authorize({
    roles: ['ADMIN'],
    permissions: ['etapas:editar'],
  })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Adicionar uma etapa à trilha',
    description:
      'Vincula uma obra à trilha na posição informada e desloca as etapas seguintes. A mesma obra não pode aparecer duas vezes na mesma trilha. Trilhas publicadas só podem receber obras publicadas. Exige perfil ADMIN e permissão etapas:editar.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da trilha que receberá a etapa.',
    format: 'uuid',
  })
  @ApiCreatedResponse({
    description: 'Etapa criada e posições seguintes ajustadas.',
    type: EtapaRespostaDto,
  })
  @ApiBadRequestResponse({
    description:
      'UUID ou dados inválidos, posição fora do intervalo permitido, ou obra não publicada para uma trilha publicada.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido ou conta inativa.',
  })
  @ApiForbiddenResponse({
    description: 'Perfil ou permissão insuficiente.',
  })
  @ApiNotFoundResponse({
    description: 'Trilha ou obra não encontrada.',
  })
  @ApiConflictResponse({
    description: 'Essa obra já está vinculada à trilha.',
  })
  criarEtapa(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CriarEtapaDto,
  ) {
    return this.trilhasService.criarEtapa(id, dto);
  }

  @Patch(':id/etapas/:etapaId')
  @Authorize({
    roles: ['ADMIN'],
    permissions: ['etapas:editar'],
  })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Editar uma etapa da trilha',
    description:
      'Altera prioridade e/ou justificativa da etapa. Envie justificativa null para removê-la. Não altera a obra vinculada nem a posição. Exige perfil ADMIN e permissão etapas:editar.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da trilha.',
    format: 'uuid',
  })
  @ApiParam({
    name: 'etapaId',
    description: 'UUID da etapa pertencente à trilha.',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Etapa atualizada.',
    type: EtapaRespostaDto,
  })
  @ApiBadRequestResponse({
    description:
      'UUID ou dados inválidos, ou corpo sem campos editáveis.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido ou conta inativa.',
  })
  @ApiForbiddenResponse({
    description: 'Perfil ou permissão insuficiente.',
  })
  @ApiNotFoundResponse({
    description: 'Trilha ou etapa não encontrada na trilha.',
  })
  atualizarEtapa(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('etapaId', ParseUUIDPipe) etapaId: string,
    @Body() dto: AtualizarEtapaDto,
  ) {
    return this.etapasTrilhaService.atualizar(id, etapaId, dto);
  }

  @Delete(':id/etapas/:etapaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Authorize({
    roles: ['ADMIN'],
    permissions: ['etapas:editar'],
  })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Remover uma etapa da trilha',
    description:
      'Remove o vínculo da obra com a trilha e reduz em uma unidade as posições seguintes, na mesma transação. A obra permanece no catálogo. Uma trilha publicada precisa manter ao menos uma etapa com obra publicada. Exige perfil ADMIN e permissão etapas:editar.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da trilha.',
    format: 'uuid',
  })
  @ApiParam({
    name: 'etapaId',
    description: 'UUID da etapa pertencente à trilha.',
    format: 'uuid',
  })
  @ApiNoContentResponse({
    description:
      'Etapa removida e posições seguintes ajustadas. Resposta sem corpo.',
  })
  @ApiBadRequestResponse({
    description:
      'UUID inválido ou tentativa de deixar uma trilha publicada sem etapa com obra publicada.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido ou conta inativa.',
  })
  @ApiForbiddenResponse({
    description: 'Perfil ou permissão insuficiente.',
  })
  @ApiNotFoundResponse({
    description: 'Trilha ou etapa não encontrada na trilha.',
  })
  removerEtapa(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('etapaId', ParseUUIDPipe) etapaId: string,
  ): Promise<void> {
    return this.etapasTrilhaService.remover(id, etapaId);
  }
}