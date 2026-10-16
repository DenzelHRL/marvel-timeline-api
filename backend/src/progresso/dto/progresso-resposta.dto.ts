import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";

export class ItemProgressoDTO{
    @ApiProperty({example: "f978107d-c2c7-4dc2-a069-39e90d960393"})
    usuarioId: string;

    @ApiProperty({example: "f978107d-c2c7-4dc2-a069-39e90d960393"})
    obraId:string;

    @ApiProperty({example: "CONCLUIDO", enum: ["QUERO_VER", "ASSISTINDO", "CONCLUIDO"]})
    status: string;

    @ApiPropertyOptional({example: "2026-10-15T20:00:00.00Z", nullable:true})
    concluidoEm: Date | null;

    @ApiProperty({example: "2026-10-15T20:00:00.00Z"})
    atualizadoEm: Date;
}

export class ListaProgressoRespostaDTO{
    @ApiProperty({type: [ItemProgressoDTO]})
    dados: ItemProgressoDTO[];

    @ApiProperty({
        example: {pagina:1, limite:20, total:5, totalPaginas:1}
    })
    meta:{
        pagina: number;
        limte: number;
        total: number;
        totalPaginas: number;
    };
}

export class ResumoProgressoTrilhaDTO{
    @ApiProperty({example: "rumo-a-doutor-destino-curta"})
    trilhaSlug: string;

    @ApiProperty({example: "Rumo a Doutor Destino - trilha curta"})
    trilhaNome: string;

    @ApiProperty({example: 20, description: "Total de obras únicas da trilha"})
    totalObras: number;
    
    @ApiProperty({example: 5, description: "Obras concluídas pelo usuário"})
    concluidas: number;

    @ApiProperty({example: 2, description: "Obras que o usuário está assistindo"})
    emAndamento: number;

    @ApiProperty({example: 3, description: "Obras que o usuário quer ver"})
    queroVer: number;
    
    @ApiProperty({example: 10, description: "Obras ainda não iniciadas"})
    nãoIniciadas: number;

    @ApiProperty({example: 25.0, description: "Percentual de conclusão da trilha (0 a 100%)"})
    percentualConclusao: number;
}