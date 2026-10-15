import { ApiProperty } from '@nestjs/swagger';
import { PerfilAdminRespostaDto } from './perfil-admin-resposta.dto';

export class ListarPerfisRespostaDto {
  @ApiProperty({ type: [PerfilAdminRespostaDto] })
  dados!: PerfilAdminRespostaDto[];

  @ApiProperty({ example: 2, minimum: 0 })
  total!: number;

  @ApiProperty({ example: 1, minimum: 1 })
  pagina!: number;

  @ApiProperty({ example: 20, minimum: 1, maximum: 50 })
  limite!: number;

  @ApiProperty({ example: 1, minimum: 0 })
  totalPaginas!: number;
}
