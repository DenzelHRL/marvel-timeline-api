import { IsBoolean, IsInt, IsOptional, IsString, Matches, MaxLength, Min } from "class-validator";

export class CriarEventoDto{
    @IsString()
    @MaxLength(200)
    @Matches(/\S/, {message: 'O título não pode estar vazio'})
    titulo: string; 

    @IsString()
    @Matches(/\S/, {message: 'A descrição não pode estar vazia'})
    descricao: string;
    
    @IsString()
    @MaxLength(40)
    @Matches(/\S/, {message: 'A categoria não pode estar vazia'})
    categoria: string;

    @IsInt()
    @Min(1)
    posicao: number;

    @IsBoolean()
    spoiler= false ;
}