import { ApiProperty } from '@nestjs/swagger';

export class PermissaoAdminRespostaDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'usuarios:consultar_todos', maxLength: 100 })
  codigo!: string;

  @ApiProperty({ example: 'Consultar a lista de usuários para administração.' })
  descricao!: string;
}
