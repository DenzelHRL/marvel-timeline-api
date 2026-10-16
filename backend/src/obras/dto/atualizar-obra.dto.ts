import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { TipoObra } from '../../database/entities/catalog.entities';

export class AtualizarObraDto {
  @ApiPropertyOptional({
    description: 'Titulo da obra',
    example: 'Vingadores: Guerra Infinita (Edicao Estendida)',
    maxLength: 220,
  })
  @IsOptional()
  @IsString()
  @MaxLength(220)
  titulo?: string;

  @ApiPropertyOptional({
    description: 'Slug identificador da obra',
    example: 'vingadores-guerra-infinita',
    maxLength: 180,
  })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  slug?: string;

  @ApiPropertyOptional({
    description: 'Tipo da obra',
    enum: ['FILME', 'TEMPORADA'],
  })
  @IsOptional()
  @IsIn(['FILME', 'TEMPORADA'])
  tipo?: TipoObra;

  @ApiPropertyOptional({
    description: 'Ano de lancamento',
    example: 2018,
    minimum: 1900,
    maximum: 2100,
  })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  anoLancamento?: number;

  @ApiPropertyOptional({
    description: 'UUID da serie a qual pertence',
    format: 'uuid',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  serieId?: string | null;

  @ApiPropertyOptional({
    description: 'Numero da temporada',
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  numeroTemporada?: number | null;

  @ApiPropertyOptional({
    description: 'Resumo livre de spoilers',
  })
  @IsOptional()
  @IsString()
  resumoSemSpoiler?: string;

  @ApiPropertyOptional({
    description: 'Resumo com spoilers',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  resumoComSpoiler?: string | null;

  @ApiPropertyOptional({
    description: 'URL do poster da obra',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  imagemUrl?: string | null;
}
