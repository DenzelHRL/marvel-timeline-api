import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class ListarPersonagensDto {
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
    @MaxLength(200)
    @ApiPropertyOptional({
      description: 'Busca por parte do nome do personagem',
      maxLength: 200,
    })
    nome?: string;

    @IsOptional()
    @IsString()
    @MaxLength(160)
    @ApiPropertyOptional({
      description: 'Busca por parte do slug do personagem',
      maxLength: 160,
    })
    slug?: string;
}
