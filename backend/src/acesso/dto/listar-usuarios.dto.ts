import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {IsInt,IsNotEmpty, IsOptional, IsString, Max,MaxLength, Min} from 'class-validator';

export class ListarUsuariosDto {
  @ApiPropertyOptional({
    description: 'Busca geral com filtros opcionais.',
    maxLength: 160,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  nome?: string;

  @ApiPropertyOptional({
    description: 'Busca geral com filtros opcionais.',
    maxLength: 254,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({
    description: 'Número da página.',
    type: Number,
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina = 1;

  @ApiPropertyOptional({
    description: 'Quantidade de contas por página.',
    type: Number,
    default: 20,
    minimum: 1,
    maximum: 50,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limite = 20;
}
