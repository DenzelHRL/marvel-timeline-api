import { ApiProperty } from '@nestjs/swagger';

export class PerfilPermissaoRespostaDto {
  @ApiProperty({ format: 'uuid' })
  perfilId!: string;

  @ApiProperty({ format: 'uuid' })
  permissaoId!: string;

  @ApiProperty({ example: 'acessos:alterar_permissoes' })
  codigo!: string;
}
