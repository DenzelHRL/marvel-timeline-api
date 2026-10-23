import {ApiPropertyOptional} from "@nestjs/swagger";
import {Type, Transform} from "class-transformer";
import {IsBoolean, IsIn, IsInt, IsOptional, Max, Min} from "class-validator";
import type {StatusComentario} from "../../database/entities/comment.entity";

export class ConsultarMeusComentariosDTO{
    @ApiPropertyOptional({
        description:"Filtrar por status do comentário",
        enum:["PUBLICADO", "OCULTO", "REMOVIDO"],
        example: "PUBLICADO"
    })
    @IsOptional()
    @IsIn(["PUBLICADO", "OCULTO", "REMOVIDO"], {
        message: "status deve ser PUBLICADO, OCULTO ou REMOVIDO"
    })
    status?: StatusComentario;

    @ApiPropertyOptional({
        description: "Filtrar comentários que contenham ou não spoiler",
        example: false
    })
    @IsOptional()
    @Transform(({value}) => value === "true" || value === true)
    @IsBoolean()
    contemSpoiler?: boolean;

    @ApiPropertyOptional({ default: 1, minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    pagina?: number = 1;

    @ApiPropertyOptional({default: 20, minimum: 1, maximum: 50})
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limite?: number = 20;
}