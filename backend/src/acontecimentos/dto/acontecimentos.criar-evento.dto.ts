import { IsBoolean, IsInt, IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class CriarEventoDto{
    @IsString()
    @MaxLength(200)
    @Matches(/\S/, {message: 'O título não pode estar vazio'})
    titulo: string; 

    @IsOptional()
    @IsString()
    descricao?: string | null;
    
    @IsOptional()
    @IsString()
    @MaxLength(40)
    categoria?: string;

    @IsOptional()
    @IsInt()
    posicao: number;

    @IsBoolean()
    spoiler= false ;
}