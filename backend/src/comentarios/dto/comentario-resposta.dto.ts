import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';

export class ComentarioItemDTO {
    @ApiProperty({example: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"})
    id: string;

    @ApiProperty({example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"})
    obraId: string;

    @ApiProperty({example: "d3b07384-d113-469e-a611-3965b7582c04"})
    usuarioId: string;

    @ApiProperty({
        example: "Filme espetacular!",
        description: "Texto do comentário. Se for spoiler e revelarSpoilers=false, virá mascarado.",
    })
    texto: string;

    @ApiProperty({example:false})
    contemSpoiler: boolean;

    @ApiProperty({example:"2026-09-30T20:00:00Z"})
    criadoEm: Date;
}

export class MetaPaginacaoDTO {
    @ApiProperty({example: 1})
    pagina: number;

    @ApiProperty({example: 20})
    limite: number;

    @ApiProperty({example: 45})
    total: number;

    @ApiProperty({example: 3})
    totalPaginas: number;    
}

export class ListaComentariosRespostaDTO {
    @ApiProperty({type: [ComentarioItemDTO]})
    dados: ComentarioItemDTO[];

    @ApiProperty({type: MetaPaginacaoDTO})
    meta: MetaPaginacaoDTO;
}