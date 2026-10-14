import { ApiProperty } from '@nestjs/swagger';

export class AtribuirPerfilRespostaDto {
  @ApiProperty({ format: 'uuid' })
  usuarioId!: string;

  @ApiProperty({ format: 'uuid' })
  perfilId!: string;

  @ApiProperty({ example: 'LEITOR' })
  codigo!: string;
}
