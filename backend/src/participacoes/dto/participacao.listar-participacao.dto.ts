import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class ListarParticipacoesEmObrasDto{
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
    @ApiPropertyOptional({
      description: 'Busca por parte do papel do personagem na obra',
      maxLength: 40,
    })
    papel?: string;

    @IsOptional()
    @Transform(({ value }) => {
        if(value === 'true') return true;
        if(value === 'false') return false;

        return value;
    })
    @IsBoolean()
    @ApiPropertyOptional({
      description: 'Filtra participações pela presença com spoiler. Resultados com spoiler exigem incluirSpoilers=true',
    })
    presencaESpoiler?: boolean;

    @IsOptional()
    @Transform(({ value }) => {
        if(value === 'true') return true;
        if(value === 'false') return false;

        return value;
    })
    @IsBoolean()
    @IsBoolean()
    @ApiPropertyOptional({
      description: 'Autoriza revelar presenças e desfechos com spoilers. Quando omitido, os spoilers ficam ocultos',
    })
    incluirSpoilers?: boolean;
}
