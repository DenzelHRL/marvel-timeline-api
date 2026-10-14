import { ApiProperty } from '@nestjs/swagger';

export class SerieRespostaDto {
  @ApiProperty({ format: 'uuid', example: 'd3b07384-d113-49d6-848e-28bc45bc4b64' })
  id!: string;

  @ApiProperty({ example: 'loki' })
  slug!: string;

  @ApiProperty({ example: 'Loki' })
  titulo!: string;

  @ApiProperty({ example: 'Acompanha as desventuras de Loki após os eventos de Ultimato.' })
  descricao!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'https://exemplo.com/imagens/loki.jpg',
  })
  imagemUrl!: string | null;

  @ApiProperty({ enum: ['PUBLICADA', 'RASCUNHO', 'ARQUIVADA'], example: 'PUBLICADA' })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  criadoEm!: Date | string;

  @ApiProperty({ type: String, format: 'date-time' })
  atualizadoEm!: Date | string;
}

export class ListarSeriesRespostaDto {
  @ApiProperty({ type: [SerieRespostaDto] })
  dados!: SerieRespostaDto[];

  @ApiProperty({ example: 3, minimum: 0 })
  total!: number;

  @ApiProperty({ example: 1, minimum: 1 })
  pagina!: number;

  @ApiProperty({ example: 20, minimum: 1, maximum: 50 })
  limite!: number;

  @ApiProperty({ example: 1, minimum: 0 })
  totalPaginas!: number;
}
