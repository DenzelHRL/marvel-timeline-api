import { ApiProperty } from '@nestjs/swagger';

export class TrilhaAdminRespostaDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'minha-trilha-marvel' })
  slug!: string;

  @ApiProperty({ example: 'Minha trilha Marvel' })
  nome!: string;

  @ApiProperty({
    example: 'Uma seleção de obras para acompanhar a história.',
  })
  descricao!: string;

  @ApiProperty({
    enum: ['RASCUNHO', 'PUBLICADA', 'ARQUIVADA'],
    example: 'RASCUNHO',
  })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  criadoEm!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  atualizadoEm!: string;
}