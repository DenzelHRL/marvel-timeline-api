import { ApiProperty } from '@nestjs/swagger';
import { UsuarioAdminRespostaDto } from './usuario-admin-resposta.dto';

export class ListarUsuariosRespostaDto {
  @ApiProperty({ type: [UsuarioAdminRespostaDto] })
  dados!: UsuarioAdminRespostaDto[];

  @ApiProperty({ example: 42, minimum: 0 })
  total!: number;

  @ApiProperty({ example: 1, minimum: 1 })
  pagina!: number;

  @ApiProperty({ example: 20, minimum: 1, maximum: 50 })
  limite!: number;

  @ApiProperty({ example: 3, minimum: 0 })
  totalPaginas!: number;
}
