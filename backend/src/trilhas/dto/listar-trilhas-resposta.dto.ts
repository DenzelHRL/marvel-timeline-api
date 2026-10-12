import { ApiProperty } from '@nestjs/swagger';

export class TrilhaRespostaDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'curta' })
  slug!: string;

  @ApiProperty({
    example: 'Rumo a Doutor Destino — trilha curta',
  })
  nome!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Seleção iniciada em Guerra Infinita.',
  })
  descricao!: string | null;

  @ApiProperty({ enum: ['PUBLICADA'], example: 'PUBLICADA' })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  criadoEm!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  atualizadoEm!: string;
}

export class ListarTrilhasRespostaDto {
  @ApiProperty({ type: [TrilhaRespostaDto] })
  dados!: TrilhaRespostaDto[];

  @ApiProperty({ example: 2, minimum: 0 })
  total!: number;

  @ApiProperty({ example: 1, minimum: 1 })
  pagina!: number;

  @ApiProperty({ example: 20, minimum: 1, maximum: 50 })
  limite!: number;

  @ApiProperty({ example: 1, minimum: 0 })
  totalPaginas!: number;
}