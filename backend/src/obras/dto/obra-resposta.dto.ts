import { ApiProperty } from '@nestjs/swagger';

export class ObraRespostaDto {
  @ApiProperty({ format: 'uuid', example: 'd3b07384-d113-49d6-848e-28bc45bc4b64' })
  id!: string;

  @ApiProperty({ example: 'vingadores-guerra-infinita' })
  slug!: string;

  @ApiProperty({ example: 'Vingadores: Guerra Infinita' })
  titulo!: string;

  @ApiProperty({ example: 'FILME', enum: ['FILME', 'TEMPORADA'] })
  tipo!: string;

  @ApiProperty({ example: 2018 })
  anoLancamento!: number;

  @ApiProperty({ format: 'uuid', nullable: true, example: null })
  serieId!: string | null;

  @ApiProperty({ type: Number, nullable: true, example: null })
  numeroTemporada!: number | null;

  @ApiProperty({ example: 'Os Vingadores se unem para combater Thanos.' })
  resumoSemSpoiler!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Thanos junta as Joias do Infinito e elimina metade da vida no universo.',
    description: 'Apenas retornado se incluirSpoilers for true (Regra R03).',
  })
  resumoComSpoiler!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'https://exemplo.com/poster.jpg',
  })
  imagemUrl!: string | null;

  @ApiProperty({ enum: ['PUBLICADA', 'RASCUNHO', 'ARQUIVADA'], example: 'PUBLICADA' })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  criadoEm!: Date | string;

  @ApiProperty({ type: String, format: 'date-time' })
  atualizadoEm!: Date | string;
}

export class ListarObrasRespostaDto {
  @ApiProperty({ type: [ObraRespostaDto] })
  dados!: ObraRespostaDto[];

  @ApiProperty({ example: 34, minimum: 0 })
  total!: number;

  @ApiProperty({ example: 1, minimum: 1 })
  pagina!: number;

  @ApiProperty({ example: 20, minimum: 1, maximum: 50 })
  limite!: number;

  @ApiProperty({ example: 2, minimum: 0 })
  totalPaginas!: number;
}
