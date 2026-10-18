import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsBoolean, IsOptional, IsString, Matches, MaxLength, ValidateIf, Min } from "class-validator";

export class AtualizarEventoDto{    
    @ValidateIf((_objeto, valor) => valor !== undefined)
    @IsInt()
    @Min(1)
    @ApiPropertyOptional({ description: 'Nova posição disponível na obra.', minimum: 1 })
    posicao?: number;

    @ValidateIf((_objeto, valor) => valor !== undefined)
    @IsString()
    @MaxLength(200)
    @Matches(/\S/, {message: 'O título não pode estar vazio'})
    @ApiPropertyOptional({ description: 'Novo título. Não aceita null ou texto vazio.', maxLength: 200 })
    titulo?: string;

    @ValidateIf((_objeto, valor) => valor !== undefined)
    @IsString()
    @ApiPropertyOptional({ description: 'Nova descrição. Não aceita null.' })
    descricao?: string;
    
    @ValidateIf((_objeto, valor) => valor !== undefined)
    @IsString()
    @MaxLength(40)
    @ApiPropertyOptional({ description: 'Nova categoria. Não aceita null.', maxLength: 40 })
    categoria?: string;

    @ValidateIf((_objeto, valor) => valor !== undefined)
    @IsBoolean()
    @ApiPropertyOptional({ description: 'Novo indicador de spoiler. Omitir mantém o valor atual.' })
    spoiler?: boolean ;
}