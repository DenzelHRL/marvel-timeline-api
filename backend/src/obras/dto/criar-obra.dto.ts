import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { TipoObra } from '../../database/entities/catalog.entities';

export class CriarObraDto {
  @ApiProperty({
    description: 'Titulo da obra',
    example: 'Vingadores: Guerra Infinita',
    maxLength: 220,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(220)
  titulo!: string;

  @ApiProperty({
    description: 'Slug identificador unico da obra',
    example: 'vingadores-guerra-infinita',
    maxLength: 180,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  slug!: string;

  @ApiProperty({
    description: 'Tipo da obra (FILME ou TEMPORADA)',
    enum: ['FILME', 'TEMPORADA'],
    example: 'FILME',
  })
  @IsNotEmpty()
  @IsIn(['FILME', 'TEMPORADA'])
  tipo!: TipoObra;

  @ApiProperty({
    description: 'Ano de lancamento',
    example: 2018,
    minimum: 1900,
    maximum: 2100,
  })
  @IsInt()
  @Min(1900)
  @Max(2100)
  anoLancamento!: number;

  @ApiPropertyOptional({
    description: 'UUID da serie a qual a temporada pertence (apenas para TEMPORADA)',
    format: 'uuid',
    example: 'd3b07384-d113-49d6-848e-28bc45bc4b64',
  })
  @IsOptional()
  @IsUUID()
  serieId?: string;

  @ApiPropertyOptional({
    description: 'Numero da temporada (apenas para TEMPORADA)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  numeroTemporada?: number;

  @ApiProperty({
    description: 'Resumo livre de spoilers',
    example: 'Os Vingadores se unem para deter Thanos.',
  })
  @IsString()
  @IsNotEmpty()
  resumoSemSpoiler!: string;

  @ApiPropertyOptional({
    description: 'Resumo com detalhes e acontecimentos importantes (spoilers)',
    example: 'Thanos reune as joias e estala os dedos.',
  })
  @IsOptional()
  @IsString()
  resumoComSpoiler?: string;

  @ApiPropertyOptional({
    description: 'URL do poster da obra',
    example: 'https://exemplo.com/poster.jpg',
  })
  @IsOptional()
  @IsString()
  imagemUrl?: string;
}
