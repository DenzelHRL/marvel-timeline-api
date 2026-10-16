import { IsInt, IsBoolean, IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class AtualizarEventoDto{    
    @IsOptional()
    @IsInt()
    posicao: number | null;;

    @IsString()
    @MaxLength(200)
    @Matches(/\S/, {message: 'O título não pode estar vazio'})
    titulo: string | null;; 

    @IsOptional()
    @IsString()
    descricao?: string | null;
    
    @IsOptional()
    @IsString()
    @MaxLength(40)
    categoria?: string | null;;

    @IsBoolean()
    spoiler= false ;
}