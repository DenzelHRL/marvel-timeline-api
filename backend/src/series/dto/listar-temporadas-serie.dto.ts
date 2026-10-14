import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListarTemporadasSerieDto {
  @ApiPropertyOptional({
    description: 'Filtro pelo número da temporada.',
    type: Number,
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  numeroTemporada?: number;

  @ApiPropertyOptional({
    description: 'Filtro pelo ano de lançamento da temporada.',
    type: Number,
    example: 2021,
    minimum: 1900,
    maximum: 2100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  anoLancamento?: number;

  @ApiPropertyOptional({
    description: 'Número da página.',
    type: Number,
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina: number = 1;

  @ApiPropertyOptional({
    description: 'Quantidade de itens por página.',
    type: Number,
    default: 20,
    minimum: 1,
    maximum: 50,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limite: number = 20;
}

export class TemporadaItemRespostaDto {
  @ApiProperty({ format: 'uuid', example: 'd3b07384-d113-49d6-848e-28bc45bc4b64' })
  id!: string;

  @ApiProperty({ example: 'loki-temporada-1' })
  slug!: string;

  @ApiProperty({ example: 'Loki — Temporada 1' })
  titulo!: string;

  @ApiProperty({ example: 'TEMPORADA', enum: ['TEMPORADA'] })
  tipo!: string;

  @ApiProperty({ example: 2021 })
  anoLancamento!: number;

  @ApiProperty({ example: 1 })
  numeroTemporada!: number;

  @ApiProperty({ example: 'Loki é levado à AVT após fugir com o Tesseract.' })
  resumoSemSpoiler!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'https://exemplo.com/imagens/loki-t1.jpg',
  })
  imagemUrl!: string | null;

  @ApiProperty({ enum: ['PUBLICADA'], example: 'PUBLICADA' })
  status!: string;
}

export class ListarTemporadasSerieRespostaDto {
  @ApiProperty({ type: [TemporadaItemRespostaDto] })
  dados!: TemporadaItemRespostaDto[];

  @ApiProperty({ example: 2, minimum: 0 })
  total!: number;

  @ApiProperty({ example: 1, minimum: 1 })
  pagina!: number;

  @ApiProperty({ example: 20, minimum: 1, maximum: 50 })
  limite!: number;

  @ApiProperty({ example: 1, minimum: 0 })
  totalPaginas!: number;
}
