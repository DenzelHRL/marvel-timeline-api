import { ApiProperty } from '@nestjs/swagger';

export class PerfilAdminRespostaDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'ADMIN', maxLength: 60 })
  codigo!: string;

  @ApiProperty({ example: 'Edita catálogo, trilhas, contas e acessos.' })
  descricao!: string;
}
