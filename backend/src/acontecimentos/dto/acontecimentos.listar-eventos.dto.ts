import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class ListarEventosEmObrasDto{
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @ApiPropertyOptional({
        description: 'Número da página, a partir de 1, Padrão: 1',
    })
    pagina: number = 1;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    @ApiPropertyOptional({
        description: 'Quantidade de itens por página, entre 1 e 50. Padrão: 20',
    })
    limite: number = 20;

    @IsOptional()
    @IsString()
    @MaxLength(40)
    @ApiPropertyOptional({ description: 'Busca por parte da categoria.', maxLength: 40 })
    categoria?: string;

    @IsOptional()
    @Transform(({value}) =>{
        if(value === 'true') return true;
        if(value === 'false') return false;

        return value;
    })
    @IsBoolean()
    @ApiPropertyOptional({ description: 'Filtra por spoiler; resultados com spoiler exigem incluirSpoilers=true.' })
    contemSpoiler?: boolean;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean()
    @ApiPropertyOptional({
        description: 'Autoriza revelar acontecimentos com spoilers.',
    })
    incluirSpoilers?: boolean;
}
