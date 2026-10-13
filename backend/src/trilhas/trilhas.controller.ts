import { Controller, Get, Query } from '@nestjs/common';
import { ListarTrilhasRespostaDto } from './dto/listar-trilhas-resposta.dto';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { TrilhasService } from './trilhas.service';
import { ListarTrilhasDto } from './dto/listar-trilhas.dto';

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
}