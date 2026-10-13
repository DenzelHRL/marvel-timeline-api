import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { Authorize } from './access.decorators';
import { AcessoService } from './acesso.service';
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
}
