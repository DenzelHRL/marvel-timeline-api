import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Matches, MaxLength, Min } from "class-validator";

export class CriarEventoDto{
    @IsString()
    @MaxLength(200)
    @Matches(/\S/, {message: 'O título não pode estar vazio'})
    @ApiProperty({ description: 'Título do acontecimento.', maxLength: 200 })
    titulo: string;

    @IsString()
    @Matches(/\S/, {message: 'A descrição não pode estar vazia'})
    @ApiProperty({ description: 'Descrição do acontecimento.' })
    descricao: string;
    
    @IsString()
    @MaxLength(40)
    @Matches(/\S/, {message: 'A categoria não pode estar vazia'})
    @ApiProperty({ description: 'Categoria do acontecimento.', maxLength: 40 })
    categoria: string;

    @IsInt()
    @Min(1)
    @ApiProperty({ description: 'Posição única na obra.', minimum: 1 })
    posicao: number;

    @IsBoolean()
    @ApiPropertyOptional({ description: 'Indica se contém spoiler. Padrão: false.', type: Boolean, default: false })
    spoiler= false ;
}
