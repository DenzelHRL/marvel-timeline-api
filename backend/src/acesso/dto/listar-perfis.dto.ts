import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty,IsOptional, IsString, Max, MaxLength, Min} from 'class-validator';

export class ListarPerfisDto {
  @ApiPropertyOptional({
    description: 'Busca por parte do código do perfil.',
    maxLength: 60,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  codigo?: string;

  @ApiPropertyOptional({
    description: 'Busca por parte da descrição do perfil.',
    maxLength: 500,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  descricao?: string;

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
    description: 'Quantidade de perfis por página.',
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
