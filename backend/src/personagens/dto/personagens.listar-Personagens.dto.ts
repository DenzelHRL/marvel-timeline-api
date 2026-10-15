import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class ListarPersonagensDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    pagina: number = 1;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limite: number = 20;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    nome?: string;

    @IsOptional()
    @IsString()
    @MaxLength(160)
    slug?: string;
}