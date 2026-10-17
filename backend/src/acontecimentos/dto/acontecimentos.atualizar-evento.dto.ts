import { IsInt, IsBoolean, IsOptional, IsString, Matches, MaxLength, ValidateIf, Min } from "class-validator";

export class AtualizarEventoDto{    
    @ValidateIf((_objeto, valor) => valor !== undefined)
    @IsInt()
    @Min(1)
    posicao?: number;

    @IsString()
    @MaxLength(200)
    @Matches(/\S/, {message: 'O título não pode estar vazio'})
    titulo: string; 

    @ValidateIf((_objeto, valor) => valor !== undefined)
    @IsString()
    descricao?: string;
    
    @ValidateIf((_objeto, valor) => valor !== undefined)
    @IsString()
    @MaxLength(40)
    categoria?: string;

    @ValidateIf((_objeto, valor) => valor !== undefined)
    @IsBoolean()
    spoiler?: boolean ;
}