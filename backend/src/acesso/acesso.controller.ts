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
import { Authorize } from './access.decorators';
import { AcessoService } from './acesso.service';
import {
  AlterarStatusUsuarioDto,
  AtribuirPerfilDto,
  AtribuirPerfilRespostaDto,
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
      'Busca contas por parte do nome e/ou e-mail, com paginação. Nunca retorna o hash da senha.',
  })
  @ApiOkResponse({
    description: 'Contas retornadas com metadados de paginação.',
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
      'Retorna os dados da conta identificada pelo UUID, sem incluir o hash da senha.',
  })
  @ApiOkResponse({
    description: 'Conta encontrada.',
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
}
