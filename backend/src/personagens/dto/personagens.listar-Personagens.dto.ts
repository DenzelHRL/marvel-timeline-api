import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class ListarPersonagensDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    pagina: number;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limite: number;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    nome?: string;

    @IsOptional()
    @IsString()
    @MaxLength(160)
    slug?: string;
}