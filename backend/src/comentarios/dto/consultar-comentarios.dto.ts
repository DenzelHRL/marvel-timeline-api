import {ApiPropertyOptional} from '@nestjs/swagger';
import {Type, Transform} from 'class-transformer';
import {IsBoolean, IsInt, IsOptional, IsUUID, Max, Min} from 'class-validator';

export class ConsultarComentariosDTO {
    //Propriedade Filtro contemSpoiler
    @ApiPropertyOptional({
        description:"Comentário contém ou não spoiler",
        example: false,
    })
    @IsOptional()
    @Transform(({value}) => value === 'true' || value === true)
    @IsBoolean()
    contemSpoiler?: boolean;

    //Propriedade Filtro usuarioId
    @ApiPropertyOptional({
        description:"Comentário de um usuário em específico",
        example:"d3b07384-d113-469e-a611-3965b7582c04",
    })
    @IsOptional()
    @IsUUID('4', {message: "usuarioId deve ser um UUID válido"})
    usuarioId?: string;

    //Regra de negócio R03: revelarSpoilers explícito
    @ApiPropertyOptional({
        description:"Se a variável for 'true', revela o texto de comentários marcados como spoiler",
        default: false,
    })
    @IsOptional()
    @Transform(({value}) => value === 'true' || value === true)
    @IsBoolean()
    revelarSpoilers?: boolean;

    //Paginação: página atual
    @ApiPropertyOptional({default: 1, minimum: 1})
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    pagina?: number = 1;

    //Paginação: limite por página -> min = 1, max = 50 (definido na matriz)
    @ApiPropertyOptional({default: 20, minimum: 1, maximum: 50})
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limite?: number = 20;
}