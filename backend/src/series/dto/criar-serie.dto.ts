import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CriarSerieDto {
  @ApiProperty({
    description: 'Titulo da serie',
    example: 'Gaviao Arqueiro',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  titulo!: string;

  @ApiProperty({
    description: 'Slug identificador unico',
    example: 'gaviao-arqueiro',
    maxLength: 160,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  slug!: string;

  @ApiProperty({
    description: 'Descricao da serie',
    example: 'Clint Barton e Kate Bishop enfrentam inimigos do passado.',
  })
  @IsString()
  @IsNotEmpty()
  descricao!: string;

  @ApiPropertyOptional({
    description: 'URL do poster da serie',
    example: 'https://exemplo.com/gaviao.jpg',
  })
  @IsOptional()
  @IsString()
  imagemUrl?: string;
}
