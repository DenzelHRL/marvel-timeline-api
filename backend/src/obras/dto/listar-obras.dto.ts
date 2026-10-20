import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import type { TipoObra } from '../../database/entities/catalog.entities';

export class ListarObrasDto {
  @ApiPropertyOptional({
    description: 'Filtro por tipo de obra (FILME ou TEMPORADA)',
    enum: ['FILME', 'TEMPORADA'],
    example: 'FILME',
  })
  @IsOptional()
  @IsIn(['FILME', 'TEMPORADA'])
  tipo?: TipoObra;

  @ApiPropertyOptional({
    description: 'Filtro pelo ano de lancamento da obra',
    type: Number,
    example: 2018,
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
    description: 'Numero da pagina',
    type: Number,
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina: number = 1;

  @ApiPropertyOptional({
    description: 'Quantidade de registros por pagina',
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
