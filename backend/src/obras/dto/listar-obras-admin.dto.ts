import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import type { StatusConteudo, TipoObra } from '../../database/entities/catalog.entities';

export class ListarObrasAdminDto {
  @ApiPropertyOptional({
    description: 'Filtro por tipo de obra (FILME ou TEMPORADA)',
    enum: ['FILME', 'TEMPORADA'],
    example: 'FILME',
  })
  @IsOptional()
  @IsIn(['FILME', 'TEMPORADA'])
  tipo?: TipoObra;

  @ApiPropertyOptional({
    description: 'Filtro por status da obra (RASCUNHO, PUBLICADA ou ARQUIVADA)',
    enum: ['RASCUNHO', 'PUBLICADA', 'ARQUIVADA'],
    example: 'RASCUNHO',
  })
  @IsOptional()
  @IsIn(['RASCUNHO', 'PUBLICADA', 'ARQUIVADA'])
  status?: StatusConteudo;

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
    description: 'Quantidade de registros por pagina (maximo 50)',
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
