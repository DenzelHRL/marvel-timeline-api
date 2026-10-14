import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsIn,
  IsUUID,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class ListarEtapasDto {
  @ApiPropertyOptional({
    description: 'Filtrar pela prioridade da etapa.',
    enum: ['PRINCIPAL', 'CONTEXTO'],
  })
  @IsOptional()
  @IsIn(['PRINCIPAL', 'CONTEXTO'])
  prioridade?: 'PRINCIPAL' | 'CONTEXTO';

  @ApiPropertyOptional({
    description: 'Filtrar pelo ID da obra vinculada à etapa.',
    type: String,
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  obraId?: string;

  @ApiPropertyOptional({
    type: Number,
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina: number = 1;

  @ApiPropertyOptional({
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