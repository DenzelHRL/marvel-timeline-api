import { ApiProperty } from '@nestjs/swagger';
export class AcontecimentoRespostaDto{
    @ApiProperty({ description: 'Identificador do acontecimento.', format: 'uuid' })
    id: string;
    @ApiProperty({ description: 'Identificador da obra.', format: 'uuid' })
    obraId: string;
    @ApiProperty({ description: 'Título do acontecimento.', maxLength: 200 })
    titulo: string;
    @ApiProperty({ description: 'Categoria do acontecimento.', maxLength: 40 })
    categoria: string;
    @ApiProperty({ description: 'Posição dentro da obra.', minimum: 1 })
    posicao: number;
    @ApiProperty({ description: 'Descrição do acontecimento.', type: String })
    descricao: string | null;
    @ApiProperty({ description: 'Indica se contém spoiler.' })
    contemSpoiler: boolean;
}
