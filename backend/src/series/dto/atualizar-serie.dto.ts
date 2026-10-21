import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AtualizarSerieDto {
  @ApiPropertyOptional({
    description: 'Titulo da serie',
    example: 'Gaviao Arqueiro (Edicao Especial)',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  titulo?: string;

  @ApiPropertyOptional({
    description: 'Slug identificador da serie',
    example: 'gaviao-arqueiro',
    maxLength: 160,
  })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  slug?: string;

  @ApiPropertyOptional({
    description: 'Descricao da serie',
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({
    description: 'URL do poster da serie',
  })
  @IsOptional()
  @IsString()
  imagemUrl?: string;
}
