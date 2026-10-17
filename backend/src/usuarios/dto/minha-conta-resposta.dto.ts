import {ApiProperty} from "@nestjs/swagger";

export class MinhaContaRespostaDTO{
    @ApiProperty({example: "f978107d-c2c7-4dc2-a069-39e90d960393"})
    id: string;

    @ApiProperty({example: "Tobias Leitor"})
    nome: string;

    @ApiProperty({example: "tobias.av.novo@marvel.test"})
    email: string;

    @ApiProperty({example: true})
    ativo:boolean;

    @ApiProperty({example: ['LEITOR'], type: [String]})
    perfis: string[];

    @ApiProperty({example: "2026-10-11T20:00:00Z"})
    criadoEm: Date;

    @ApiProperty({example: "2026-10-13T20:00:00Z"})
    atualizadoEm: Date;
}

export class PermissaoItemDTO{
    
    @ApiProperty({example: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"})
    id: string;
    
    @ApiProperty({example: "comentarios:criar"})
    codigo: string;

    @ApiProperty({example: "Cria um novo comentário para um obra publicada"})
    descricao: string;
}

export class MetaMinhasPermissoesDTO {
    @ApiProperty({example: 1, minimum: 1})
    pagina: number;

    @ApiProperty({example: 20, minimum: 1, maximum: 50})
    limite: number;

    @ApiProperty({example: 12, minimum: 0})
    total: number;

    @ApiProperty({example: 1, minimum: 0})
    totalPaginas: number;
}

export class ListaMinhasPermissoesRespostaDTO{
    @ApiProperty({type: [PermissaoItemDTO]})
    dados: PermissaoItemDTO[];

    @ApiProperty({type: () => MetaMinhasPermissoesDTO})
    meta: MetaMinhasPermissoesDTO;
}