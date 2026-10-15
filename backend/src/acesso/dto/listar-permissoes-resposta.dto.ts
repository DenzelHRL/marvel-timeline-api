import { ApiProperty } from '@nestjs/swagger';
import { PermissaoAdminRespostaDto } from './permissao-admin-resposta.dto';

export class ListarPermissoesRespostaDto {
  @ApiProperty({ type: [PermissaoAdminRespostaDto] })
  dados!: PermissaoAdminRespostaDto[];

  @ApiProperty({ example: 26, minimum: 0 })
  total!: number;

  @ApiProperty({ example: 1, minimum: 1 })
  pagina!: number;

  @ApiProperty({ example: 20, minimum: 1, maximum: 50 })
  limite!: number;

  @ApiProperty({ example: 2, minimum: 0 })
  totalPaginas!: number;
}
