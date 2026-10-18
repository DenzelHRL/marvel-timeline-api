import {ApiPropertyOptional} from "@nestjs/swagger";
import{Type} from "class-transformer";
import {IsInt, IsOptional, IsString, Max, Min} from "class-validator";


export class ConsultarMinhasPermissoesDTO{
    //Filtro código
    @ApiPropertyOptional({
        description: "Filtrar por 'código' da permissão",
        example: "comentarios:",
    })
    @IsOptional()
    @IsString()
    codigo?: string;

    //Filtro termo
    @ApiPropertyOptional({
        description: "Filtrar por 'termo' na descrição da permissão",
        example: "comentar",
    })
    @IsOptional()
    @IsString()
    descricao?: string;

    //Página
    @ApiPropertyOptional({default: 1, minimum: 1})
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    pagina?: number = 1;

    //Limite página
    @ApiPropertyOptional({default: 20, minimum: 1, maximum: 50})
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limite?: number = 20;    
}