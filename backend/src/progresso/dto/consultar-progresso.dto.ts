import {ApiPropertyOptional} from "@nestjs/swagger";
import {Type} from "class-transformer";
import {IsInt, IsIn, IsOptional, IsUUID, Max, Min} from "class-validator";

export class ConsultarProgressoDTO{
    
    //Filtro: status
    @ApiPropertyOptional({
        description: "Filtrar por status do progresso",
        enum: ["QUERO_VER", "ASSISTINDO", "CONCLUIDO"],
        example: "CONCLUIDO"
    })
    @IsOptional()
    @IsIn(["QUERO_VER", "ASSISTINDO", "CONCLUIDO"])
    status?: "QUERO_VER" | "ASSISTINDO" | "CONCLUIDO";

    //Filtro: obraId
    @ApiPropertyOptional({
        description: "Filtrar por UUID de uma obra específica",
        example:"d3b07384-d113-469e-a611-3965b7582c04"
    })
    @IsOptional()
    @IsUUID(4, {message: "obraId deve ser um UUID válido"})
    obraId?: string;

    //Paginação
    @ApiPropertyOptional({default: 1, minimum: 1})
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