import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Body,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { Authorize } from './autorizacao.decorators';
import { AcessoService } from './acesso.service';
import {
  AlterarStatusUsuarioDto,
  AtribuirPerfilDto,
  AtribuirPerfilRespostaDto,
  ListarPerfisDto,
  ListarPerfisRespostaDto,
  ListarPermissoesDto,
  ListarPermissoesRespostaDto,
  PermissaoAdminRespostaDto,
  PerfilAdminRespostaDto,
  PerfilPermissaoRespostaDto,
} from './dto';
import { ListarUsuariosDto } from './dto/listar-usuarios.dto';
import { ListarUsuariosRespostaDto } from './dto/listar-usuarios-resposta.dto';
import { UsuarioAdminRespostaDto } from './dto/usuario-admin-resposta.dto';

@ApiTags('Administração de usuários e acesso')
@ApiBearerAuth()
@Controller('admin')
export class AcessoController {
  constructor(private readonly acessoService: AcessoService) {}

  @Get('usuarios')
  @Authorize({
    roles: ['ADMIN'],
    permissions: ['usuarios:consultar_todos'],
  })
  @ApiOperation({
    summary: 'Listar contas de usuários',
    description:
      'Busca contas com filtros opcionais.',
  })
  @ApiOkResponse({
    description: 'Contas: ',
    type: ListarUsuariosRespostaDto,
  })
  @ApiBadRequestResponse({
    description: 'Filtros ou parâmetros de paginação inválidos.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT ausente, inválido, expirado ou conta inativa.',
  })
  @ApiForbiddenResponse({
    description: 'Perfil ou permissão insuficiente.',
  })
  listarUsuarios(
    @Query() filtros: ListarUsuariosDto,
  ): Promise<ListarUsuariosRespostaDto> {
    return this.acessoService.listarUsuarios(filtros);
  }

