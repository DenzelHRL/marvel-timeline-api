import {ApiPropertyOptional} from "@nestjs/swagger";
import{Transform} from "class-transformer";
import {IsEmail, IsOptional, IsString, MaxLength, MinLength} from "class-validator";

export class AtualizarMinhaContaDTO{
    @ApiPropertyOptional({
        description: "Novo nome completo do usuario",
        example: "Tobias Avellar",
        maxLength: 160
    })
    @IsOptional()
    @IsString({message: "nome deve ser uma string"})
    @MinLength(2, {message: "nome deve ter no mínimo 2 caracteres"})
    @MaxLength(160, {message: "nome deve ter no máximo 160 caracteres"})
    nome?: string;

    @ApiPropertyOptional({
        description: "Novo email do usuário",
        example: "tobias.av.novo@marvel.test",
        maxLength: 254
    })
    @IsOptional()
    @IsEmail({}, {message: "email informado inválido."})
    @MaxLength(254, {message: "email deve ter no máximo 254 caracteres"})
    @Transform(({value}) => (typeof value === "string" ? value.trim().toLowerCase() : value))
    email?:string;
}