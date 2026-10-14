import { ApiProperty } from '@nestjs/swagger';

export class CadastroRespostaDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Maria Silva', maxLength: 160 })
  nome: string;

  @ApiProperty({
    example: 'maria@exemplo.test',
    format: 'email',
    maxLength: 254,
  })
  email: string;

  @ApiProperty({ example: true })
  ativo: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  criadoEm: string;
}
