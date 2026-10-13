import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";
import {IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength} from "class-validator";

export class AtualizarComentarioDTO{
    @ApiProperty({
        description: "Novo texto do comentário",
        example: "Texto editado: cena pós-créditos PIKA! Filme absurdo",
        minLength: 3, 
        maxLength: 1000
    })
    @IsString({message: "texto deve ser uma string"})
    @IsNotEmpty({message: "texto não pode ser vazio"})
    @MinLength(3, {message: "texto deve ter no mínimo 3 caracteres"})
    @MaxLength(1000, {message: "texto deve ter no máximo 1000 caracateres"})
    texto?: string;

    @ApiPropertyOptional({
        description: "Atualiza indicador de spoiler",
        example: true
    })
    @IsOptional()
    @IsBoolean({message: "contemSpoiler deve ser um booleano"})
    contemSpoiler?: boolean;

}