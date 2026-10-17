import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
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
import { ListarObrasAdminDto } from './dto/listar-obras-admin.dto';
import { ListarObrasRespostaDto, ObraRespostaDto } from './dto/obra-resposta.dto';

@ApiTags('Administração de obras')
@ApiBearerAuth()
@Authorize({
  roles: ['ADMIN'],
  permissions: ['obras:editar'],
})
@Controller('admin/obras')
export class AdminObrasController {
  constructor(private readonly obrasService: ObrasService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar obras para edição administrativa',
    description:
      'Retorna obras (incluindo rascunhos e arquivadas) com paginação e filtros por tipo e status. Requer perfil ADMIN e permissão obras:editar.',
  })
  @ApiOkResponse({
    description: 'Lista de obras retornada com sucesso.',
    type: ListarObrasRespostaDto,
  })
  @ApiBadRequestResponse({
    description: 'Parâmetros de consulta inválidos.',
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente, inválido ou expirado.' })
  @ApiForbiddenResponse({ description: 'Requer perfil ADMIN e permissão obras:editar.' })
  listar(@Query() filtros: ListarObrasAdminDto) {
    return this.obrasService.listarAdmin(filtros);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consultar obra por ID para edição',
    description:
      'Retorna qualquer obra pelo ID, mesmo em rascunho ou arquivada, com todos os dados para edição. Requer perfil ADMIN e permissão obras:editar.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da obra',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Obra encontrada com sucesso.',
    type: ObraRespostaDto,
  })
  @ApiNotFoundResponse({
    description: 'Obra não encontrada.',
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente, inválido ou expirado.' })
  @ApiForbiddenResponse({ description: 'Requer perfil ADMIN e permissão obras:editar.' })
  consultarPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.obrasService.consultarPorIdAdmin(id);
  }
}
