import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class ListarTrilhasDto {
  @ApiPropertyOptional({
    description: 'Busca por parte do nome, sem diferenciar maiúsculas.',
    type: String,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nome?: string;

  @ApiPropertyOptional({
    description: 'Filtro pelo slug exato da trilha.',
    type: String,
    example: 'curta',
    maxLength: 160,
  })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  slug?: string;

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
    description: 'Quantidade de trilhas por página.',
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