import { Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class ListarParticipacoesEmObrasDto{
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
    @MaxLength(40)
    papel?: string;

    @IsOptional()
    @Transform(({ value }) => {
        if(value === 'true') return true;
        if(value === 'false') return false;

        return value;
    })
    @IsBoolean()
    presencaESpoiler?: boolean;

    @IsOptional()
    @Transform(({ value }) => {
        if(value === 'true') return true;
        if(value === 'false') return false;

        return value;
    })
    @IsBoolean()
    @IsBoolean()
    incluirSpoilers?: boolean;
}