  @Get('usuarios/:id')
  @Authorize({
    roles: ['ADMIN'],
    permissions: ['usuarios:consultar_todos'],
  })
  @ApiOperation({
    summary: 'Consultar uma conta de usuário',
    description:
      'Retorna uma conta pelo UUID.',
  })
  @ApiOkResponse({
    description: 'Conta: ',
    type: UsuarioAdminRespostaDto,
  })
  @ApiBadRequestResponse({
    description: 'O identificador informado não é um UUID válido.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT ausente, inválido, expirado ou conta inativa.',
  })
  @ApiForbiddenResponse({
    description: 'Perfil ou permissão insuficiente.',
  })
  @ApiNotFoundResponse({
    description: 'Usuário não encontrado.',
  })
  async buscarUsuarioPorId(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UsuarioAdminRespostaDto> {
    const usuario = await this.acessoService.buscarUsuarioPorId(id);
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return usuario;
  }

  @Patch('usuarios/:id/status')
  @Authorize({
    roles: ['ADMIN'],
    permissions: ['usuarios:alterar_status'],
  })
  @ApiOperation({
    summary: 'Ativar ou desativar uma conta de usuário',
    description:
      'Impede desativar o último administrador ativo capaz de recuperar o acesso.',
  })
  @ApiOkResponse({
    description: 'Status atualizado.',
    type: UsuarioAdminRespostaDto,
  })
  @ApiBadRequestResponse({
    description: 'O UUID ou o corpo da requisição é inválido.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT ausente, inválido, expirado ou conta inativa.',
  })
  @ApiForbiddenResponse({ description: 'Perfil ou permissão insuficiente.' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  @ApiConflictResponse({
    description:
      'A alteração deixaria o sistema sem administrador recuperável.',
  })
  alterarStatusUsuario(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AlterarStatusUsuarioDto,
  ): Promise<UsuarioAdminRespostaDto> {
    return this.acessoService.alterarStatusUsuario(id, dto.ativo);
  }

  @Post('usuarios/:id/perfis')
  @Authorize({
    roles: ['ADMIN'],
    permissions: ['acessos:atribuir_perfil'],
  })
  @ApiOperation({ summary: 'Atribuir um perfil a uma conta de usuário' })
  @ApiCreatedResponse({
    description: 'Perfil atribuído.',
    type: AtribuirPerfilRespostaDto,
  })
  @ApiBadRequestResponse({
    description: 'O UUID do usuário ou o corpo da requisição é inválido.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT ausente, inválido, expirado ou conta inativa.',
  })
  @ApiForbiddenResponse({ description: 'Perfil ou permissão insuficiente.' })
  @ApiNotFoundResponse({
    description: 'Usuário ou perfil não encontrado.',
  })
  @ApiConflictResponse({ description: 'Esse perfil já está atribuído.' })
  atribuirPerfil(
    @Param('id', ParseUUIDPipe) usuarioId: string,
    @Body() dto: AtribuirPerfilDto,
  ): Promise<AtribuirPerfilRespostaDto> {
    return this.acessoService.atribuirPerfil(usuarioId, dto.perfilId);
  }

  @Delete('usuarios/:id/perfis/:perfilId')
  @Authorize({
    roles: ['ADMIN'],
    permissions: ['acessos:revogar_perfil'],
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revogar um perfil atribuído a uma conta' })
  @ApiNoContentResponse({ description: 'Perfil revogado.' })
  @ApiBadRequestResponse({
    description: 'O UUID do usuário ou do perfil é inválido.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT ausente, inválido, expirado ou conta inativa.',
  })
  @ApiForbiddenResponse({ description: 'Perfil ou permissão insuficiente.' })
  @ApiNotFoundResponse({
    description: 'Usuário, perfil ou vínculo não encontrado.',
  })
  @ApiConflictResponse({
    description:
      'A revogação deixaria o sistema sem administrador recuperável.',
  })
  revogarPerfil(
    @Param('id', ParseUUIDPipe) usuarioId: string,
    @Param('perfilId', ParseUUIDPipe) perfilId: string,
  ): Promise<void> {
    return this.acessoService.revogarPerfil(usuarioId, perfilId);
  }

  @Get('perfis')
  @Authorize({
    roles: ['ADMIN'],
    permissions: ['acessos:alterar_permissoes'],
  })
  @ApiOperation({
    summary: 'Listar perfis de acesso',
    description:
      'Busca perfis com filtros opcionais',
  })
  @ApiOkResponse({
    description: 'Perfis retornados com metadados de paginação.',
    type: ListarPerfisRespostaDto,
  })
  @ApiBadRequestResponse({
    description: 'Filtros ou parâmetros de paginação inválidos.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT ausente, inválido, expirado ou conta inativa.',
  })
  @ApiForbiddenResponse({ description: 'Perfil ou permissão insuficiente.' })
  listarPerfis(
    @Query() filtros: ListarPerfisDto,
  ): Promise<ListarPerfisRespostaDto> {
    return this.acessoService.listarPerfis(filtros);
  }

  @Get('perfis/:id')
  @Authorize({
    roles: ['ADMIN'],
    permissions: ['acessos:alterar_permissoes'],
  })
  @ApiOperation({ summary: 'Consultar um perfil pelo identificador' })
  @ApiOkResponse({
    description: 'Dados do perfil encontrado.',
    type: PerfilAdminRespostaDto,
  })
  @ApiBadRequestResponse({
    description: 'O identificador informado não é um UUID válido.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT ausente, inválido, expirado ou conta inativa.',
  })
  @ApiForbiddenResponse({ description: 'Perfil ou permissão insuficiente.' })
  @ApiNotFoundResponse({ description: 'Perfil não encontrado.' })
  async buscarPerfilPorId(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PerfilAdminRespostaDto> {
    const perfil = await this.acessoService.buscarPerfilPorId(id);
    if (!perfil) {
      throw new NotFoundException('Perfil não encontrado.');
    }

    return perfil;
  }

  @Get('perfis/:id/permissoes')
  @Authorize({
    roles: ['ADMIN'],
    permissions: ['acessos:alterar_permissoes'],
  })
  @ApiOperation({
    summary: 'Listar permissões concedidas a um perfil',
    description:
      'Filtra por código e/ou descrição e pagina somente as permissões vinculadas ao perfil.',
  })
  @ApiOkResponse({
    description: 'Permissões do perfil retornadas com paginação.',
    type: ListarPermissoesRespostaDto,
  })
  @ApiBadRequestResponse({
    description: 'O UUID do perfil, filtros ou paginação são inválidos.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT ausente, inválido, expirado ou conta inativa.',
  })
  @ApiForbiddenResponse({ description: 'Perfil ou permissão insuficiente.' })
  @ApiNotFoundResponse({ description: 'Perfil não encontrado.' })
  async listarPermissoesDoPerfil(
    @Param('id', ParseUUIDPipe) perfilId: string,
    @Query() filtros: ListarPermissoesDto,
  ): Promise<ListarPermissoesRespostaDto> {
    const resposta = await this.acessoService.listarPermissoesDoPerfil(
      perfilId,
      filtros,
    );
    if (!resposta) {
      throw new NotFoundException('Perfil não encontrado.');
    }

    return resposta;
  }

  @Put('perfis/:id/permissoes/:permissaoId')
  @Authorize({
    roles: ['ADMIN'],
    permissions: ['acessos:alterar_permissoes'],
  })
  @ApiOperation({ summary: 'Conceder uma permissão a um perfil' })
  @ApiOkResponse({
    description: 'Permissão concedida ao perfil.',
    type: PerfilPermissaoRespostaDto,
  })
  @ApiBadRequestResponse({
    description: 'O UUID do perfil ou da permissão é inválido.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT ausente, inválido, expirado ou conta inativa.',
  })
  @ApiForbiddenResponse({ description: 'Perfil ou permissão insuficiente.' })
  @ApiNotFoundResponse({
    description: 'Perfil ou permissão não encontrado.',
  })
  @ApiConflictResponse({
    description: 'A permissão já está concedida ao perfil.',
  })
  concederPermissaoAoPerfil(
    @Param('id', ParseUUIDPipe) perfilId: string,
    @Param('permissaoId', ParseUUIDPipe) permissaoId: string,
  ): Promise<PerfilPermissaoRespostaDto> {
    return this.acessoService.concederPermissaoAoPerfil(perfilId, permissaoId);
  }

  @Delete('perfis/:id/permissoes/:permissaoId')
  @Authorize({
    roles: ['ADMIN'],
    permissions: ['acessos:alterar_permissoes'],
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revogar uma permissão de um perfil' })
  @ApiNoContentResponse({ description: 'Permissão revogada do perfil.' })
  @ApiBadRequestResponse({
    description: 'O UUID do perfil ou da permissão é inválido.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT ausente, inválido, expirado ou conta inativa.',
  })
  @ApiForbiddenResponse({ description: 'Perfil ou permissão insuficiente.' })
  @ApiNotFoundResponse({
    description: 'Perfil, permissão ou vínculo não encontrado.',
  })
  @ApiConflictResponse({
    description:
      'A revogação deixaria o sistema sem administrador capaz de recuperar o acesso.',
  })
  revogarPermissaoDoPerfil(
    @Param('id', ParseUUIDPipe) perfilId: string,
    @Param('permissaoId', ParseUUIDPipe) permissaoId: string,
  ): Promise<void> {
    return this.acessoService.revogarPermissaoDoPerfil(perfilId, permissaoId);
  }

  @Get('permissoes')
  @Authorize({
    roles: ['ADMIN'],
    permissions: ['acessos:alterar_permissoes'],
  })
  @ApiOperation({
    summary: 'Listar permissões administrativas disponíveis',
    description:
      'Permissões com filtros opcionais',
  })
  @ApiOkResponse({
    description: 'Permissões retornadas com metadados de paginação.',
    type: ListarPermissoesRespostaDto,
  })
  @ApiBadRequestResponse({
    description: 'Filtros ou parâmetros de paginação inválidos.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT ausente, inválido, expirado ou conta inativa.',
  })
  @ApiForbiddenResponse({ description: 'Perfil ou permissão insuficiente.' })
  listarPermissoes(
    @Query() filtros: ListarPermissoesDto,
  ): Promise<ListarPermissoesRespostaDto> {
    return this.acessoService.listarPermissoes(filtros);
  }

  @Get('permissoes/:id')
  @Authorize({
    roles: ['ADMIN'],
    permissions: ['acessos:alterar_permissoes'],
  })
  @ApiOperation({ summary: 'Consultar uma permissão pelo identificador' })
  @ApiOkResponse({
    description: 'Dados da permissão encontrada.',
    type: PermissaoAdminRespostaDto,
  })
  @ApiBadRequestResponse({
    description: 'O identificador informado não é um UUID válido.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT ausente, inválido, expirado ou conta inativa.',
  })
  @ApiForbiddenResponse({ description: 'Perfil ou permissão insuficiente.' })
  @ApiNotFoundResponse({ description: 'Permissão não encontrada.' })
  async buscarPermissaoPorId(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PermissaoAdminRespostaDto> {
    const permissao = await this.acessoService.buscarPermissaoPorId(id);
    if (!permissao) {
      throw new NotFoundException('Permissão não encontrada.');
    }

    return permissao;
  }
}
